import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

type SupportedLang = 'uz' | 'ru' | 'en'

interface I18nDict {
  sheetAll: string
  sheetRejected: string
  sheetInspectors: string
  sheetProducts: string
  sheetMonthly: string
  colIdx: string
  colDate: string
  colActNo: string
  colProduct: string
  colBatch: string
  colSupplier: string
  colQuantity: string
  colTemp: string
  colPackaging: string
  colCert: string
  colStatus: string
  colAcceptedQty: string
  colRejectedQty: string
  colInspector: string
  colDefectReason: string
  colConclusion: string
  colNotes: string
  colTotalActs: string
  colAcceptedActs: string
  colRejectedActs: string
  colCondActs: string
  colAcceptRate: string
  colTotalWeight: string
  colMonth: string
  statusAccepted: string
  statusRejected: string
  statusConditional: string
  pkgGood: string
  certYes: string
  unknown: string
  inspectorFallback: string
  months: string[]
  filePrefix: string
  defectHarorat: string
  defectMogor: string
  defectZararkunanda: string
  defectKalibr: string
  defectSertifikat: string
  defectBoshqa: string
}

const DICT: Record<SupportedLang, I18nDict> = {
  uz: {
    sheetAll: 'Umumiy Reyestr',
    sheetRejected: 'Rad etilganlar',
    sheetInspectors: 'Inspektorlar korsatkichi',
    sheetProducts: 'Mahsulotlar kesimida',
    sheetMonthly: 'Oylik dinamika 2026',
    colIdx: '№',
    colDate: 'Sana',
    colActNo: 'Akt raqami',
    colProduct: 'Mahsulot nomi',
    colBatch: 'Partiya raqami',
    colSupplier: 'Ta\'minotchi',
    colQuantity: 'Jami miqdor (kg)',
    colTemp: 'Harorat (°C)',
    colPackaging: 'Qadoqlash',
    colCert: 'Sertifikat',
    colStatus: 'Holati (Status)',
    colAcceptedQty: 'Qabul hajmi (kg)',
    colRejectedQty: 'Rad hajmi (kg)',
    colInspector: 'Tekshiruvchi inspektor',
    colDefectReason: 'Rad sababi / Nuqson',
    colConclusion: 'Xulosa va izohlar',
    colNotes: 'Qo\'shimcha izoh / Chora',
    colTotalActs: 'Jami tekshiruvlar',
    colAcceptedActs: 'Qabul qilingan',
    colRejectedActs: 'Rad etilgan (Brak)',
    colCondActs: 'Shartli qabul',
    colAcceptRate: 'Qabul darajasi (%)',
    colTotalWeight: 'Jami tekshirilgan hajm (kg)',
    colMonth: 'Oy',
    statusAccepted: 'Qabul qilindi',
    statusRejected: 'Rad etildi (Brak)',
    statusConditional: 'Shartli qabul',
    pkgGood: 'Qoniqarli',
    certYes: 'Mavjud',
    unknown: 'Noma\'lum',
    inspectorFallback: 'Nazoratchi',
    months: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'],
    filePrefix: 'Toliq_Jurnal',
    defectHarorat: 'Harorat rejimi buzilgan',
    defectMogor: 'Mog\'orlash va chirish',
    defectZararkunanda: 'Zararkunandalar mavjudligi',
    defectKalibr: 'Standart kalibr / Tashqi ko\'rinish',
    defectSertifikat: 'Hujjatlar / Sertifikat yetishmasligi',
    defectBoshqa: 'Sifat standartiga mos emas',
  },
  ru: {
    sheetAll: 'Общий Реестр',
    sheetRejected: 'Отклоненные (Брак)',
    sheetInspectors: 'Показатели инспекторов',
    sheetProducts: 'В разрезе продуктов',
    sheetMonthly: 'Помесячная динамика 2026',
    colIdx: '№',
    colDate: 'Дата',
    colActNo: 'Номер акта',
    colProduct: 'Наименование сырья',
    colBatch: 'Номер партии',
    colSupplier: 'Поставщик',
    colQuantity: 'Общее количество (кг)',
    colTemp: 'Температура (°C)',
    colPackaging: 'Упаковка',
    colCert: 'Сертификат',
    colStatus: 'Статус партии',
    colAcceptedQty: 'Принято (кг)',
    colRejectedQty: 'Отклонено (кг)',
    colInspector: 'Инспектор',
    colDefectReason: 'Причина брака / дефект',
    colConclusion: 'Заключение инспектора',
    colNotes: 'Примечание / Меры',
    colTotalActs: 'Всего проверок',
    colAcceptedActs: 'Принято (актов)',
    colRejectedActs: 'Отклонено (Брак)',
    colCondActs: 'Условно принято',
    colAcceptRate: 'Уровень приемки (%)',
    colTotalWeight: 'Общий проверенный объем (кг)',
    colMonth: 'Месяц',
    statusAccepted: 'Принято (допущено)',
    statusRejected: 'Отклонено (Брак)',
    statusConditional: 'Условно принято',
    pkgGood: 'Удовлетворительно',
    certYes: 'В наличии',
    unknown: 'Не указано',
    inspectorFallback: 'Контролер',
    months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
    filePrefix: 'Polniy_Jurnal',
    defectHarorat: 'Нарушение температурного режима',
    defectMogor: 'Плесень, гниль и порча',
    defectZararkunanda: 'Наличие вредителей / насекомых',
    defectKalibr: 'Нестандартный калибр / Внешний вид',
    defectSertifikat: 'Отсутствие документов / сертификата',
    defectBoshqa: 'Несоответствие стандартам качества',
  },
  en: {
    sheetAll: 'General Registry',
    sheetRejected: 'Rejected Batches',
    sheetInspectors: 'Inspector Metrics',
    sheetProducts: 'By Product Summary',
    sheetMonthly: 'Monthly Dynamics 2026',
    colIdx: '№',
    colDate: 'Date',
    colActNo: 'Act Number',
    colProduct: 'Raw Material Name',
    colBatch: 'Batch Number',
    colSupplier: 'Supplier',
    colQuantity: 'Total Quantity (kg)',
    colTemp: 'Temperature (°C)',
    colPackaging: 'Packaging',
    colCert: 'Certificate',
    colStatus: 'Batch Status',
    colAcceptedQty: 'Accepted (kg)',
    colRejectedQty: 'Rejected (kg)',
    colInspector: 'Inspector',
    colDefectReason: 'Rejection Reason / Defect',
    colConclusion: 'Inspector Conclusion',
    colNotes: 'Notes / Corrective Action',
    colTotalActs: 'Total Inspections',
    colAcceptedActs: 'Accepted Acts',
    colRejectedActs: 'Rejected Acts',
    colCondActs: 'Conditional Acts',
    colAcceptRate: 'Acceptance Rate (%)',
    colTotalWeight: 'Total Inspected Volume (kg)',
    colMonth: 'Month',
    statusAccepted: 'Accepted',
    statusRejected: 'Rejected',
    statusConditional: 'Conditionally Accepted',
    pkgGood: 'Satisfactory',
    certYes: 'Available',
    unknown: 'Unknown',
    inspectorFallback: 'Inspector',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    filePrefix: 'Full_Registry',
    defectHarorat: 'Temperature violation',
    defectMogor: 'Mold and rot decay',
    defectZararkunanda: 'Presence of pests',
    defectKalibr: 'Non-standard caliber / Appearance',
    defectSertifikat: 'Missing documents / certificates',
    defectBoshqa: 'Non-compliance with quality standards',
  }
}

