import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        payrolls: {
          orderBy: { periodStart: 'desc' },
          take: 1
        }
      }
    })

    return NextResponse.json(employees)
  } catch (error: any) {
    console.error('Error fetching employees:', error)
    return NextResponse.json({ error: 'Xodimlarni yuklashda xatolik' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await request.json()
    const { firstName, lastName, position, department, phone, salaryType, baseSalary } = data

    if (!firstName || !lastName || !position) {
      return NextResponse.json({ error: "Ism, familiya va lavozim majburiy" }, { status: 400 })
    }

    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        position,
        department,
        phone,
        salaryType: salaryType || 'FIXED',
        baseSalary: baseSalary ? parseFloat(baseSalary) : 0
      }
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error: any) {
    console.error('Error creating employee:', error)
    return NextResponse.json({ error: 'Xodim yaratishda xatolik' }, { status: 500 })
  }
}
