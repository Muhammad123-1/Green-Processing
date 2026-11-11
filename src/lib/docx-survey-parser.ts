import mammoth from 'mammoth'

export interface ParsedQuestion {
  orderIndex: number
  subLabel?: string
  questionText: string
  questionType: 'select' | 'text' | 'yesno' | 'rating'
  helpText?: string
  options?: string[]
  isRequired: boolean
  groupName?: string
  correctAnswer?: string
}

export interface ParsedDocxSurvey {
  title: string
  description?: string
  questions: ParsedQuestion[]
}

export async function parseSurveyDocxBuffer(buffer: Buffer): Promise<ParsedDocxSurvey> {
  const result = await mammoth.extractRawText({ buffer })
  const rawText = result.value
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)

  let title = 'Import qilingan so\'rovnoma'
  let description = ''
  const questions: ParsedQuestion[] = []

  // Try finding title from header lines
  const titleCandidate = lines.find(l => 
    /КОНТРОЛЬНЫЙ ВОПРОСНИК|САВОЛ-ЖАВОБ АНКЕТАСИ|АНКЕТА ОПРОСА|Опросник|Тестовые вопросы/i.test(l)
  )
  if (titleCandidate) {
    title = titleCandidate
  }

  const descCandidate = lines.find(l =>
    /ОЦЕНКА ЗНАНИЙ|ХОДИМНИ МАЛАКАСИНИ ОШИРИШ|Оценка квалификации/i.test(l)
  )
  if (descCandidate) {
    description = descCandidate
  }

  // Parse questions
  const qRegex = /^(?:№\s*(\d+)[\s.:]*(?:вопрос|савол)?|(?:вопрос|савол)[\s.:]*№?\s*(\d+)|(\d+)[\s.:]+(?:вопрос|савол))/i
  const optLetterRegex = /^[А-ЯA-Z]$/i
  const optPrefixedRegex = /^[А-ЯA-Z][\s]*[).:\-]\s*(.+)$/i

  let i = 0
  let qIndex = 0

  while (i < lines.length) {
    const line = lines[i]
    const match = line.match(qRegex)

    if (match) {
      const qNum = match[1] || match[2] || match[3] || String(qIndex + 1)
      const subLabel = `№${qNum}`
      i++

      let helpText = ''
      let questionText = ''
      const options: string[] = []

      // Check next line for help text or question text
      while (i < lines.length && !lines[i].match(qRegex) && !optLetterRegex.test(lines[i]) && !optPrefixedRegex.test(lines[i])) {
        const cur = lines[i]
        if (/^(?:отметьте|belgilang|танланг|тўғри жавобни|правильный вариант)/i.test(cur) && cur.length < 70) {
          helpText = cur
        } else {
          questionText = questionText ? `${questionText} ${cur}` : cur
        }
        i++
      }

      // Collect options
      while (i < lines.length && !lines[i].match(qRegex)) {
        const cur = lines[i]
        // Check if line is just letter: "А" followed by text on next line
        if (optLetterRegex.test(cur)) {
          const letter = cur.toUpperCase()
          i++
          const text = (i < lines.length && !lines[i].match(qRegex) && !optLetterRegex.test(lines[i])) ? lines[i] : ''
          if (text) {
            options.push(`${letter}) ${text}`)
            i++
          } else {
            options.push(`${letter})`)
          }
        } else {
          const prefMatch = cur.match(optPrefixedRegex)
          if (prefMatch) {
            options.push(cur)
            i++
          } else {
            // End of options or next section
            break
          }
        }
      }

      let detectedCorrectAnswer: string | undefined = undefined
      const cleanOptions = options.map(opt => {
        if (opt.startsWith('*') || opt.endsWith('*') || /\(\s*[+*]\s*\)|\(to['`’]g['`’]ri\)|\(правильн[а-я]+\)/i.test(opt)) {
          const cleaned = opt
            .replace(/^\*\s*/, '')
            .replace(/\s*\*$/, '')
            .replace(/\s*\(\s*[+*]\s*\)/g, '')
            .replace(/\s*\(to['`’]g['`’]ri\)/gi, '')
            .replace(/\s*\(правильн[а-я]+\)/gi, '')
            .trim()
          detectedCorrectAnswer = cleaned
          return cleaned
        }
        return opt
      })

      if (questionText) {
        questions.push({
          orderIndex: qIndex,
          subLabel,
          questionText,
          helpText: helpText || undefined,
          questionType: cleanOptions.length > 0 ? 'select' : 'text',
          options: cleanOptions.length > 0 ? cleanOptions : undefined,
          correctAnswer: detectedCorrectAnswer,
          isRequired: true,
          groupName: titleCandidate || undefined
        })
        qIndex++
      }
    } else {
      i++
    }
  }

  return {
    title,
    description: description || undefined,
    questions
  }
}
