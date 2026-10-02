import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/app/actions/auth'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

// GET: Barcha so'rovnomalarni olish (admin uchun)
export async function GET() {
  try {
    // Ensure tables exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Survey" (
        "id" SERIAL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "token" TEXT UNIQUE NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        "expiresAt" TIMESTAMP,
        "createdById" INTEGER,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SurveyQuestion" (
        "id" SERIAL PRIMARY KEY,
        "surveyId" INTEGER NOT NULL REFERENCES "Survey"("id") ON DELETE CASCADE,
        "orderIndex" INTEGER DEFAULT 0,
        "questionText" TEXT NOT NULL,
        "questionType" TEXT DEFAULT 'rating',
        "options" TEXT,
        "isRequired" BOOLEAN DEFAULT true,
        "groupName" TEXT,
        "subLabel" TEXT,
        "helpText" TEXT
      )
    `)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SurveyResponse" (
        "id" SERIAL PRIMARY KEY,
        "surveyId" INTEGER NOT NULL REFERENCES "Survey"("id"),
        "respondentName" TEXT,
        "restaurantName" TEXT,
        "respondentDate" TEXT,
        "submittedAt" TIMESTAMP DEFAULT NOW(),
        "ipAddress" TEXT
      )
    `)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SurveyAnswer" (
        "id" SERIAL PRIMARY KEY,
        "responseId" INTEGER NOT NULL REFERENCES "SurveyResponse"("id") ON DELETE CASCADE,
        "questionId" INTEGER NOT NULL REFERENCES "SurveyQuestion"("id"),
        "answerValue" TEXT NOT NULL
      )
    `)

    const surveys = await prisma.$queryRawUnsafe(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM "SurveyResponse" r WHERE r."surveyId" = s.id)::int as "responseCount",
        (SELECT COUNT(*) FROM "SurveyQuestion" q WHERE q."surveyId" = s.id)::int as "questionCount"
      FROM "Survey" s
      ORDER BY s."createdAt" DESC
    `) as any[]

    // For each survey, get questions
    const result = await Promise.all(surveys.map(async (s: any) => {
      const questions = await prisma.$queryRawUnsafe(
        `SELECT * FROM "SurveyQuestion" WHERE "surveyId" = $1 ORDER BY "orderIndex" ASC`, s.id
      ) as any[]
      const responses = await prisma.$queryRawUnsafe(
        `SELECT id FROM "SurveyResponse" WHERE "surveyId" = $1 ORDER BY "submittedAt" DESC LIMIT 50`, s.id
      ) as any[]
      return { ...s, questions, responses }
    }))

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('GET /api/surveys error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Yangi so'rovnoma yaratish
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    const body = await req.json()
    
    const { title, description, expiresAt, addDefault } = body
    let { questions } = body

    
    if (addDefault) {
      questions = [
        {
          orderIndex: 0,
          groupName: 'OOO "GREEN PROCESSING" mahsulotlarini yetkazib berish bo\'yicha shartnoma talablari bajarilishini va hamkorlikni 5 ballik shkalada baholang',
          subLabel: 'a)',
          questionText: 'Yetkazib berilayotgan mahsulot sifati kelishilgan talablarga (harorat, tashqi ko\'rinish, shartnoma shartlariga) mos keladimi?',
          questionType: 'rating',
            options: ['5','4','3','2','1'],
            isRequired: true
        },
        {
          orderIndex: 1,
          groupName: 'OOO "GREEN PROCESSING" mahsulotlarini yetkazib berish bo\'yicha shartnoma talablari bajarilishini va hamkorlikni 5 ballik shkalada baholang',
          subLabel: 'b)',
          questionText: 'So\'rovlaringiz, eslatmalaringiz, e\'tiroz va shikoyatlaringiz bo\'yicha ishlar tezkorlik bilan bajariladimi?',
          questionType: 'rating',
            options: ['5','4','3','2','1'],
            isRequired: true
        },
        {
          orderIndex: 2,
          groupName: 'OOO "GREEN PROCESSING" mahsulotlarini yetkazib berish bo\'yicha shartnoma talablari bajarilishini va hamkorlikni 5 ballik shkalada baholang',
          subLabel: 'v)',
          questionText: 'Mahsulotimizning rang va ta\'m ko\'rsatkichlarini qanday baholaysiz?',
          questionType: 'rating',
            options: ['5','4','3','2','1'],
            isRequired: true
        },
        {
          orderIndex: 3,
          groupName: 'OOO "GREEN PROCESSING" mahsulotlarini yetkazib berish bo\'yicha shartnoma talablari bajarilishini va hamkorlikni 5 ballik shkalada baholang',
          subLabel: 'g)',
          questionText: 'Mahsulotlar o\'z vaqtida yetkazib berilmoqdami?',
          questionType: 'rating',
            options: ['5','4','3','2','1'],
            isRequired: true
        },
        {
          orderIndex: 4,
          groupName: 'OOO "GREEN PROCESSING" mahsulotlarini yetkazib berish bo\'yicha shartnoma talablari bajarilishini va hamkorlikni 5 ballik shkalada baholang',
          subLabel: 'd)',
          questionText: 'So\'nggi uch oy ichida tayyor mahsulotda yot jismlar (soch, shisha, plastmassa va hokazo) uchrash holatlari bo\'ldimi?',
          questionType: 'rating',
            options: ['5','4','3','2','1'],
            isRequired: true
        },
        {
          orderIndex: 5,
          groupName: 'Iltimos, quyidagi savollarga javob bering:',
          subLabel: 'a)',
          questionText: 'So\'nggi uch oy davomida amaliyotingizda quyidagi holatlar kuzatildimi: -qutida mahsulot yetishmasligi; -qadoqning shikastlanishi; -pomidorlar ezilgan yoki butun emasligi; -buzilgan mahsulot; -vakuumlanmagan mahsulot; -markirovkasiz mahsulot;',
          questionType: 'yesno',
          helpText: 'Agar Ha bo\'lsa, iltimos batafsil yozing',
          options: ['Ha', "Yo'q"],
          isRequired: true
        },
        {
          orderIndex: 6,
          groupName: 'Iltimos, quyidagi savollarga javob bering:',
          subLabel: 'b)',
          questionText: 'So\'nggi uch oy ichida mahsulotlarimiz (piyoz, aysberg, "Koul Slou" salat aralashmasi) nostandart to\'g\'ralish holatlari bo\'ldimi? Agar javob "Ha" bo\'lsa, qachon? Qaysi mahsulot? Va bu haqda kimga xabar berdingiz?',
          questionType: 'yesno',
          helpText: 'Agar Ha bo\'lsa, qachon, qaysi mahsulot va kimga xabar berdingiz?',
          options: ['Ha', "Yo'q"],
          isRequired: true
        },
        {
          orderIndex: 7,
          groupName: 'Iltimos, quyidagi savollarga javob bering:',
          subLabel: 'v)',
          questionText: 'Mijozlar tomonidan mahsulotimizga nisbatan shikoyatlar bo\'ldimi? Agar javob "Ha" bo\'lsa, aynan nima bo\'yicha? Qaysi mahsulotga?',
          questionType: 'yesno',
          helpText: 'Agar Ha bo\'lsa, nima bo\'yicha va qaysi mahsulotga?',
          options: ['Ha', "Yo'q"],
          isRequired: true
        },
        {
          orderIndex: 8,
          groupName: 'Iltimos, quyidagi savollarga javob bering:',
          subLabel: 'g)',
          questionText: 'So\'nggi paytlarda mahsulot sifati o\'zgardimi? Agar "Ha" bo\'lsa, qachon? Qaysi mahsulot? Yaxshi tarafga yoxud yomon tarafga?',
          questionType: 'yesno',
          helpText: 'Agar Ha bo\'lsa, qachon, qaysi mahsulot, yaxshi yoki yomon tarafga?',
          options: ['Ha', "Yo'q"],
          isRequired: true
        },
        {
          orderIndex: 9,
          groupName: 'Iltimos, quyidagi savollarga javob bering:',
          subLabel: 'd)',
          questionText: 'Sizningcha, kompaniyamizdan xarid hajmini oshirishga nima yordam bergan bo\'lar edi:',
          questionType: 'select',
          options: ['Assortimentni kengaytirish', 'Mahsulot miqdori va grammini oshirish', 'Boshqa (fikringizni yozing)'],
          isRequired: true
        },
        {
          orderIndex: 10,
          groupName: null,
          subLabel: null,
          questionText: 'Tavsiyalar, e\'tirozlar va shikoyatlar:',
          questionType: 'text',
          isRequired: false
        }
      ]
    }


    const token = randomBytes(16).toString('hex');
    const surveys = await prisma.$queryRawUnsafe(`
      INSERT INTO "Survey" ("title", "description", "token", "isActive", "expiresAt", "createdById", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, true, $4, $5, NOW(), NOW())
      RETURNING *
    `, title, description || null, token, expiresAt ? new Date(expiresAt) : null, session?.id || null) as any[]

    const survey = surveys[0]

    // Insert questions
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        await prisma.$executeRawUnsafe(`
          INSERT INTO "SurveyQuestion" 
            ("surveyId", "orderIndex", "questionText", "questionType", "options", "isRequired", "groupName", "subLabel", "helpText")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
          survey.id, i, q.questionText, q.questionType || 'rating',
          q.options ? JSON.stringify(q.options) : null,
          q.isRequired ?? true, q.groupName || null, q.subLabel || null, q.helpText || null
        )
      }
    }

    const createdQuestions = await prisma.$queryRawUnsafe(
      `SELECT * FROM "SurveyQuestion" WHERE "surveyId" = $1 ORDER BY "orderIndex" ASC`, survey.id
    ) as any[]

    return NextResponse.json({ ...survey, questions: createdQuestions, responses: [] }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/surveys error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
