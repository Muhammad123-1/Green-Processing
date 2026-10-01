import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET single survey by id (with full responses)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const surveys = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Survey" WHERE "id" = $1`, parseInt(id)
    ) as any[]
    if (!surveys.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const survey = surveys[0]

    const questions = await prisma.$queryRawUnsafe(
      `SELECT * FROM "SurveyQuestion" WHERE "surveyId" = $1 ORDER BY "orderIndex" ASC`, survey.id
    ) as any[]

    const responses = await prisma.$queryRawUnsafe(
      `SELECT * FROM "SurveyResponse" WHERE "surveyId" = $1 ORDER BY "submittedAt" DESC`, survey.id
    ) as any[]

    const responsesWithAnswers = await Promise.all(responses.map(async (resp: any) => {
      const answers = await prisma.$queryRawUnsafe(
        `SELECT * FROM "SurveyAnswer" WHERE "responseId" = $1`, resp.id
      ) as any[]
      return { ...resp, answers }
    }))

    return NextResponse.json({ ...survey, questions, responses: responsesWithAnswers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH: Update survey
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title, description, isActive, expiresAt } = body

    const sets: string[] = []
    const vals: any[] = []
    let i = 1

    if (title !== undefined) { sets.push(`"title" = $${i++}`); vals.push(title) }
    if (description !== undefined) { sets.push(`"description" = $${i++}`); vals.push(description) }
    if (isActive !== undefined) { sets.push(`"isActive" = $${i++}`); vals.push(isActive) }
    if (expiresAt !== undefined) { sets.push(`"expiresAt" = $${i++}`); vals.push(expiresAt ? new Date(expiresAt) : null) }
    sets.push(`"updatedAt" = NOW()`)
    vals.push(parseInt(id))

    const surveys = await prisma.$queryRawUnsafe(
      `UPDATE "Survey" SET ${sets.join(', ')} WHERE "id" = $${i} RETURNING *`,
      ...vals
    ) as any[]

    return NextResponse.json(surveys[0])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Delete answers first
    await prisma.$executeRawUnsafe(
      `DELETE FROM "SurveyAnswer" WHERE "responseId" IN (SELECT id FROM "SurveyResponse" WHERE "surveyId" = $1)`,
      parseInt(id)
    )
    await prisma.$executeRawUnsafe(`DELETE FROM "SurveyResponse" WHERE "surveyId" = $1`, parseInt(id))
    await prisma.$executeRawUnsafe(`DELETE FROM "SurveyQuestion" WHERE "surveyId" = $1`, parseInt(id))
    await prisma.$executeRawUnsafe(`DELETE FROM "Survey" WHERE "id" = $1`, parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
