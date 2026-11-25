import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { isDateStr, toNum } from '@/lib/shopReport'
import { getNextShopArrivalBatch, normalizeProductKey, parseDateToYearMonth } from '@/lib/batchNumbering'
import { checkEditPermission, isAfterShiftHours } from '@/lib/auditRules'
import { recordShiftEditAudit } from '@/lib/auditImport'
import { syncInventoryBatchesFromDailyBalances } from '@/lib/fifoSync'
import { invalidateSupplyDashboardCache } from '@/lib/supplyDashboardCache'
import { syncIncomingActFromArrival } from '@/lib/incoming-acts/autoAct'

export const dynamic = 'force-dynamic'

/**
 * Save edited / newly added "Приход" rows.
 * Body: { rows: [{ id?, date, nomenclature, quantity, supplier, batch, editReason? }] }
 * 
 * Strict Enterprise Audit Rules:
 * - General staff (skladchi/warehouse/etc) can only edit within 24 hours of creation.
 * - Non-admin edits are restricted to the 17:00 to 09:00 shift window (UZT).
 * - After 24 hours, ONLY ADMIN and DIRECTOR can edit or delete.
 * - Any edit to an existing record requires a mandatory editReason.
 * - Modified records are stamped with isEdited = true, editedAt, editedBy, and editReason.
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
    if (rows.length === 0) return NextResponse.json({ success: true, updated: 0, created: 0 })

    const invalid = rows.filter((r) => !isDateStr(r?.date))
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Sana noto'g'ri yoki kiritilmagan (${invalid.length} ta qator)` },
        { status: 400 }
      )
    }

    let updated = 0
    let created = 0
    const syncedArrivals: Array<{
      id?: number
      date: string
      nomenclature: string
      quantity: number
      supplier?: string | null
      batch?: string | null
      temperature?: number | null
    }> = []

    await prisma.$transaction(
      async (tx) => {
        // Track generated batch numbers for same product in same month during this batch request
        const inFlightBatches = new Map<string, number>()

        for (const r of rows) {
          const nom = String(r.nomenclature ?? '').trim()
          const cleanNom = normalizeProductKey(nom)
          let batchStr = String(r.batch ?? '').trim()
          const dateStr = String(r.date ?? '').trim()
          const id = Number(r.id)

          // If batch is empty or explicitly 'auto', calculate the next sequential monthly number
          if (cleanNom && (!batchStr || batchStr.toLowerCase() === 'auto')) {
            const { yearMonth } = parseDateToYearMonth(dateStr)
            const key = `${cleanNom}:::${yearMonth}`

            if (!inFlightBatches.has(key)) {
              const nextVal = await getNextShopArrivalBatch(nom, dateStr, tx)
              const nextNum = parseInt(nextVal, 10) || 1
              inFlightBatches.set(key, nextNum)
              batchStr = String(nextNum)
            } else {
              const nextNum = (inFlightBatches.get(key) || 1) + 1
              inFlightBatches.set(key, nextNum)
              batchStr = String(nextNum)
            }
          }

          if (Number.isInteger(id) && id > 0) {
            // Update existing record
            const existing = await tx.shopArrival.findUnique({ where: { id } })
            if (!existing) {
              throw new Error(`Yozuv topilmadi (ID: ${id})`)
            }

            // Check permissions (24h window + 17:00-09:00 window for non-admins)
            const perm = checkEditPermission({
              role: session.role,
              createdAt: existing.createdAt,
            })

            if (!perm.allowed) {
              throw new Error(`[Qator #${id} - ${existing.nomenclature}]: ${perm.reason}`)
            }

            // Check if values actually changed
            const newQty = toNum(r.quantity)
            const newSupp = String(r.supplier ?? '').trim()
            const tempVal = r.temperature !== undefined && r.temperature !== null && r.temperature !== '' ? Number(r.temperature) : null
            const isChanged =
              existing.date !== dateStr ||
              existing.nomenclature !== nom ||
              Math.abs(existing.quantity - newQty) > 0.0001 ||
              (existing.supplier || '') !== newSupp ||
              (existing.batch || '') !== batchStr ||
              existing.temperature !== tempVal

            const isAfter17 = isAfterShiftHours(new Date())
            if (isChanged) {
              const reason = String(r.editReason ?? '').trim()
              if (isAfter17 && (!reason || reason.length < 10) && session.role !== 'ADMIN') {
                throw new Error(
                  `«${nom || existing.nomenclature}» yozuvi soat 17:00 dan keyin o'zgartirilmoqda. Kamida 10 ta belgidan iborat rasmiy sabab (izoh) kiritish majburiy!`
                )
              }
              if (!reason) {
                throw new Error(
                  `«${nom || existing.nomenclature}» yozuvi o'zgartirilmoqda. O'zgartirish sababini ko'rsatish majburiy!`
                )
              }

              await tx.shopArrival.update({
                where: { id },
                data: {
                  date: dateStr,
                  nomenclature: nom,
                  quantity: newQty,
                  supplier: newSupp,
                  batch: batchStr,
                  temperature: tempVal,
                  isEdited: true,
                  editReason: reason,
                  editedAt: new Date(),
                  editedBy: session.name || session.role || 'Foydalanuvchi',
                },
              })

              await recordShiftEditAudit({
                userId: session.id,
                userName: session.name || session.role || 'Omborchi',
                userRole: session.role || 'WAREHOUSE',
                date: dateStr,
                target: 'KIRIM',
                targetTitle: 'Kirimlar Jurnali (Inbound / Prihod)',
                reason,
                details: `«${nom}» xomashyosi (${newQty} kg, partiya #${batchStr}) tahrirlandi`,
                isAfter17,
              })

              syncedArrivals.push({
                id,
                date: dateStr,
                nomenclature: nom,
                quantity: newQty,
                supplier: newSupp,
                batch: batchStr,
                temperature: tempVal,
              })

              updated++
            } else {
              // Nothing changed
            }
          } else {
            // New record creation
            const tempVal = r.temperature !== undefined && r.temperature !== null && r.temperature !== '' ? Number(r.temperature) : null
            const createdRecord = await tx.shopArrival.create({
              data: {
                date: dateStr,
                nomenclature: nom,
                quantity: toNum(r.quantity),
                supplier: String(r.supplier ?? '').trim(),
                batch: batchStr,
                temperature: tempVal,
                isEdited: false,
              },
            })

            syncedArrivals.push({
              id: createdRecord.id,
              date: dateStr,
              nomenclature: nom,
              quantity: toNum(r.quantity),
              supplier: String(r.supplier ?? '').trim(),
              batch: batchStr,
              temperature: tempVal,
            })

            created++
          }
        }
      },
      { timeout: 60000, maxWait: 10000 }
    )

    if (updated > 0 || created > 0) {
      await syncInventoryBatchesFromDailyBalances().catch((e) => console.error('FIFO sync after arrivals save error:', e))
      try {
        invalidateSupplyDashboardCache()
      } catch {}

      // AUTO-SYNC into IncomingRawMaterialAct (Xomashyo Sifat Aktlari jurnali)
      for (const arr of syncedArrivals) {
        await syncIncomingActFromArrival(arr).catch((err) =>
          console.error('Error auto-syncing arrival to incoming acts:', err)
        )
      }
    }

    return NextResponse.json({ success: true, updated, created })
  } catch (error: any) {
    console.error('Shop arrivals save error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

/**
 * Delete an arrival row.
 * Strict enterprise anti-tampering rule:
 * ONLY ADMIN and DIRECTOR roles can delete previously saved arrival records!
 * General warehouse operators and users cannot delete saved data under any circumstances.
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isAdmin = session.role === 'ADMIN' || session.role === 'DIRECTOR'
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Yozuvni o'chirish taqiqlangan! Saqlangan ma'lumotlarni faqat Administrator o'chirish huquqiga ega." },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get('id'))
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Noto'g'ri ID" }, { status: 400 })
    }

    const existing = await prisma.shopArrival.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Yozuv topilmadi' }, { status: 404 })
    }

    await prisma.shopArrival.delete({ where: { id } })
    await syncInventoryBatchesFromDailyBalances().catch((e) => console.error('FIFO sync after arrival delete error:', e))
    try {
      invalidateSupplyDashboardCache()
    } catch {}

    // Auto-clean unedited quality act generated for this arrival
    try {
      const linkedActs = await prisma.incomingRawMaterialAct.findMany({
        where: { isEdited: false },
        select: { id: true, rawValues: true },
      })
      for (const act of linkedActs) {
        const rv = act.rawValues as any
        if (rv && rv.arrivalId === id) {
          await prisma.incomingRawMaterialAct.delete({ where: { id: act.id } }).catch(() => {})
        }
      }
    } catch {}

    return NextResponse.json({ success: true, deletedId: id })
  } catch (error: any) {
    console.error('Shop arrival delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
