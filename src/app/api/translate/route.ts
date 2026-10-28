import { NextRequest, NextResponse } from 'next/server'
import { getDictionaryTranslation, translateTextOnline } from '@/lib/survey-translations'

export async function POST(req: NextRequest) {
  try {
    const { texts, targetLang } = await req.json()
    if (!texts || !Array.isArray(texts)) {
      return NextResponse.json({ error: 'texts massiv bo\'lishi shart' }, { status: 400 })
    }

    const lang = targetLang || 'ru'
    const results: Record<string, string> = {}

    // Process all texts in parallel
    await Promise.all(
      texts.map(async (text: string) => {
        if (!text) {
          results[text] = ''
          return
        }

        // Check dictionary first (instant 0ms)
        const dict = getDictionaryTranslation(text, lang)
        if (dict) {
          results[text] = dict
          return
        }

        // If target is dual (e.g. uz_ru, uz_en, ru_en), handle composition
        if (lang === 'uz_ru') {
          const ru = await translateTextOnline(text, 'ru')
          results[text] = `${text} / ${ru}`
          return
        }
        if (lang === 'uz_en') {
          const en = await translateTextOnline(text, 'en')
          results[text] = `${text} / ${en}`
          return
        }
        if (lang === 'ru_en') {
          const ru = await translateTextOnline(text, 'ru')
          const en = await translateTextOnline(text, 'en')
          results[text] = `${ru} / ${en}`
          return
        }

        // Single target: ru or en
        if (lang === 'ru' || lang === 'en') {
          const translated = await translateTextOnline(text, lang)
          results[text] = translated
          return
        }

        results[text] = text
      })
    )

    return NextResponse.json({ success: true, translations: results })
  } catch (error: any) {
    console.error('API /api/translate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
