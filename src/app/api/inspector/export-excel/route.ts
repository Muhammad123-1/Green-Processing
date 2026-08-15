import { NextRequest } from 'next/server'
import ExcelJS from 'exceljs'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Green Processing ERP - QA System'
    workbook.created = new Date()

    // 1. FSSC 22000 QC Checklist
    let fsscLogs: any[] = []
    try {
      fsscLogs = await prisma.$queryRawUnsafe(`SELECT * FROM "FsscQcLog" ORDER BY "date" DESC, "id" DESC`)
    } catch {}

    const wsFssc = workbook.addWorksheet('FSSC 22000 QC Checklist')
    wsFssc.columns = [
      { header: '№', key: 'num', width: 6 },
      { header: 'Sana & Vaqt', key: 'dateTime', width: 16 },
      { header: 'Liniya', key: 'lineName', width: 20 },
      { header: 'Mahsulot', key: 'productName', width: 22 },
      { header: 'Partiya №', key: 'batchNumber', width: 18 },
      { header: 'Nominal vazn (g)', key: 'nominalWeight', width: 16 },
      { header: 'Haqiqiy vazn (g)', key: 'actualWeight', width: 16 },
      { header: 'Og\'ish (g)', key: 'weightDeviation', width: 14 },
      { header: 'Germetiklik', key: 'sealIntegrityOk', width: 14 },
      { header: 'Metall Detektor', key: 'metalDetectorOk', width: 16 },
      { header: 'Etiketka', key: 'labelCorrectOk', width: 14 },
      { header: 'Holat', key: 'status', width: 14 },
      { header: 'Mas\'ul', key: 'responsible', width: 18 },
    ]
    styleHeader(wsFssc.getRow(1), 'FF10B981')
    fsscLogs.forEach((l, i) => {
      const row = wsFssc.addRow({
        num: i + 1,
        dateTime: `${l.date} ${l.time}`,
        lineName: l.lineName,
        productName: l.productName,
        batchNumber: l.batchNumber,
        nominalWeight: l.nominalWeight,
        actualWeight: l.actualWeight,
        weightDeviation: l.weightDeviation > 0 ? `+${l.weightDeviation}g` : `${l.weightDeviation}g`,
        sealIntegrityOk: l.sealIntegrityOk ? 'OK' : 'Brak',
        metalDetectorOk: l.metalDetectorOk ? 'O\'tdi' : 'Aniqlangan',
        labelCorrectOk: l.labelCorrectOk ? 'To\'g\'ri' : 'Xato',
        status: l.status,
        responsible: l.responsible
      })
      styleDataRow(row)
    })

    // 2. Kontrol dezrastvora (KKT-1)
    let dezLogs: any[] = []
    try {
      dezLogs = await prisma.$queryRawUnsafe(`SELECT * FROM "DisinfectionLog" ORDER BY "date" DESC, "id" DESC`)
    } catch {}

    const wsDez = workbook.addWorksheet('Контроль дезраствора')
    wsDez.columns = [
      { header: '№', key: 'num', width: 6 },
      { header: 'Sana & Vaqt', key: 'dateTime', width: 16 },
      { header: 'Vanna / Bo\'linma', key: 'vannaNumber', width: 22 },
      { header: 'Eritma turi', key: 'solutionType', width: 20 },
      { header: 'Konsentratsiya (ppm)', key: 'concentrationPpm', width: 20 },
      { header: 'pH darajasi', key: 'phLevel', width: 14 },
      { header: 'Suv harorati (°C)', key: 'waterTemp', width: 16 },
      { header: 'Me\'yordami', key: 'isStandard', width: 14 },
      { header: 'Tuzatish chorasi', key: 'correctiveAction', width: 25 },
      { header: 'Mas\'ul', key: 'responsible', width: 18 },
    ]
    styleHeader(wsDez.getRow(1), 'FF06B6D4')
    dezLogs.forEach((l, i) => {
      const row = wsDez.addRow({
        num: i + 1,
        dateTime: `${l.date} ${l.time}`,
        vannaNumber: l.vannaNumber,
        solutionType: l.solutionType,
        concentrationPpm: `${l.concentrationPpm} ppm`,
        phLevel: l.phLevel || '-',
        waterTemp: l.waterTemp ? `${l.waterTemp}°C` : '-',
        isStandard: l.isStandard ? 'Me\'yorda (CCP-1 OK)' : 'BUZILISH',
        correctiveAction: l.correctiveAction || '-',
        responsible: l.responsible
      })
      styleDataRow(row)
    })

    // 3. Kalibrovka
    let calLogs: any[] = []
    try {
      calLogs = await prisma.$queryRawUnsafe(`SELECT * FROM "CalibrationLog" ORDER BY "date" DESC, "id" DESC`)
    } catch {}

    const wsCal = workbook.addWorksheet('Чек-лист калибровки')
    wsCal.columns = [
      { header: '№', key: 'num', width: 6 },
      { header: 'Sana & Vaqt', key: 'dateTime', width: 16 },
      { header: 'Mahsulot', key: 'productName', width: 20 },
      { header: 'Partiya №', key: 'batchNumber', width: 16 },
      { header: 'Diametr (Ø mm)', key: 'diameterMm', width: 16 },
      { header: 'Harorat (°C)', key: 'sampleTemp', width: 16 },
      { header: 'Pichoq o\'tkirligi', key: 'bladeSharpness', width: 18 },
      { header: 'Chiqindi %', key: 'wastePercent', width: 14 },
      { header: 'Me\'yordami', key: 'isStandard', width: 14 },
      { header: 'Mas\'ul', key: 'responsible', width: 18 },
    ]
    styleHeader(wsCal.getRow(1), 'FF8B5CF6')
    calLogs.forEach((l, i) => {
      const row = wsCal.addRow({
        num: i + 1,
        dateTime: `${l.date} ${l.time}`,
        productName: l.productName,
        batchNumber: l.batchNumber || '-',
        diameterMm: l.diameterMm ? `Ø ${l.diameterMm} mm` : '-',
        sampleTemp: l.sampleTemp ? `${l.sampleTemp}°C` : '-',
        bladeSharpness: l.bladeSharpness || '-',
        wastePercent: l.wastePercent ? `${l.wastePercent}%` : '-',
        isStandard: l.isStandard ? 'Me\'yorda' : 'Og\'ish',
        responsible: l.responsible
      })
      styleDataRow(row)
    })

    // 4. Degustatsiya
    let degLogs: any[] = []
    try {
      degLogs = await prisma.$queryRawUnsafe(`SELECT * FROM "DegustationChecklist" ORDER BY "date" DESC, "id" DESC`)
    } catch {}

    const wsDeg = workbook.addWorksheet('Чек-лист дегустации')
    wsDeg.columns = [
      { header: '№', key: 'num', width: 6 },
      { header: 'Sana & Vaqt', key: 'dateTime', width: 16 },
      { header: 'Mahsulot', key: 'productType', width: 18 },
      { header: 'Partiya №', key: 'batchNumber', width: 16 },
      { header: 'Rangi', key: 'colorOk', width: 12 },
      { header: 'Hidi', key: 'smellOk', width: 12 },
      { header: 'Qarsillashi', key: 'crunchOk', width: 14 },
      { header: 'Ta\'mi', key: 'tasteOk', width: 12 },
      { header: 'Begona ta\'m', key: 'foreignFlavorOk', width: 14 },
      { header: 'Baho (1-5)', key: 'overallScore', width: 12 },
      { header: 'Xulosa', key: 'conclusion', width: 22 },
      { header: 'Mas\'ul', key: 'responsible', width: 18 },
    ]
    styleHeader(wsDeg.getRow(1), 'FFEC4899')
    degLogs.forEach((l, i) => {
      const row = wsDeg.addRow({
        num: i + 1,
        dateTime: `${l.date} ${l.time}`,
        productType: l.productType,
        batchNumber: l.batchNumber,
        colorOk: l.colorOk ? 'OK' : 'Nuqson',
        smellOk: l.smellOk ? 'OK' : 'Yot hid',
        crunchOk: l.crunchOk ? 'Qarsildoq' : 'So\'ligan',
        tasteOk: l.tasteOk ? 'OK' : 'Buzilgan',
        foreignFlavorOk: l.foreignFlavorOk ? 'Yo\'q' : 'Mavjud',
        overallScore: l.overallScore,
        conclusion: l.conclusion,
        responsible: l.responsible
      })
      styleDataRow(row)
    })

    // 5. Harorat va Process QC
    let procLogs: any[] = []
    try {
      procLogs = await prisma.$queryRawUnsafe(`SELECT * FROM "ProcessQCLog" ORDER BY "date" DESC, "id" DESC`)
    } catch {}

    const wsProc = workbook.addWorksheet('Чек-лист температур')
    wsProc.columns = [
      { header: '№', key: 'num', width: 6 },
      { header: 'Sana / Vaqt', key: 'dateTime', width: 16 },
      { header: 'Toza zona (°C)', key: 'cleanZoneTemp', width: 16 },
      { header: 'Nopok zona (°C)', key: 'dirtyZoneTemp', width: 16 },
      { header: 'PF Aysberg Partiya', key: 'pfIcebergBatch', width: 18 },
      { header: 'PF Koul Sabzi Partiya', key: 'pfColeCarrotBatch', width: 20 },
      { header: 'PF Koul Karam Partiya', key: 'pfColeCabbageBatch', width: 20 },
      { header: 'GP Aysberg Harorat', key: 'gpIcebergTemp', width: 18 },
      { header: 'GP Koul Harorat', key: 'gpColeTemp', width: 18 },
      { header: 'Tuzatish chorasi', key: 'correctiveAction', width: 22 },
      { header: 'Mas\'ul', key: 'responsible', width: 18 },
      { header: 'Holat', key: 'status', width: 14 },
    ]
    styleHeader(wsProc.getRow(1), 'FF3B82F6')
    procLogs.forEach((l, i) => {
      const row = wsProc.addRow({
        num: i + 1,
        dateTime: `${l.date} ${l.time}`,
        cleanZoneTemp: l.cleanZoneTemp ? `${l.cleanZoneTemp}°C` : '-',
        dirtyZoneTemp: l.dirtyZoneTemp ? `${l.dirtyZoneTemp}°C` : '-',
        pfIcebergBatch: l.pfIcebergBatch || '-',
        pfColeCarrotBatch: l.pfColeCarrotBatch || '-',
        pfColeCabbageBatch: l.pfColeCabbageBatch || '-',
        gpIcebergTemp: l.gpIcebergTemp ? `${l.gpIcebergTemp}°C` : '-',
        gpColeTemp: l.gpColeTemp ? `${l.gpColeTemp}°C` : '-',
        correctiveAction: l.correctiveAction || '-',
        responsible: l.responsible || '-',
        status: l.status || 'APPROVED'
      })
      styleDataRow(row)
    })

    // 6. Priyomka Vxodnogo Syrya
    let rcvLogs: any[] = []
    try {
      rcvLogs = await prisma.$queryRawUnsafe(`SELECT * FROM "ReceivingLog" ORDER BY "date" DESC, "id" DESC`)
    } catch {}

    const wsRcv = workbook.addWorksheet('Приемка входного сырья')
    wsRcv.columns = [
      { header: 'Hujjat №', key: 'docNumber', width: 14 },
      { header: 'Sana & Vaqt', key: 'dateTime', width: 16 },
      { header: 'Ta\'minotchi', key: 'supplierName', width: 22 },
      { header: 'Mahsulot', key: 'productName', width: 20 },
      { header: 'Partiya №', key: 'batchNumber', width: 16 },
      { header: 'Miqdor (kg)', key: 'quantityKg', width: 14 },
      { header: 'Mashina №', key: 'vehicleNumber', width: 14 },
      { header: 'Transport Sanitariyasi', key: 'vehicleCleanOk', width: 20 },
      { header: 'Yuk Harorati (°C)', key: 'cargoTemp', width: 18 },
      { header: 'Fito / Lab Sertifikat', key: 'hasLabCertificate', width: 18 },
      { header: 'Organoleptika', key: 'organolepticScore', width: 14 },
      { header: 'Qabul Holati', key: 'status', width: 16 },
      { header: 'Mas\'ul', key: 'responsible', width: 18 },
    ]
    styleHeader(wsRcv.getRow(1), 'FFF59E0B')
    rcvLogs.forEach((l) => {
      const row = wsRcv.addRow({
        docNumber: l.docNumber,
        dateTime: `${l.date} ${l.time}`,
        supplierName: l.supplierName,
        productName: l.productName,
        batchNumber: l.batchNumber,
        quantityKg: l.quantityKg,
        vehicleNumber: l.vehicleNumber || '-',
        vehicleCleanOk: l.vehicleCleanOk ? 'Toza / OK' : 'Iflos',
        cargoTemp: l.cargoTemp ? `${l.cargoTemp}°C` : '-',
        hasLabCertificate: l.hasLabCertificate ? 'Mavjud' : 'Yo\'q',
        organolepticScore: `${l.organolepticScore || 5}/5`,
        status: l.status,
        responsible: l.responsible
      })
      styleDataRow(row)
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const uint8Array = new Uint8Array(buffer as ArrayBuffer)

    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Q_Nazorat_7_Jadval_QC_Jurnallari_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error: any) {
    console.error('Error exporting Process Excel:', error)
    return new Response(JSON.stringify({ error: 'Excel eksport qilishda xatolik' }), { status: 500 })
  }
}

function styleHeader(headerRow: ExcelJS.Row, hexColor: string) {
  headerRow.height = 28
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: hexColor },
    }
    cell.font = {
      name: 'Calibri',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    }
  })
}

function styleDataRow(row: ExcelJS.Row) {
  row.height = 20
  row.eachCell((cell) => {
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.font = { name: 'Calibri', size: 9 }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    }
  })
}
