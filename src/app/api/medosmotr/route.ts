import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function parseDateStr(str?: string | null): Date | null {
  if (!str) return null
  const clean = str.replace('г', '').trim()
  if (clean.includes('.')) {
    const parts = clean.split('.')
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0')
      const month = parts[1].padStart(2, '0')
      const year = parts[2]
      return new Date(`${year}-${month}-${day}T00:00:00Z`)
    }
  }
  const d = new Date(clean)
  return isNaN(d.getTime()) ? null : d
}

function calculateStatus(dateStr?: string | null, bloodPressure?: string | null): 'EXPIRED' | 'URGENT' | 'VALID' {
  const d = parseDateStr(dateStr)
  const now = new Date()

  let highBP = false
  if (bloodPressure) {
    const [sys, dia] = bloodPressure.split('/').map(s => parseInt(s.trim()))
    if ((sys && sys >= 140) || (dia && dia >= 95)) {
      highBP = true
    }
  }

  if (!d) return highBP ? 'URGENT' : 'VALID'

  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'EXPIRED' // Overdue => RED
  if (diffDays <= 30 || highBP) return 'URGENT' // Approaching or high BP => RED
  return 'VALID' // Normal => GREEN
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const department = searchParams.get('department')?.trim()
    const isDriverParam = searchParams.get('isDriver')
    const filterStatus = searchParams.get('status')?.trim()
    const search = searchParams.get('search')?.toLowerCase().trim()

    const where: any = {}
    if (department && department !== 'ALL') {
      where.department = department
    }
    if (isDriverParam === 'true') {
      where.isDriver = true
    }

    const items = await prisma.employeeMedicalExam.findMany({
      where,
      orderBy: [{ id: 'asc' }]
    })

    // Dynamically calculate status and prioritize RED (EXPIRED & URGENT) to the TOP
    const mapped = items.map(item => {
      const liveStatus = calculateStatus(item.examDate, item.bloodPressure)
      return {
        ...item,
        status: liveStatus
      }
    })

    // Filter by search query if any
    let filtered = mapped
    if (search) {
      filtered = filtered.filter(item =>
        item.fullName.toLowerCase().includes(search) ||
        item.department.toLowerCase().includes(search) ||
        item.position.toLowerCase().includes(search) ||
        (item.conclusion && item.conclusion.toLowerCase().includes(search))
      )
    }

    // Filter by status if specified
    if (filterStatus && filterStatus !== 'ALL') {
      if (filterStatus === 'RED') {
        filtered = filtered.filter(item => item.status === 'EXPIRED' || item.status === 'URGENT')
      } else {
        filtered = filtered.filter(item => item.status === filterStatus)
      }
    }

    // Critical Sorting: EXPIRED and URGENT ALWAYS on TOP!
    filtered.sort((a, b) => {
      const weight = (s: string) => (s === 'EXPIRED' ? 0 : s === 'URGENT' ? 1 : 2)
      const diff = weight(a.status) - weight(b.status)
      if (diff !== 0) return diff
      return (a.orderNumber || 0) - (b.orderNumber || 0)
    })

    const summary = {
      total: mapped.length,
      expired: mapped.filter(i => i.status === 'EXPIRED').length,
      urgent: mapped.filter(i => i.status === 'URGENT').length,
      valid: mapped.filter(i => i.status === 'VALID').length,
      redTotal: mapped.filter(i => i.status === 'EXPIRED' || i.status === 'URGENT').length,
      driversTotal: mapped.filter(i => i.isDriver).length,
      driversRed: mapped.filter(i => i.isDriver && (i.status === 'EXPIRED' || i.status === 'URGENT')).length
    }

    return NextResponse.json({ success: true, items: filtered, summary })
  } catch (error: any) {
    console.error('Error fetching medical exams:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      fullName,
      department = 'Цех',
      position = 'Оператор цеха',
      examDate = new Date().toISOString().slice(0, 10),
      bloodPressure = '120/80',
      conclusion = 'Соғлом, рухсат',
      isDriver = false,
      signature = '',
      nurseSignature = 'Жуманова Ч.Э.',
      notes = ''
    } = body

    if (!fullName?.trim()) {
      return NextResponse.json({ success: false, error: 'Xodim F.I.O. kiritilishi shart' }, { status: 400 })
    }

    const count = await prisma.employeeMedicalExam.count({
      where: { department }
    })

    const status = calculateStatus(examDate, bloodPressure)
    const parsedDate = parseDateStr(examDate)

    const record = await prisma.employeeMedicalExam.create({
      data: {
        orderNumber: count + 1,
        fullName: fullName.trim(),
        department: department.trim(),
        position: position.trim(),
        examDate: examDate.trim(),
        parsedDate,
        bloodPressure: bloodPressure?.trim() || null,
        conclusion: conclusion?.trim() || null,
        status,
        isDriver: !!isDriver,
        signature: signature?.trim() || fullName.trim().split(' ')[0],
        nurseSignature: nurseSignature?.trim() || 'Жуманова Ч.Э.',
        notes: notes?.trim() || null
      }
    })

    return NextResponse.json({ success: true, record })
  } catch (error: any) {
    console.error('Error creating medical exam:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID talab qilinadi' }, { status: 400 })
    }

    if (data.examDate || data.bloodPressure) {
      data.status = calculateStatus(data.examDate, data.bloodPressure)
      data.parsedDate = parseDateStr(data.examDate)
    }

    const record = await prisma.employeeMedicalExam.update({
      where: { id: Number(id) },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, record })
  } catch (error: any) {
    console.error('Error updating medical exam:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID talab qilinadi' }, { status: 400 })
    }

    await prisma.employeeMedicalExam.delete({
      where: { id: Number(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting medical exam:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
