import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title, description, questions } = body

    const surveyId = parseInt(id)

    // Update survey meta
    await prisma.$executeRawUnsafe(
      `UPDATE "Survey" SET "title" = $1, "description" = $2, "updatedAt" = NOW() WHERE "id" = $3`,
      title, description || null, surveyId
    )

    // Delete existing questions
    await prisma.$executeRawUnsafe(
      `DELETE FROM "SurveyQuestion" WHERE "surveyId" = $1`,
      surveyId
    )

    // Insert new questions
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        
        let opts = q.options
        if (q.questionType === 'yesno' && (!opts || opts.length === 0)) opts = ["Ha", "Yo'q"]
        if (q.questionType === 'rating' && (!opts || opts.length === 0)) opts = ["5", "4", "3", "2", "1"]

        await prisma.$executeRawUnsafe(`
          INSERT INTO "SurveyQuestion" 
            ("surveyId", "orderIndex", "questionText", "questionType", "options", "isRequired", "groupName", "subLabel", "helpText")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
          surveyId, i, q.questionText, q.questionType || 'rating',
          opts && opts.length > 0 ? JSON.stringify(opts) : null,
          q.isRequired ?? true, q.groupName || null, q.subLabel || null, q.helpText || null
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PUT questions error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
