import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET public survey by token
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const surveys = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Survey" WHERE "token" = $1`, token
    ) as any[]

    if (!surveys.length) return NextResponse.json({ error: "So'rovnoma topilmadi" }, { status: 404 })
    const survey = surveys[0]

    if (!survey.isActive) return NextResponse.json({ error: "Bu so'rovnoma o'chirilgan" }, { status: 403 })
    if (survey.expiresAt && new Date() > new Date(survey.expiresAt)) {
      return NextResponse.json({ error: "Bu so'rovnoma muddati tugagan" }, { status: 403 })
    }

    const questions = await prisma.$queryRawUnsafe(
      `SELECT * FROM "SurveyQuestion" WHERE "surveyId" = $1 ORDER BY "orderIndex" ASC`, survey.id
    ) as any[]

    const { createdById, ...publicSurvey } = survey
    return NextResponse.json({ ...publicSurvey, questions })
  } catch (error: any) {
    console.error('GET survey token error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Submit response
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const body = await req.json()
    const { respondentName, restaurantName, respondentDate, answers } = body

    const surveys = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Survey" WHERE "token" = $1`, token
    ) as any[]

    if (!surveys.length) return NextResponse.json({ error: "So'rovnoma topilmadi" }, { status: 404 })
    const survey = surveys[0]

    if (!survey.isActive) return NextResponse.json({ error: "Bu so'rovnoma o'chirilgan" }, { status: 403 })
    if (survey.expiresAt && new Date() > new Date(survey.expiresAt)) {
      return NextResponse.json({ error: "Bu so'rovnoma muddati tugagan" }, { status: 403 })
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null

    const responses = await prisma.$queryRawUnsafe(`
      INSERT INTO "SurveyResponse" ("surveyId", "respondentName", "restaurantName", "respondentDate", "ipAddress", "submittedAt")
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, survey.id, respondentName || null, restaurantName || null, respondentDate || null, ip) as any[]

    const response = responses[0]

    if (answers && answers.length > 0) {
      for (const a of answers) {
        if (a.answerValue) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "SurveyAnswer" ("responseId", "questionId", "answerValue")
            VALUES ($1, $2, $3)
          `, response.id, a.questionId, a.answerValue)
        }
      }
    }

    return NextResponse.json({ success: true, responseId: response.id }, { status: 201 })
  } catch (error: any) {
    console.error('POST survey token error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
