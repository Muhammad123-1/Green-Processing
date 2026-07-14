import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import ExcelJS from 'exceljs'

export async function GET() {
  try {
    const templatePaths = [
      path.join(process.cwd(), 'templates', 'ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx'),
      path.join(process.cwd(), '..', 'ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx'),
      'C:\\Users\\yoqub\\OneDrive\\Desktop\\Exzel ovto\\ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx',
    ]

    let templatePath: string | null = null
    for (const p of templatePaths) {
      if (fs.existsSync(p)) {
        templatePath = p
        break
      }
    }

    if (!templatePath) {
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
