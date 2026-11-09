import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { applyExpenseRow, isDateStr } from '@/lib/shopReport'
import { checkEditPermission, isAfterShiftHours } from '@/lib/auditRules'
import { recordShiftEditAudit } from '@/lib/auditImport'

export const dynamic = 'force-dynamic'

/**
 * Save edited / newly added "Расход" rows (one row per date).
 * Body: { rows: [{ date, editReason?, ...materials }] }
 * 
 * Strict Enterprise Audit Rules:
 * - Non-admins can only edit existing expense records within 24 hours of creation
 *   and during the 17:00 to 09:00 shift window.
 * - After 24 hours, ONLY ADMIN and DIRECTOR can edit.
 * - Edits to existing records require a mandatory editReason.
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role === 'SUPPLY') {
      return NextResponse.json({ error: "Supply roli shop-report ma'lumotlarini faqat ko'rishi mumkin" }, { status: 403 })
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

    // If the same date appears twice, the last edited row wins
    const byDate = new Map<string, any>()
    rows.forEach((r) => byDate.set(r.date, r))

    const now = new Date()
    let saved = 0

    await prisma.$transaction(
      async (tx) => {
        for (const [date, row] of byDate) {
          const existing = await tx.shopExpense.findUnique({ where: { date } })
          const materials = applyExpenseRow(existing?.materials, row)
          const prevBalances = ((existing?.balances as any) || {}) as Record<string, any>

          if (existing) {
            // Check edit permissions
            const perm = checkEditPermission({
              role: session.role,
              createdAt: existing.createdAt,
              now,
            })

            if (!perm.allowed) {
              throw new Error(`[Chiqim - Sana: ${date}]: ${perm.reason}`)
            }

            // Check if materials actually changed
            const isChanged = JSON.stringify(materials) !== JSON.stringify(existing.materials || {})

            let isEdited = existing.isEdited
            let editReason = existing.editReason
            let editedAt = existing.editedAt
            let editedBy = existing.editedBy

            const isAfter17 = isAfterShiftHours(now)
            if (isChanged) {
              const reason = String(row.editReason ?? '').trim()
              if (isAfter17 && (!reason || reason.length < 10) && session.role !== 'ADMIN') {
                throw new Error(
                  `${date} sanadagi Chiqim soat 17:00 dan keyin o'zgartirilmoqda. Kamida 10 ta belgidan iborat rasmiy sabab (izoh) kiritish majburiy!`
                )
              }
              if (!reason && !existing.editReason) {
                throw new Error(
                  `${date} sanadagi Chiqim (Расход) ma'lumotlari o'zgartirilmoqda. O'zgartirish sababini ko'rsatish majburiy!`
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
                  targetTitle: 'Chiqimlar Jurnali (Outbound / Rashod)',
                  reason,
                  details: `${date} sanasidagi chiqim ma'lumotlari yangilandi`,
                  isAfter17,
                })
              }
            }

            const balances = {
              ...prevBalances,
              expenseMeta: { updatedBy: session.name, updatedAt: now.toISOString() },
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
            const balances = {
              ...prevBalances,
              expenseMeta: { updatedBy: session.name, updatedAt: now.toISOString() },
            }

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

    return NextResponse.json({ success: true, saved })
  } catch (error: any) {
    console.error('Shop expenses save error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

/**
 * Delete expense record for a date.
 * Strictly restricted to ADMIN or DIRECTOR only.
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isAdmin = session.role === 'ADMIN' || session.role === 'DIRECTOR'
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Chiqim ma'lumotlarini o'chirish taqiqlangan! Faqat Administrator o'chirish huquqiga ega." },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    if (!date) return NextResponse.json({ error: "Sana ko'rsatilmagan" }, { status: 400 })

    await prisma.shopExpense.delete({ where: { date } })
    return NextResponse.json({ success: true, deletedDate: date })
  } catch (error: any) {
    console.error('Shop expense delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