function detectRejectionCategory(conclusion: string | null | undefined, notes: string | null | undefined, t: I18nDict): string {
  const text = `${conclusion || ''} ${notes || ''}`.toLowerCase()
  if (text.includes('harorat') || text.includes('gradus') || text.includes('°c') || text.includes('температур') || text.includes('muzlagan')) {
    return t.defectHarorat
  }
  if (text.includes('mog\'or') || text.includes('chirigan') || text.includes('buzilgan') || text.includes('shilimshiq') || text.includes('гнил') || text.includes('плесен')) {
    return t.defectMogor
  }
  if (text.includes('qurt') || text.includes('hashorot') || text.includes('zararkunanda') || text.includes('вредител') || text.includes('насеком')) {
    return t.defectZararkunanda
  }
  if (text.includes('kalibr') || text.includes('o\'lcham') || text.includes('ezilgan') || text.includes('калилибр') || text.includes('помятост')) {
    return t.defectKalibr
  }
  if (text.includes('sertifikat') || text.includes('hujjat') || text.includes('сертификат') || text.includes('документ')) {
    return t.defectSertifikat
  }
  return t.defectBoshqa
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawLang = searchParams.get('lang') || request.cookies.get('language')?.value || request.cookies.get('director_lang')?.value || 'uz'
    const lang: SupportedLang = (rawLang === 'ru' || rawLang === 'en') ? rawLang : 'uz'
    const t = DICT[lang]

    const inspections = await prisma.inspection.findMany({
      orderBy: { inspectionDate: 'desc' },
      include: {
        supplier: true,
        product: true,
        user: true,
      },
    })

    const wb = new ExcelJS.Workbook()
    wb.creator = 'Green Processing ERP'
    wb.lastModifiedBy = 'Green Processing Sifat Nazorati'
    wb.created = new Date()
    wb.modified = new Date()

    const headerFont: Partial<ExcelJS.Font> = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    }

    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    }

    // -------------------------------------------------------------
    // SHEET 1: Umumiy Reyestr (Barcha partiyalar)
    // -------------------------------------------------------------
    const wsAll = wb.addWorksheet(t.sheetAll, {
      views: [{ state: 'frozen', ySplit: 1 }]
    })

    wsAll.columns = [
      { header: t.colIdx, key: 'idx', width: 6 },
      { header: t.colDate, key: 'date', width: 14 },
      { header: t.colActNo, key: 'actNo', width: 16 },
      { header: t.colProduct, key: 'product', width: 28 },
      { header: t.colBatch, key: 'batch', width: 18 },
      { header: t.colSupplier, key: 'supplier', width: 26 },
      { header: t.colQuantity, key: 'quantity', width: 18 },
      { header: t.colTemp, key: 'temperature', width: 14 },
      { header: t.colPackaging, key: 'packaging', width: 20 },
      { header: t.colCert, key: 'certificate', width: 18 },
      { header: t.colStatus, key: 'status', width: 20 },
      { header: t.colAcceptedQty, key: 'acceptedQty', width: 16 },
      { header: t.colRejectedQty, key: 'rejectedQty', width: 16 },
      { header: t.colInspector, key: 'inspector', width: 24 },
      { header: t.colDefectReason, key: 'defectReason', width: 28 },
      { header: t.colConclusion, key: 'conclusion', width: 45 },
    ]

    const headerRow1 = wsAll.getRow(1)
    headerRow1.height = 26
    headerRow1.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF15803D' } } // Emerald
      cell.font = headerFont
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    inspections.forEach((act, idx) => {
      const isAccepted = act.status === 'ACCEPTED'
      const isRejected = act.status === 'REJECTED'
      const isConditional = act.status === 'CONDITIONAL'

      const statusLabel = isAccepted ? t.statusAccepted : (isRejected ? t.statusRejected : t.statusConditional)
      const defect = !isAccepted ? detectRejectionCategory(act.conclusion, act.notes, t) : '-'

      const dateStr = new Date(act.inspectionDate).toLocaleDateString(lang === 'en' ? 'en-US' : 'ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      })

      const row = wsAll.addRow({
        idx: idx + 1,
        date: dateStr,
        actNo: act.invoiceNumber || `ACT-${act.id.toString().padStart(4, '0')}`,
        product: act.product?.name || act.sheetName || t.unknown,
        batch: act.batchNumber,
        supplier: act.supplier?.name || t.unknown,
        quantity: act.quantity || 0,
        temperature: act.temperature != null ? act.temperature : '-',
        packaging: act.packaging || t.pkgGood,
        certificate: act.supplier?.certificate || t.certYes,
        status: statusLabel,
        acceptedQty: isAccepted ? act.quantity : 0,
        rejectedQty: isRejected ? act.quantity : (isConditional ? (act.quantity * 0.2) : 0),
        inspector: act.inspector || act.user?.name || t.inspectorFallback,
        defectReason: defect,
        conclusion: act.conclusion || act.notes || '-',
      })

      row.height = 22
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = thinBorder
        cell.font = { name: 'Calibri', size: 10 }
        cell.alignment = { vertical: 'middle' }

        if ([1, 2, 8, 11].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
        }
        if ([7, 12, 13].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' }
          cell.numFmt = '#,##0.00'
        }

        if (colNumber === 11) {
          if (isAccepted) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF166534' } }
          } else if (isRejected) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF991B1B' } }
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF92400E' } }
          }
        }
      })
    })

    wsAll.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(inspections.length + 1, 2), column: 16 }
    }

    // -------------------------------------------------------------
    // SHEET 2: Rad etilgan partiyalar (Brak va E'tirozlar)
    // -------------------------------------------------------------
    const rejectedActs = inspections.filter(i => i.status !== 'ACCEPTED')
    const wsRejected = wb.addWorksheet(t.sheetRejected, {
      views: [{ state: 'frozen', ySplit: 1 }]
    })

    wsRejected.columns = [
      { header: t.colIdx, key: 'idx', width: 6 },
      { header: t.colDate, key: 'date', width: 14 },
      { header: t.colActNo, key: 'actNo', width: 16 },
      { header: t.colProduct, key: 'product', width: 28 },
      { header: t.colBatch, key: 'batch', width: 18 },
      { header: t.colSupplier, key: 'supplier', width: 26 },
      { header: t.colRejectedQty, key: 'rejectedQty', width: 18 },
      { header: t.colTemp, key: 'temperature', width: 14 },
      { header: t.colDefectReason, key: 'category', width: 28 },
      { header: t.colInspector, key: 'inspector', width: 24 },
      { header: t.colConclusion, key: 'conclusion', width: 40 },
      { header: t.colNotes, key: 'notes', width: 35 },
    ]

    const headerRejected = wsRejected.getRow(1)
    headerRejected.height = 26
    headerRejected.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB91C1C' } } // Red
      cell.font = headerFont
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    rejectedActs.forEach((act, idx) => {
      const dateStr = new Date(act.inspectionDate).toLocaleDateString(lang === 'en' ? 'en-US' : 'ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      })
      const category = detectRejectionCategory(act.conclusion, act.notes, t)

      const row = wsRejected.addRow({
        idx: idx + 1,
        date: dateStr,
        actNo: act.invoiceNumber || `ACT-${act.id.toString().padStart(4, '0')}`,
        product: act.product?.name || act.sheetName || t.unknown,
        batch: act.batchNumber,
        supplier: act.supplier?.name || t.unknown,
        rejectedQty: act.quantity || 0,
        temperature: act.temperature != null ? act.temperature : '-',
        category,
        inspector: act.inspector || act.user?.name || t.inspectorFallback,
        conclusion: act.conclusion || '-',
        notes: act.notes || '-',
      })

      row.height = 22
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = thinBorder
        cell.font = { name: 'Calibri', size: 10 }
        cell.alignment = { vertical: 'middle' }
        if ([1, 2, 8].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
        }
        if (colNumber === 7) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' }
          cell.numFmt = '#,##0.00'
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF991B1B' } }
        }
      })
    })

    wsRejected.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(rejectedActs.length + 1, 2), column: 12 }
    }

    // -------------------------------------------------------------
    // SHEET 3: Inspektorlar ko'rsatkichi
    // -------------------------------------------------------------
    const inspectorMap: Record<string, { total: number; accepted: number; rejected: number; conditional: number; totalQty: number; rejectedQty: number }> = {}
    inspections.forEach(act => {
      const insp = act.inspector || act.user?.name || t.unknown
      if (!inspectorMap[insp]) {
        inspectorMap[insp] = { total: 0, accepted: 0, rejected: 0, conditional: 0, totalQty: 0, rejectedQty: 0 }
      }
      inspectorMap[insp].total++
      inspectorMap[insp].totalQty += act.quantity || 0
      if (act.status === 'ACCEPTED') inspectorMap[insp].accepted++
      else if (act.status === 'REJECTED') {
        inspectorMap[insp].rejected++
        inspectorMap[insp].rejectedQty += act.quantity || 0
      } else {
        inspectorMap[insp].conditional++
      }
    })

    const wsInspectors = wb.addWorksheet(t.sheetInspectors, {
      views: [{ state: 'frozen', ySplit: 1 }]
    })

    wsInspectors.columns = [
      { header: t.colIdx, key: 'idx', width: 6 },
      { header: t.colInspector, key: 'name', width: 28 },
      { header: t.colTotalActs, key: 'total', width: 18 },
      { header: t.colAcceptedActs, key: 'accepted', width: 16 },
      { header: t.colRejectedActs, key: 'rejected', width: 18 },
      { header: t.colCondActs, key: 'conditional', width: 16 },
      { header: t.colAcceptRate, key: 'rate', width: 18 },
      { header: t.colTotalWeight, key: 'totalQty', width: 26 },
      { header: t.colRejectedQty, key: 'rejectedQty', width: 24 },
    ]

    const headerInsp = wsInspectors.getRow(1)
    headerInsp.height = 26
    headerInsp.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } } // Blue
      cell.font = headerFont
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    Object.entries(inspectorMap).forEach(([name, st], idx) => {
      const rate = st.total > 0 ? ((st.accepted / st.total) * 100).toFixed(1) + '%' : '0%'
      const row = wsInspectors.addRow({
        idx: idx + 1,
        name,
        total: st.total,
        accepted: st.accepted,
        rejected: st.rejected,
        conditional: st.conditional,
        rate,
        totalQty: st.totalQty,
        rejectedQty: st.rejectedQty,
      })
      row.height = 22
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = thinBorder
        cell.font = { name: 'Calibri', size: 10 }
        cell.alignment = { vertical: 'middle' }
        if ([1, 3, 4, 5, 6, 7].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
        }
        if ([8, 9].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' }
          cell.numFmt = '#,##0.00'
        }
      })
    })

    // -------------------------------------------------------------
    // SHEET 4: Mahsulotlar kesimida
    // -------------------------------------------------------------
    const productMap: Record<string, { total: number; accepted: number; rejected: number; conditional: number; totalQty: number; rejectedQty: number }> = {}
    inspections.forEach(act => {
      const pName = act.product?.name || act.sheetName || t.unknown
      if (!productMap[pName]) {
        productMap[pName] = { total: 0, accepted: 0, rejected: 0, conditional: 0, totalQty: 0, rejectedQty: 0 }
      }
      productMap[pName].total++
      productMap[pName].totalQty += act.quantity || 0
      if (act.status === 'ACCEPTED') productMap[pName].accepted++
      else if (act.status === 'REJECTED') {
        productMap[pName].rejected++
        productMap[pName].rejectedQty += act.quantity || 0
      } else {
        productMap[pName].conditional++
      }
    })

    const wsProducts = wb.addWorksheet(t.sheetProducts, {
      views: [{ state: 'frozen', ySplit: 1 }]
    })

    wsProducts.columns = [
      { header: t.colIdx, key: 'idx', width: 6 },
      { header: t.colProduct, key: 'name', width: 30 },
      { header: t.colTotalActs, key: 'total', width: 16 },
      { header: t.colAcceptedActs, key: 'accepted', width: 16 },
      { header: t.colRejectedActs, key: 'rejected', width: 16 },
      { header: t.colCondActs, key: 'conditional', width: 16 },
      { header: t.colAcceptRate, key: 'rate', width: 20 },
      { header: t.colQuantity, key: 'totalQty', width: 22 },
      { header: t.colRejectedQty, key: 'rejectedQty', width: 22 },
    ]

    const headerProd = wsProducts.getRow(1)
    headerProd.height = 26
    headerProd.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } } // Purple
      cell.font = headerFont
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    Object.entries(productMap).forEach(([name, st], idx) => {
      const rate = st.total > 0 ? ((st.accepted / st.total) * 100).toFixed(1) + '%' : '0%'
      const row = wsProducts.addRow({
        idx: idx + 1,
        name,
        total: st.total,
        accepted: st.accepted,
        rejected: st.rejected,
        conditional: st.conditional,
        rate,
        totalQty: st.totalQty,
        rejectedQty: st.rejectedQty,
      })
      row.height = 22
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = thinBorder
        cell.font = { name: 'Calibri', size: 10 }
        cell.alignment = { vertical: 'middle' }
        if ([1, 3, 4, 5, 6, 7].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
        }
        if ([8, 9].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' }
          cell.numFmt = '#,##0.00'
        }
      })
    })

    // -------------------------------------------------------------
    // SHEET 5: Oylik dinamika 2026
    // -------------------------------------------------------------
    const monthlyData = t.months.map((mName, mIdx) => {
      const monthActs = inspections.filter(act => {
        const d = new Date(act.inspectionDate)
        return d.getFullYear() === 2026 && d.getMonth() === mIdx
      })
      const total = monthActs.length
      const accepted = monthActs.filter(a => a.status === 'ACCEPTED').length
      const rejected = monthActs.filter(a => a.status === 'REJECTED').length
      const conditional = monthActs.filter(a => a.status === 'CONDITIONAL').length
      const totalQty = monthActs.reduce((acc, a) => acc + (a.quantity || 0), 0)
      const rate = total > 0 ? ((accepted / total) * 100).toFixed(1) + '%' : '0%'
      return { idx: mIdx + 1, name: mName, total, accepted, rejected, conditional, rate, totalQty }
    })

    const wsMonthly = wb.addWorksheet(t.sheetMonthly, {
      views: [{ state: 'frozen', ySplit: 1 }]
    })

    wsMonthly.columns = [
      { header: t.colIdx, key: 'idx', width: 6 },
      { header: t.colMonth, key: 'name', width: 16 },
      { header: t.colTotalActs, key: 'total', width: 18 },
      { header: t.colAcceptedActs, key: 'accepted', width: 16 },
      { header: t.colRejectedActs, key: 'rejected', width: 16 },
      { header: t.colCondActs, key: 'conditional', width: 16 },
      { header: t.colAcceptRate, key: 'rate', width: 18 },
      { header: t.colTotalWeight, key: 'totalQty', width: 26 },
    ]

    const headerMonth = wsMonthly.getRow(1)
    headerMonth.height = 26
    headerMonth.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } } // Teal
      cell.font = headerFont
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    monthlyData.forEach(md => {
      const row = wsMonthly.addRow(md)
      row.height = 22
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = thinBorder
        cell.font = { name: 'Calibri', size: 10 }
        cell.alignment = { vertical: 'middle' }
        if ([1, 2, 3, 4, 5, 6, 7].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
        }
        if (colNumber === 8) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' }
          cell.numFmt = '#,##0.00'
        }
      })
    })

    const buffer = await wb.xlsx.writeBuffer()
    const d = new Date()
    const dateTag = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
    const filename = `${t.filePrefix}_${dateTag}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Excel generation error:', error)
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 })
  }
}
