import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/app/actions/auth'
import { parseSurveyDocxBuffer } from '@/lib/docx-survey-parser'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Fayl tanlanmadi' }, { status: 400 })
    }

    if (!file.name.endsWith('.docx')) {
      return NextResponse.json({ error: 'Faqat Word (.docx) formatidagi fayllar qabul qilinadi' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const parsed = await parseSurveyDocxBuffer(buffer)

    return NextResponse.json({
      success: true,
      title: parsed.title,
      description: parsed.description,
      questionsCount: parsed.questions.length,
      questions: parsed.questions
    })
  } catch (error: any) {
    console.error('Docx import error:', error)
    return NextResponse.json({ error: error.message || 'Faylni o\'qishda xatolik yuz berdi' }, { status: 500 })
  }
}
