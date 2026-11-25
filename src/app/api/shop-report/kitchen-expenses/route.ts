import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { applyKitchenExpenseRow, isDateStr } from '@/lib/shopReport'
import { checkEditPermission, isAfterShiftHours } from '@/lib/auditRules'
import { recordShiftEditAudit } from '@/lib/auditImport'
import { syncInventoryBatchesFromDailyBalances } from '@/lib/fifoSync'
import { invalidateSupplyDashboardCache } from '@/lib/supplyDashboardCache'

export const dynamic = 'force-dynamic'

/**
 * Save edited / newly added Kitchen Expense rows (one row per date).
 * Body: { rows: [{ date, editReason?, tomatoes?, cucumber?, ... }] }
 * 
 * Strict Enterprise Audit Rules (exact warehouse rules applied to kitchen):
 * - Non-admins can only edit existing expense records within 24 hours of creation.
 * - Edits after 17:00 require a mandatory editReason with minimum 10 characters.
 * - Edits to existing saved records require an editReason.
 * - Supply and QC roles are read-only.
 * - Synchronizes with ShopExpense.balances.kitchen and ShopExpense.materials['КУХНЯ'].
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const normRole = String(session.role || '').toUpperCase().trim()
    if (normRole === 'SUPPLY' || normRole === 'QUALITY_CONTROL') {
      return NextResponse.json(
        { error: "Sifat nazoratchisi (QC) va Ta'minotchi uchun ushbu bo'lim faqat ko'rish rejimida. Tahrirlash huquqi yo'q." },
        { status: 403 }
      )
    }

    const body = await req.json()
    const rows: any[] = Array.isArray(body?.rows) ? body.rows : []
    if (rows.length === 0) return NextResponse.json({ success: true, saved: 0 })

    const invalid = rows.filter((r) => !isDateStr(r?.date))
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Sana noto'g'ri yoki kiritilmagan (${invalid.length} ta qator)` },
        { status: 400 }
      )
    }

    const byDate = new Map<string, any>()
    rows.forEach((r) => byDate.set(r.date, r))

    const now = new Date()
    let saved = 0

    await prisma.$transaction(
      async (tx) => {
        for (const [date, row] of byDate) {
          const existing = await tx.shopExpense.findUnique({ where: { date } })
          const { balances, totalKg } = applyKitchenExpenseRow(existing?.balances, row)

          const materials: Record<string, any> = {
            ...((existing?.materials as any) || {}),
          }
          if (totalKg > 0) {
            materials['КУХНЯ'] = totalKg
          } else {
            delete materials['КУХНЯ']
            delete materials['Кухня']
            delete materials['Ошхона']
          }

          if (existing) {
            const perm = checkEditPermission({
              role: session.role,
              createdAt: existing.createdAt,
              now,
            })

            if (!perm.allowed) {
              throw new Error(`[Oshxona Chiqimi - Sana: ${date}]: ${perm.reason}`)
            }

            const prevKitchen = ((existing?.balances as any)?.kitchen || {}) as Record<string, any>
            const isChanged = JSON.stringify(prevKitchen) !== JSON.stringify(balances.kitchen || {})

            let isEdited = existing.isEdited
            let editReason = existing.editReason
            let editedAt = existing.editedAt
            let editedBy = existing.editedBy

            const isAfter17 = isAfterShiftHours(now)
            if (isChanged) {
              const reason = String(row.editReason ?? '').trim()
              if (isAfter17 && (!reason || reason.length < 10) && session.role !== 'ADMIN') {
                throw new Error(
                  `${date} sanadagi Oshxona Chiqimi soat 17:00 dan keyin o'zgartirilmoqda. Kamida 10 ta belgidan iborat rasmiy sabab (izoh) kiritish majburiy!`
                )
              }
              if (!reason && !existing.editReason && isAfter17) {
                throw new Error(
                  `${date} sanadagi Oshxona Chiqimi ma'lumotlari o'zgartirilmoqda. O'zgartirish sababini ko'rsatish majburiy!`
                )
              }
              if (reason) {
                isEdited = true
                editReason = reason
                editedAt = now
                editedBy = session.name || session.role || 'Foydalanuvchi'

                await recordShiftEditAudit({
                  userId: session.id,
                  userName: session.name || session.role || 'Omborchi',
                  userRole: session.role || 'WAREHOUSE',
                  date,
                  target: 'CHIQIM',
                  targetTitle: 'Xodimlar Oshxonasi Chiqimlari Jurnali',
                  reason,
                  details: `${date} sanasidagi xodimlar oshxonasi chiqim ma'lumotlari yangilandi (${totalKg} kg)`,
                  isAfter17,
                })
              }
            }

            await tx.shopExpense.update({
              where: { date },
              data: {
                materials,
                balances,
                isEdited,
                editReason,
                editedAt,
                editedBy,
              },
            })
          } else {
            // New record for this date
            await tx.shopExpense.create({
              data: {
                date,
                materials,
                balances,
                isEdited: false,
              },
            })
          }
          saved++
        }
      },
      { timeout: 60000, maxWait: 10000 }
    )

    if (saved > 0) {
      await syncInventoryBatchesFromDailyBalances().catch((e) => console.error('FIFO sync after kitchen expenses save error:', e))
      try {
        invalidateSupplyDashboardCache()
      } catch {}
    }

    return NextResponse.json({ success: true, saved })
  } catch (error: any) {
    console.error('Kitchen expenses save error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

/**
 * Delete kitchen expense record for a date (clears kitchen breakdown and resets kitchen total).
 * Restricted to ADMIN and DIRECTOR.
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isAdmin = session.role === 'ADMIN' || session.role === 'DIRECTOR'
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Oshxona chiqim ma'lumotlarini o'chirish taqiqlangan! Faqat Administrator o'chirish huquqiga ega." },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    if (!date) return NextResponse.json({ error: "Sana ko'rsatilmagan" }, { status: 400 })

    const existing = await prisma.shopExpense.findUnique({ where: { date } })
    if (existing) {
      const balances = { ...((existing.balances as any) || {}) }
      delete balances.kitchen

      const materials = { ...((existing.materials as any) || {}) }
      delete materials['КУХНЯ']
      delete materials['Кухня']
      delete materials['Ошхона']

      await prisma.shopExpense.update({
        where: { date },
        data: { balances, materials },
      })

      await syncInventoryBatchesFromDailyBalances().catch((e) => console.error('FIFO sync after kitchen expense delete error:', e))
      try {
        invalidateSupplyDashboardCache()
      } catch {}
    }

    return NextResponse.json({ success: true, deletedDate: date })
  } catch (error: any) {
    console.error('Kitchen expense delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
