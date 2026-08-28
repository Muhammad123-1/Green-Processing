import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma' // Force Turbopack recompile

export async function GET(req: Request) {
  try {
    const checklists = await prisma.dailyQCChecklist.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(checklists)
  } catch (error: any) {
    console.error('Checklist GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      date, shift, lineName, batchNumber, 
      rejectedKg, totalOutputBox, 
      supervisor, inspector, 
      formData 
    } = body

    const newChecklist = await prisma.dailyQCChecklist.create({
      data: {
        date: date || new Date().toISOString().slice(0, 10),
        shift: shift || '1',
        lineName,
        batchNumber,
        rejectedKg: rejectedKg ? parseFloat(rejectedKg) : null,
        totalOutputBox: totalOutputBox ? parseFloat(totalOutputBox) : null,
        supervisor,
        inspector,
        formData: JSON.stringify(formData)
      }
    })

    return NextResponse.json(newChecklist)
  } catch (error: any) {
    console.error('Checklist POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
