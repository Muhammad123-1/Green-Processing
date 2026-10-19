import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = await params
    const checklistId = parseInt(id)
    if (isNaN(checklistId)) {
      return NextResponse.json({ error: "Noto'g'ri ID" }, { status: 400 })
    }

    const doc = await prisma.dailyQCChecklist.findUnique({
      where: { id: checklistId },
    })

    if (!doc) {
      return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })
    }

    const form = JSON.parse(doc.formData || '{}')

    const templatePath = path.join(process.cwd(), 'data', 'FSSC_22000_QC_Checklist_3Languages_Fixed.xlsx')

    if (fs.existsSync(templatePath)) {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(templatePath)
      const ws = workbook.worksheets[0]

      // Fill Metadata (Rows 4-5)
      ws.getCell('A4').value = `Сана / Дата / Date: « ${doc.date} »`
      ws.getCell('C4').value = `Смена / Shift: ${doc.shift === '1' ? '[✓] 1-Смена   [  ] 2-Смена' : '[  ] 1-Смена   [✓] 2-Смена'}`
      ws.getCell('E4').value = `Назоратчи / Контролер / Inspector: ${doc.inspector || form.inspectorName || ''}`
      ws.getCell('G4').value = `Линия / Линия / Line: ${doc.lineName || '1-Линия'}`

      ws.getCell('A5').value = `Смена бошлиғи / Мастер / Supervisor: ${doc.supervisor || form.supervisorName || ''}`
      ws.getCell('C5').value = `Партия № / Партия № / Batch №: ${doc.batchNumber || ''}`
      ws.getCell('E5').value = `Брак / Брак / Rejected: ${doc.rejectedKg ?? 0} кг (kg)`
      ws.getCell('G5').value = `Умумий чиқиш / Выход / Total Output: ${doc.totalOutputBox ?? 0} коробка / box`

      // Section 1: Packaging Status (Rows 9-14)
      const statusP = (val: boolean) => (val ? '✓ Мос / OK\n(ОПРП / OPRP)' : '✗ Н/К (Не соотв)')

      // Always update Limon's inspection frequency to "Ҳар 5-пакет" as requested by user
      ws.getCell('G9').value = 'Ҳар 5-пакет\nКаждый 5-пакет\nEvery 5th pack'

      const packItems = Array.isArray(form.packagingItems) ? form.packagingItems : null

      if (packItems && packItems.length > 0) {
        if (packItems[0]) ws.getCell('H9').value = statusP(packItems[0].statusOk ?? true)
        if (packItems[1]) ws.getCell('H10').value = statusP(packItems[1].statusOk ?? true)
        if (packItems[2]) ws.getCell('H11').value = statusP(packItems[2].statusOk ?? true)
        if (packItems[3]) ws.getCell('H12').value = statusP(packItems[3].statusOk ?? true)
        if (packItems[4]) ws.getCell('H13').value = statusP(packItems[4].statusOk ?? true)
        if (packItems[5]) ws.getCell('H14').value = statusP(packItems[5].statusOk ?? true)

        const customItems = packItems.slice(6)
        if (customItems.length > 0) {
          customItems.forEach((c: any, idx: number) => {
            ws.spliceRows(15 + idx, 0, [
              String(7 + idx),
              c.nameUz ? (c.nameSub ? `${c.nameUz}\n${c.nameSub}` : c.nameUz) : `Маҳсулот ${7 + idx}`,
              c.packWeight || '1 kg / 1 пакет',
              c.packsPerBox || '6 та пакет',
              c.boxTotalWeight || '6 kg / 1 коробка',
              c.weightTolerance || '—',
              c.inspectionFrequency || 'Ҳар 5-пакет',
              statusP(c.statusOk ?? true),
            ])
          })
        }
      } else {
        ws.getCell('H9').value = statusP(form.packLemon ?? true)
        ws.getCell('H10').value = statusP(form.packCucumber ?? true)
        ws.getCell('H11').value = statusP(form.packTomato ?? true)
        ws.getCell('H12').value = statusP(form.packIceberg ?? true)
        ws.getCell('H13').value = statusP(form.packOnion ?? true)
        ws.getCell('H14').value = statusP(form.packColeslaw ?? true)
      }

      const offset = packItems && packItems.length > 6 ? packItems.length - 6 : 0

      // Section 2: Process & Safety (Rows 18-31 + offset)
      const statusT = (val: boolean) => (val ? '[✓] Мос / OK' : '[✗] Н/К (Не соотв)')

      // 1. Raw material
      ws.getCell(`D${18 + offset}`).value = `08:00: [ ${form.rawMaterialTemp1 || '+2'} ] °C\n14:00: [ ${form.rawMaterialTemp2 || '+3'} ] °C${form.rawMaterialTemp3 ? `\n__:__: [ ${form.rawMaterialTemp3} ] °C` : ''}`
      ws.getCell(`E${18 + offset}`).value = statusT(form.rawMaterialOk ?? true)
      if (form.rawMaterialDisc) ws.getCell(`F${18 + offset}`).value = form.rawMaterialDisc
      if (form.rawMaterialAct) ws.getCell(`G${18 + offset}`).value = form.rawMaterialAct

      // 2. Cleaning
      ws.getCell(`D${19 + offset}`).value = `Соғлом / Чисто:\n[ ${form.cleaningPercent || '100'} ] %`
      ws.getCell(`E${19 + offset}`).value = statusT(form.cleaningOk ?? true)
      if (form.cleaningDisc) ws.getCell(`F${19 + offset}`).value = form.cleaningDisc
      if (form.cleaningAct) ws.getCell(`G${19 + offset}`).value = form.cleaningAct

      // 3. Slicer cutting
      ws.getCell(`D${20 + offset}`).value = `Калибр / Размер:\n[ ${form.cuttingSize || '45'} ] мм (mm)`
      ws.getCell(`E${20 + offset}`).value = statusT(form.cuttingOk ?? true)
      if (form.cuttingDisc) ws.getCell(`F${20 + offset}`).value = form.cuttingDisc
      if (form.cuttingAct) ws.getCell(`G${20 + offset}`).value = form.cuttingAct

      // 4. Disinfection temp (CCP-2)
      ws.getCell(`D${21 + offset}`).value = `1) ${form.dezTemp1 || '+2'}°C  2) ${form.dezTemp2 || '+2'}°C\n3) ${form.dezTemp3 || '+2'}°C  4) ${form.dezTemp4 || '+2'}°C\n5) ${form.dezTemp5 || '+2'}°C  6) ${form.dezTemp6 || '+2'}°C`
      ws.getCell(`E${21 + offset}`).value = statusT(form.dezTempOk ?? true)
      if (form.dezTempDisc) ws.getCell(`F${21 + offset}`).value = form.dezTempDisc
      if (form.dezTempAct) ws.getCell(`G${21 + offset}`).value = form.dezTempAct

      // 5. Active chlorine (CCP-1)
      ws.getCell(`D${22 + offset}`).value = `1) ${form.dezChlorine1 || '300'}mg  2) ${form.dezChlorine2 || '300'}mg\n3) ${form.dezChlorine3 || '300'}mg  4) ${form.dezChlorine4 || '300'}mg\n5) ${form.dezChlorine5 || '300'}mg  6) ${form.dezChlorine6 || '300'}mg`
      ws.getCell(`E${22 + offset}`).value = statusT(form.dezChlorineOk ?? true)
      if (form.dezChlorineDisc) ws.getCell(`F${22 + offset}`).value = form.dezChlorineDisc
      if (form.dezChlorineAct) ws.getCell(`G${22 + offset}`).value = form.dezChlorineAct

      // 6. Preservative
      ws.getCell(`D${23 + offset}`).value = `Коул-Слоу Доза:\n[ ${form.preservative || '1'} ] г/кг (g/kg)`
      ws.getCell(`E${23 + offset}`).value = statusT(form.preservativeOk ?? true)
      if (form.preservativeDisc) ws.getCell(`F${23 + offset}`).value = form.preservativeDisc
      if (form.preservativeAct) ws.getCell(`G${23 + offset}`).value = form.preservativeAct

      // 7. Residual chlorine
      ws.getCell(`D${24 + offset}`).value = form.residualChlorine ? '[✓] 0 mg/l (OK)' : '[✗] Хлор бор / Есть'
      ws.getCell(`E${24 + offset}`).value = statusT(form.residualChlorineOk ?? true)
      if (form.residualChlorineDisc) ws.getCell(`F${24 + offset}`).value = form.residualChlorineDisc
      if (form.residualChlorineAct) ws.getCell(`G${24 + offset}`).value = form.residualChlorineAct

      // 8. Centrifuge
      ws.getCell(`D${25 + offset}`).value = form.dryingDry ? 'Салфетка: [✓] Қуруқ / Dry' : 'Салфетка: [✗] Нам / Wet'
      ws.getCell(`E${25 + offset}`).value = statusT(form.dryingOk ?? true)
      if (form.dryingDisc) ws.getCell(`F${25 + offset}`).value = form.dryingDisc
      if (form.dryingAct) ws.getCell(`G${25 + offset}`).value = form.dryingAct

      // 9. Inspection
      ws.getCell(`D${26 + offset}`).value = form.inspectionClean ? 'Визуал: [✓] 100% Тоза / Clean' : 'Нотоза'
      ws.getCell(`E${26 + offset}`).value = statusT(form.inspectionOk ?? true)
      if (form.inspectionDisc) ws.getCell(`F${26 + offset}`).value = form.inspectionDisc
      if (form.inspectionAct) ws.getCell(`G${26 + offset}`).value = form.inspectionAct

      // 10. Weight control
      ws.getCell(`D${27 + offset}`).value = `Лимон: [ ${form.weightLemon || '2'} ] дона\n1 kg: [ ${form.weight1kg || '1000'} ] g\n0.5 kg: [ ${form.weight500g || '500'} ] g`
      ws.getCell(`E${27 + offset}`).value = statusT(form.weightOk ?? true)
      if (form.weightDisc) ws.getCell(`F${27 + offset}`).value = form.weightDisc
      if (form.weightAct) ws.getCell(`G${27 + offset}`).value = form.weightAct

      // 11. Sealing
      ws.getCell(`D${28 + offset}`).value = form.sealingOk ? 'Шов: [✓] Герметик / OK' : 'Шов: [✗] Ҳаво бор / Утечка'
      ws.getCell(`E${28 + offset}`).value = statusT(form.sealingStatusOk ?? true)
      if (form.sealingDisc) ws.getCell(`F${28 + offset}`).value = form.sealingDisc
      if (form.sealingAct) ws.getCell(`G${28 + offset}`).value = form.sealingAct

      // 12. Metal detector (CCP-3)
      ws.getCell(`D${29 + offset}`).value = `Fe:[${form.metalFe ? '✓' : '✗'}] NonFe:[${form.metalNonFe ? '✓' : '✗'}] SS:[${form.metalSs ? '✓' : '✗'}]\nСигнал: [${form.metalSignal ? '✓' : ' '}] Бор`
      ws.getCell(`E${29 + offset}`).value = statusT(form.metalOk ?? true)
      if (form.metalDisc) ws.getCell(`F${29 + offset}`).value = form.metalDisc
      if (form.metalAct) ws.getCell(`G${29 + offset}`).value = form.metalAct

      // 13. Warehouse
      ws.getCell(`D${30 + offset}`).value = `Температура: [ ${form.fgStoreTemp || '+3'} ] °C\nВакуум: [${form.fgStoreVacuum ? '✓' : ' '}] Зич / OK`
      ws.getCell(`E${30 + offset}`).value = statusT(form.fgStoreOk ?? true)
      if (form.fgStoreDisc) ws.getCell(`F${30 + offset}`).value = form.fgStoreDisc
      if (form.fgStoreAct) ws.getCell(`G${30 + offset}`).value = form.fgStoreAct

      // 14. Hygiene
      ws.getCell(`D${31 + offset}`).value = `Тозалик: [${form.hygieneClean ? '✓' : ' '}] OK\nГигиена: [${form.hygieneGear ? '✓' : ' '}] OK`
      ws.getCell(`E${31 + offset}`).value = statusT(form.hygieneOk ?? true)
      if (form.hygieneDisc) ws.getCell(`F${31 + offset}`).value = form.hygieneDisc
      if (form.hygieneAct) ws.getCell(`G${31 + offset}`).value = form.hygieneAct

      // Section 3: Sign-Offs (Row 34 + offset)
      ws.getCell(`A${34 + offset}`).value = `СНБ (ОТК) Назоратчиси\nКонтролер ОКК / QC Inspector\nФ.И.Ш: ${form.inspectorName || doc.inspector || ''}\nИмзо: ${form.inspectorSign || '✓ Тасдиқланган'}\nВақт: ${form.inspectorTime || '20:00'}`
      ws.getCell(`D${34 + offset}`).value = `Смена бошлиғи\nМастер смены / Shift Supervisor\nФ.И.Ш: ${form.supervisorName || doc.supervisor || ''}\nИмзо: ${form.supervisorSign || '✓ Тасдиқланган'}\nВақт: ${form.supervisorTime || '20:00'}`
      ws.getCell(`F${34 + offset}`).value = `Сифат мутахассиси\nИнженер по качеству / QA Engineer\nФ.И.Ш: ${form.qaEngineerName || ''}\nИмзо: ${form.qaEngineerSign || '✓ Тасдиқланган'}\nВақт: ${form.qaEngineerTime || '20:00'}`

      const buffer = await workbook.xlsx.writeBuffer()

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="QC_Checklist_${doc.date}_Smena-${doc.shift}.xlsx"`,
        },
      })
    }

    // Fallback: standard workbook generation
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Smena Yakuni (QC)')
    worksheet.addRow({ param: 'YAGONA KUNLIK QC CHECK-LIST', value: '', norm: '' })
    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Checklist_${doc.date}_Smena-${doc.shift}.xlsx"`,
      },
    })
  } catch (error: any) {
    console.error('Excel export error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
