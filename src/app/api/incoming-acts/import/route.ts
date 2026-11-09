import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import {
  parseIncomingActsFromBuffer,
  loadDefaultTemplateActs,
  IncomingActRecord
} from '@/lib/incoming-acts/excel'
import { recordImportAudit } from '@/lib/auditImport'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // STRICT ADMIN-ONLY RESTRICTION
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        {
          error:
            "Fayllarni import qilish faqat Tizim Administratoriga (ADMIN) ruxsat etilgan! Ma'lumotlar yaxlitligi va audit qoidalariga binoan hatto Direktor ham import qila olmaydi.",
        },
        { status: 403 }
      )
    }

    const contentType = req.headers.get('content-type') || ''
    let records: IncomingActRecord[] = []
    let mode = 'append' // 'append' or 'replace'
    let reason = ''
    let fileName = 'incoming_acts.xlsx'
    let fileSize: string | undefined = undefined

    if (contentType.includes('application/json')) {
      const body = await req.json()
      mode = body.mode || 'append'
      reason = (body.reason || '').toString().trim()
      fileName = body.fileName || (body.useDefaultTemplate ? 'Standart Shablon (1276 ta akt)' : 'json_records.json')

      if (body.useDefaultTemplate) {
        records = await loadDefaultTemplateActs()
      } else if (body.records && Array.isArray(body.records)) {
        records = body.records
      } else {
        return NextResponse.json({ error: 'Noto\'g\'ri so\'rov formati' }, { status: 400 })
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      mode = (formData.get('mode') as string) || 'append'
      reason = (formData.get('reason') as string || '').toString().trim()

      if (!file) {
        return NextResponse.json({ error: 'Excel fayl tanlanmadi' }, { status: 400 })
      }

      fileName = file.name || 'incoming_acts.xlsx'
      fileSize = file.size ? `${Math.round(file.size / 1024)} KB` : undefined

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      records = await parseIncomingActsFromBuffer(buffer)
    } else {
      return NextResponse.json({ error: 'Kutilmagan Content-Type' }, { status: 400 })
    }

    if (!reason || reason.length < 5) {
      return NextResponse.json(
        {
          error:
            'Import qilish sababi va asosi (kamida 5 ta belgi) kiritilishi shart! Ushbu izoh audit jurnali uchun saqlanadi.',
        },
        { status: 400 }
      )
    }

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: 'Fayldan aktlar topilmadi yoki barcha qatorlar bo\'sh' },
        { status: 400 }
      )
    }

    if (mode === 'replace') {
      await prisma.incomingRawMaterialAct.deleteMany()
    }

    // Insert records in batches
    const batchData = records.map((r, i) => ({
      actNumber: r.actNumber || String(i + 1),
      actDate: r.actDate,
      productName: r.productName,
      supplierName: r.supplierName,
      temperature: r.temperature || null,
      transportCondition: r.transportCondition ?? 1,
      hasDocumentation: r.hasDocumentation ?? 1,
      structure: r.structure ?? 1,
      leafColor: r.leafColor ?? 1,
      tasteSmell: r.tasteSmell ?? 1,
      internalOxidation: r.internalOxidation ?? 0,
      insectTraces: r.insectTraces ?? 0,
      rotDiseases: r.rotDiseases ?? 0,
      stemCut: r.stemCut ?? 1,
      density: r.density ?? 1,
      diameterWeight: r.diameterWeight || null,
      outerLeavesRemoved: r.outerLeavesRemoved ?? 1,
      noMechanicalDamage: r.noMechanicalDamage ?? 1,
      batchNumber: r.batchNumber || null,
      decisionRating: r.decisionRating || 4,
      decisionText: r.decisionText || 'Yaxshi',
      warehouseKg: r.warehouseKg !== undefined && r.warehouseKg !== null ? r.warehouseKg : null,
      shopIssuedKg: r.shopIssuedKg || null,
      shopIssuedDate: r.shopIssuedDate || null,
      rejectionActNumber: r.rejectionActNumber || null,
      inspectorName: r.inspectorName || 'Камбарова А.М.',
      pricePerKg: r.pricePerKg !== undefined && r.pricePerKg !== null ? r.pricePerKg : null,
      notes: r.notes || null,
      rawValues: (r.rawValues as any) || {}
    }))

    const result = await prisma.incomingRawMaterialAct.createMany({
      data: batchData
    })

    // Record Audit Entry into Setting table
    await recordImportAudit({
      adminId: session.id,
      adminName: session.name || 'Administrator',
      adminRole: session.role,
      target: 'Kiruvchi Sifat Nazorati Aktlari (Incoming Acts)',
      fileName,
      fileSize,
      reason,
      recordsCount: result.count,
      mode,
      status: 'SUCCESS',
      details: `${result.count} ta xomashyo qabul qilish akti ${mode === 'replace' ? 'almashtirish (tozalab)' : "qo'shish"} rejimida yuklandi`,
    })

    return NextResponse.json({
      success: true,
      message: `${result.count} ta akt muvaffaqiyatli import qilindi!`,
      count: result.count
    })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Import jarayonida xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
