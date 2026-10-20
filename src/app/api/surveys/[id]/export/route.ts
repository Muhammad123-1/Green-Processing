import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const surveyId = parseInt(id)
    if (isNaN(surveyId)) {
      return NextResponse.json({ error: "Noto'g'ri ID" }, { status: 400 })
    }

    const surveys = (await prisma.$queryRawUnsafe(
      `SELECT * FROM "Survey" WHERE "id" = $1`,
      surveyId
    )) as any[]

    if (!surveys || surveys.length === 0) {
      return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })
    }
    const survey = surveys[0]

    const questions = (await prisma.$queryRawUnsafe(
      `SELECT * FROM "SurveyQuestion" WHERE "surveyId" = $1 ORDER BY "orderIndex" ASC`,
      surveyId
    )) as any[]

    const responses = (await prisma.$queryRawUnsafe(
      `SELECT * FROM "SurveyResponse" WHERE "surveyId" = $1 ORDER BY "submittedAt" DESC`,
      surveyId
    )) as any[]

    const responsesWithAnswers = await Promise.all(
      responses.map(async (resp: any) => {
        const answers = (await prisma.$queryRawUnsafe(
          `SELECT * FROM "SurveyAnswer" WHERE "responseId" = $1`,
          resp.id
        )) as any[]
        return { ...resp, answers }
      })
    )

    // Calculate statistics
    const statsByQuestion: Record<
      number,
      {
        total: number
        c5: number
        c4: number
        c3: number
        c2: number
        c1: number
        ha: number
        yoq: number
        other: Record<string, number>
      }
    > = {}

    questions.forEach((q: any) => {
      statsByQuestion[q.id] = {
        total: 0,
        c5: 0,
        c4: 0,
        c3: 0,
        c2: 0,
        c1: 0,
        ha: 0,
        yoq: 0,
        other: {},
      }
    })

    responsesWithAnswers.forEach((resp) => {
      resp.answers.forEach((ans: any) => {
        const st = statsByQuestion[ans.questionId]
        if (!st) return
        st.total += 1
        const val = (ans.answerValue || '').trim()
        const cleanVal = val.includes('. Izoh:') ? val.split('. Izoh:')[0].trim() : val

        if (cleanVal === '5' || cleanVal === "A'lo" || cleanVal === 'Отлично') st.c5 += 1
        else if (cleanVal === '4' || cleanVal === 'Yaxshi' || cleanVal === 'Хорошо') st.c4 += 1
        else if (cleanVal === '3' || cleanVal === 'Qoniqarli' || cleanVal === 'Удовлетворительно') st.c3 += 1
        else if (cleanVal === '2' || cleanVal === 'Yomon' || cleanVal === 'Плохо') st.c2 += 1
        else if (cleanVal === '1' || cleanVal === 'Juda yomon' || cleanVal === 'Очень плохо') st.c1 += 1
        else if (cleanVal === 'Ha' || cleanVal === 'Да') st.ha += 1
        else if (cleanVal === "Yo'q" || cleanVal === 'Нет') st.yoq += 1
        else {
          st.other[cleanVal] = (st.other[cleanVal] || 0) + 1
        }
      })
    })

    // Compute overall score (including rating and inverted yes/no)
    let totalWeightedPct = 0
    let totalEvaluatedCount = 0

    questions.forEach((q: any) => {
      const st = statsByQuestion[q.id]
      if (!st) return

      if (q.questionType === 'rating') {
        const ratingCount = st.c5 + st.c4 + st.c3 + st.c2 + st.c1
        if (ratingCount > 0) {
          const sum = 5 * st.c5 + 4 * st.c4 + 3 * st.c3 + 2 * st.c2 + 1 * st.c1
          const avg = sum / ratingCount
          const pct = (avg / 5) * 100
          ;(st as any).avg = avg
          ;(st as any).pct = pct
          ;(st as any).evaluatedCount = ratingCount
          totalWeightedPct += pct * ratingCount
          totalEvaluatedCount += ratingCount
        }
      } else if (q.questionType === 'yesno') {
        const yesNoCount = st.ha + st.yoq
        if (yesNoCount > 0) {
          // INVERSION FIX:
          // "Yo'q" = POSITIVE (no defects) -> 100%
          // "Ha" = NEGATIVE (defects / complaints) -> 0%
          const pct = (st.yoq / yesNoCount) * 100
          const avg = (pct / 100) * 5
          ;(st as any).avg = avg
          ;(st as any).pct = pct
          ;(st as any).evaluatedCount = yesNoCount
          totalWeightedPct += pct * yesNoCount
          totalEvaluatedCount += yesNoCount
        }
      }
    })

    const overallPercent = totalEvaluatedCount > 0 ? totalWeightedPct / totalEvaluatedCount : 0
    const overallAvg = (overallPercent / 100) * 5

    // Build Excel Workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Green Processing ERP'
    workbook.created = new Date()

    // -------------------------------------------------------------------------
    // SHEET 1: Umumiy statistika
    // -------------------------------------------------------------------------
    const ws1 = workbook.addWorksheet('Umumiy Statistika', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    })

    // Header banner
    ws1.mergeCells('A1:L2')
    const titleCell = ws1.getCell('A1')
    titleCell.value = 'OOO "GREEN PROCESSING" — MIJOZLAR QONIQISH DARAJASI TAHLILI VA STATISTIKASI'
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF15803D' }, // emerald-700
    }

    // Meta row
    ws1.mergeCells('A3:L3')
    const subCell = ws1.getCell('A3')
    subCell.value = `So'rovnoma: "${survey.title}" | Sana: ${new Date().toLocaleDateString('uz-UZ')} | Holati: ${survey.isActive ? 'Faol' : 'Arxiv'}`
    subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FFFFFFFF' } }
    subCell.alignment = { horizontal: 'center', vertical: 'middle' }
    subCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF166534' }, // emerald-800
    }

    // KPI Summary
    ws1.getCell('A5').value = 'Jami respondentlar:'
    ws1.getCell('A5').font = { bold: true }
    ws1.getCell('B5').value = `${responses.length} ta tashkilot/mijoz`
    ws1.getCell('B5').font = { bold: true, color: { argb: 'FF15803D' } }

    ws1.getCell('E5').value = "O'rtacha qoniqish balli:"
    ws1.getCell('E5').font = { bold: true }
    ws1.getCell('F5').value = `${overallAvg.toFixed(2)} / 5.0`
    ws1.getCell('F5').font = { bold: true, color: { argb: 'FF2563EB' } }

    ws1.getCell('I5').value = 'Umumiy qoniqish indeksi:'
    ws1.getCell('I5').font = { bold: true }
    ws1.getCell('J5').value = `${overallPercent.toFixed(1)}%`
    ws1.getCell('J5').font = { bold: true, color: { argb: 'FF16A34A' } }

    // Questions table header (Row 7)
    const headers = [
      '№',
      'Baholash mezoni (Savol matni)',
      'Turi',
      "5 (A'lo)",
      '4 (Yaxshi)',
      '3 (Qoniqarli)',
      '2 (Yomon)',
      '1 (J.yomon)',
      'Ha / Yoq',
      'Jami javob',
      "O'rtacha ball",
      'Qoniqish %',
    ]

    const headerRow = ws1.getRow(7)
    headerRow.values = headers
    headerRow.height = 28
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }, // slate-800
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      }
    })

    // Populate questions
    let rowIndex = 8
    questions.forEach((q: any, idx: number) => {
      const st = statsByQuestion[q.id] || {
        total: 0,
        c5: 0,
        c4: 0,
        c3: 0,
        c2: 0,
        c1: 0,
        ha: 0,
        yoq: 0,
        other: {},
      }

      const ratingCount = st.c5 + st.c4 + st.c3 + st.c2 + st.c1
      const avg = ratingCount > 0 ? (5 * st.c5 + 4 * st.c4 + 3 * st.c3 + 2 * st.c2 + 1 * st.c1) / ratingCount : 0
      const pct = (avg / 5) * 100

      const yesNoStr = q.questionType === 'yesno' ? `Yo'q: ${st.yoq} / Ha: ${st.ha}` : '-'
      const anySt = st as any
      const avgStr = (anySt.evaluatedCount && anySt.evaluatedCount > 0) ? anySt.avg.toFixed(2) : '-'
      const pctStr = (anySt.evaluatedCount && anySt.evaluatedCount > 0) ? `${anySt.pct.toFixed(0)}%` : '-'

      const row = ws1.getRow(rowIndex)
      row.values = [
        q.subLabel || `${idx + 1}`,
        q.questionText,
        q.questionType === 'rating' ? '5 ballik' : q.questionType === 'yesno' ? 'Ha / Yo\'q' : 'Matn',
        st.c5 || 0,
        st.c4 || 0,
        st.c3 || 0,
        st.c2 || 0,
        st.c1 || 0,
        yesNoStr,
        st.total,
        avgStr,
        pctStr,
      ]

      row.height = 24
      const isEven = idx % 2 === 0
      row.eachCell((cell, colNumber) => {
        cell.font = { size: 9, name: 'Arial' }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        }
        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          }
        }
        if (colNumber === 2) {
          cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }

        // Highlight high and low ratings
        if (colNumber === 4 && st.c5 > 0) cell.font = { bold: true, color: { argb: 'FF16A34A' } }
        if (colNumber === 8 && st.c1 > 0) cell.font = { bold: true, color: { argb: 'FFDC2626' } }
        if (colNumber === 11 && ratingCount > 0) cell.font = { bold: true }
        if (colNumber === 12 && ratingCount > 0) {
          cell.font = { bold: true, color: { argb: pct >= 80 ? 'FF16A34A' : pct >= 60 ? 'FFD97706' : 'FFDC2626' } }
        }
      })

      rowIndex++
    })

    // Total summary row
    const totalRow = ws1.getRow(rowIndex)
    ws1.mergeCells(`A${rowIndex}:I${rowIndex}`)
    ws1.getCell(`A${rowIndex}`).value = "UMUMIY YAKUNIY KO'RSATKICH (O'rtacha):"
    ws1.getCell(`A${rowIndex}`).alignment = { horizontal: 'right', vertical: 'middle' }
    ws1.getCell(`A${rowIndex}`).font = { bold: true, size: 10 }

    totalRow.getCell(10).value = responses.length
    totalRow.getCell(11).value = overallAvg.toFixed(2)
    totalRow.getCell(12).value = `${overallPercent.toFixed(1)}%`

    totalRow.height = 26
    totalRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDCFCE7' }, // emerald-100
      }
      cell.font = { bold: true, color: { argb: 'FF166534' } }
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF16A34A' } },
        bottom: { style: 'double', color: { argb: 'FF16A34A' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })

    // Signatures
    const sigRowIdx = rowIndex + 3
    ws1.getCell(`A${sigRowIdx}`).value = 'Sifat nazorati bo\'limi boshlig\'i (QC Manager): _____________________'
    ws1.getCell(`A${sigRowIdx}`).font = { italic: true, size: 10 }
    ws1.getCell(`G${sigRowIdx}`).value = 'Tijorat bo\'limi rahbari: _____________________'
    ws1.getCell(`G${sigRowIdx}`).font = { italic: true, size: 10 }

    const dateRowIdx = sigRowIdx + 1
    ws1.getCell(`A${dateRowIdx}`).value = `Sana: « ${new Date().toLocaleDateString('uz-UZ')} »`
    ws1.getCell(`A${dateRowIdx}`).font = { italic: true, size: 9, color: { argb: 'FF64748B' } }

    // Column widths
    ws1.getColumn(1).width = 6
    ws1.getColumn(2).width = 46
    ws1.getColumn(3).width = 12
    ws1.getColumn(4).width = 10
    ws1.getColumn(5).width = 10
    ws1.getColumn(6).width = 12
    ws1.getColumn(7).width = 10
    ws1.getColumn(8).width = 10
    ws1.getColumn(9).width = 16
    ws1.getColumn(10).width = 12
    ws1.getColumn(11).width = 14
    ws1.getColumn(12).width = 14

    // -------------------------------------------------------------------------
    // SHEET 2: Mijozlar javoblari
    // -------------------------------------------------------------------------
    const ws2 = workbook.addWorksheet('Mijozlar Javoblari', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToWidth: 1 },
    })

    // Title banner
    const maxCols = 5 + questions.length
    const endColLetter = String.fromCharCode(65 + Math.min(maxCols - 1, 25))
    ws2.mergeCells(`A1:${endColLetter}2`)
    const respTitleCell = ws2.getCell('A1')
    respTitleCell.value = 'MIJOZLAR TOMONIDAN BERILGAN BATAFSIL JAVOBLAR RO\'YXATI'
    respTitleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } }
    respTitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    respTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0284C7' }, // sky-600
    }

    // Header row
    const respHeaders = [
      '№',
      'Restoran / Mijoz nomi',
      'Mas\'ul shaxs (F.I.SH)',
      'Sana',
      'Yuborilgan vaqt',
      ...questions.map((q: any) => `${q.subLabel ? q.subLabel + ' ' : ''}${q.questionText.substring(0, 35)}...`),
    ]

    const respHeaderRow = ws2.getRow(4)
    respHeaderRow.values = respHeaders
    respHeaderRow.height = 30
    respHeaderRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0369A1' }, // sky-700
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } },
      }
    })

    // Rows
    responsesWithAnswers.forEach((resp: any, rIdx: number) => {
      const rowNum = 5 + rIdx
      const rRow = ws2.getRow(rowNum)
      const answerMap: Record<number, string> = {}
      ;(resp.answers || []).forEach((ans: any) => {
        answerMap[ans.questionId] = ans.answerValue || ''
      })

      const rowValues = [
        rIdx + 1,
        resp.restaurantName || "Noma'lum restoran",
        resp.respondentName || '-',
        resp.respondentDate || '-',
        resp.submittedAt ? new Date(resp.submittedAt).toLocaleDateString('uz-UZ') : '-',
        ...questions.map((q: any) => answerMap[q.id] || '-'),
      ]

      rRow.values = rowValues
      rRow.height = 22
      const isEven = rIdx % 2 === 0
      rRow.eachCell((cell, col) => {
        cell.font = { size: 9, name: 'Arial' }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        }
        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0F9FF' }, // sky-50
          }
        }
        if (col === 2 || col === 3) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' }
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }
      })
    })

    // Set column widths for Sheet 2
    ws2.getColumn(1).width = 6
    ws2.getColumn(2).width = 28
    ws2.getColumn(3).width = 22
    ws2.getColumn(4).width = 14
    ws2.getColumn(5).width = 16
    questions.forEach((_, qIdx) => {
      ws2.getColumn(6 + qIdx).width = 24
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const cleanFileName = `Sorovnoma_Statistika_${surveyId}_${new Date().toISOString().slice(0, 10)}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${cleanFileName}"`,
      },
    })
  } catch (error: any) {
    console.error('Survey Excel export error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
