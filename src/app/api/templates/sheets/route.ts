import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import ExcelJS from 'exceljs'

export async function GET() {
  try {
    const templatePath = path.join(process.cwd(), 'templates', 'ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx')

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ sheets: [], templateFound: false })
    }

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(templatePath)

    const sheets = workbook.worksheets.map((ws) => ws.name)

    return NextResponse.json({ sheets, templateFound: true, templatePath })
  } catch (error) {
    console.error('Error reading template:', error)
    return NextResponse.json({ sheets: [], templateFound: false })
  }
}
