import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { applyGPRow, isDateStr } from '@/lib/shopReport'
import { checkEditPermission } from '@/lib/auditRules'

export const dynamic = 'force-dynamic'

/**
 * Save edited / newly added "Выпуск ГП" rows (one row per date).
 * Body: { rows: [{ date, editReason?, ...outputs }] }
 * 
 * Strict Enterprise Audit Rules:
 * - Non-admins can only edit existing GP records within 24 hours of creation
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

    const byDate = new Map<string, any>()
    rows.forEach((r) => byDate.set(r.date, r))

    const now = new Date()
    let saved = 0

    await prisma.$transaction(
      async (tx) => {
        for (const [date, row] of byDate) {
          const existing = await tx.shopExpense.findUnique({ where: { date } })
          const outputs = applyGPRow(existing?.outputs, row)
          const prevBalances = ((existing?.balances as any) || {}) as Record<string, any>

          if (existing) {
            // Check edit permissions
            const perm = checkEditPermission({
              role: session.role,
              createdAt: existing.createdAt,
              now,
            })

            if (!perm.allowed) {
              throw new Error(`[GP Chiqishi - Sana: ${date}]: ${perm.reason}`)
            }

            // Check if outputs actually changed
            const isChanged = JSON.stringify(outputs) !== JSON.stringify(existing.outputs || {})

            let isEdited = existing.isEdited
            let editReason = existing.editReason
            let editedAt = existing.editedAt
            let editedBy = existing.editedBy

            if (isChanged) {
              const reason = String(row.editReason ?? '').trim()
              if (!reason && !existing.editReason) {
                throw new Error(
                  `${date} sanadagi Tayyor Mahsulot (GP) ma'lumotlari o'zgartirilmoqda. O'zgartirish sababini ko'rsatish majburiy!`
                )
              }
              if (reason) {
                isEdited = true
                editReason = reason
                editedAt = now
                editedBy = session.name || session.role || 'Foydalanuvchi'
              }
            }

            const balances = {
              ...prevBalances,
              gpMeta: { updatedBy: session.name, updatedAt: now.toISOString() },
            }

            await tx.shopExpense.update({
              where: { date },
              data: {
                outputs,
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
              gpMeta: { updatedBy: session.name, updatedAt: now.toISOString() },
            }

            await tx.shopExpense.create({
              data: {
                date,
                outputs,
                balances,
                materials: {},
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
    console.error('Shop GP save error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

/**
 * Delete GP record for a date.
 * Strictly restricted to ADMIN or DIRECTOR only.
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isAdmin = session.role === 'ADMIN' || session.role === 'DIRECTOR'
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Tayyor mahsulot (GP) ma'lumotlarini o'chirish taqiqlangan! Faqat Administrator o'chirish huquqiga ega." },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    if (!date) return NextResponse.json({ error: "Sana ko'rsatilmagan" }, { status: 400 })

    await prisma.shopExpense.delete({ where: { date } })
    return NextResponse.json({ success: true, deletedDate: date })
  } catch (error: any) {
    console.error('Shop GP delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
