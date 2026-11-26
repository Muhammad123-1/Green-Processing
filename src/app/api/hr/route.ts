import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        payrolls: {
          orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
          take: 1
        }
      }
    })

    // If no employees in database, initialize with factory internal staff from User table
    if (employees.length === 0) {
      const internalUsers = await prisma.user.findMany({
        where: { role: { not: 'SUPPLIER' } }
      })

      if (internalUsers.length > 0) {
        const staffRolesMap: Record<string, { pos: string; dept: string; salary: number }> = {
          DIRECTOR: { pos: 'Bosh Direktor', dept: "Ma'muriyat (Ofis)", salary: 15000000 },
          ADMIN: { pos: 'Tizim Administratori', dept: "Ma'muriyat (Ofis)", salary: 7000000 },
          PRODUCTION: { pos: "Sex Boshlig'i", dept: 'Ishlab chiqarish (Sex)', salary: 9000000 },
          TECHNOLOGY: { pos: 'Bosh Texnolog', dept: 'Ishlab chiqarish (Sex)', salary: 8000000 },
          QUALITY_CONTROL: { pos: 'Bosh Sifat Nazoratchisi', dept: 'Sifat nazorati (Lab)', salary: 6500000 },
          INSPECTOR: { pos: 'Sifat Nazoratchisi', dept: 'Sifat nazorati (Lab)', salary: 5500000 },
          WAREHOUSE: { pos: 'Katta Omborchi', dept: 'Omborxona', salary: 6000000 },
          ACCOUNTING: { pos: 'Bosh Buxgalter', dept: 'Buxgalteriya', salary: 8500000 },
          SUPPLY: { pos: "Ta'minot Boshlig'i", dept: "Sotuv va Ta'minot", salary: 6500000 },
          LOGISTICS: { pos: 'Logistika Menejeri', dept: "Sotuv va Ta'minot", salary: 5500000 },
          KITCHEN: { pos: 'Bosh Oshpaz', dept: 'Oshxona', salary: 4500000 },
          SECURITY: { pos: "Qo'riqlash Xizmati", dept: 'Xavfsizlik', salary: 4000000 },
          HR: { pos: 'Kadrlar Menejeri', dept: "Ma'muriyat (Ofis)", salary: 6000000 },
          DEGUSTATION: { pos: 'Degustatsiya Mutaxassisi', dept: 'Sifat nazorati (Lab)', salary: 5000000 },
        }

        for (const u of internalUsers) {
          const cfg = staffRolesMap[u.role] || { pos: u.role, dept: 'Ishlab chiqarish (Sex)', salary: 4500000 }
          const nameParts = u.name.split(' ')
          const fName = nameParts[0] || u.username
          const lName = nameParts.slice(1).join(' ') || 'Xodim'

          await prisma.employee.create({
            data: {
              userId: u.id,
              firstName: fName,
              lastName: lName,
              position: cfg.pos,
              salaryBase: cfg.salary,
              status: 'ACTIVE',
              phone: '+998 90 123 45 67',
              hireDate: new Date('2026-01-01'),
            }
          })
        }

        employees = await prisma.employee.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            payrolls: {
              orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
              take: 1
            }
          }
        })
      }
    }

    const deptMap: Record<string, string> = {
      'Bosh Direktor': "Ma'muriyat (Ofis)",
      'Tizim Administratori': "Ma'muriyat (Ofis)",
      "Sex Boshlig'i": 'Ishlab chiqarish (Sex)',
      'Bosh Texnolog': 'Ishlab chiqarish (Sex)',
      'Bosh Sifat Nazoratchisi': 'Sifat nazorati (Lab)',
      'Sifat Nazoratchisi': 'Sifat nazorati (Lab)',
      'Katta Omborchi': 'Omborxona',
      'Bosh Buxgalter': 'Buxgalteriya',
      "Ta'minot Boshlig'i": "Sotuv va Ta'minot",
      'Logistika Menejeri': "Sotuv va Ta'minot",
      'Bosh Oshpaz': 'Oshxona',
      "Qo'riqlash Xizmati": 'Xavfsizlik',
      'Kadrlar Menejeri': "Ma'muriyat (Ofis)",
      'Degustatsiya Mutaxassisi': 'Sifat nazorati (Lab)',
    }

    const formatted = employees.map(emp => ({
      ...emp,
      baseSalary: emp.salaryBase || 0,
      isActive: emp.status === 'ACTIVE',
      department: deptMap[emp.position] || (emp.departmentId ? `Bo'lim #${emp.departmentId}` : 'Ishlab chiqarish (Sex)'),
    }))

    return NextResponse.json(formatted)
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
    const { firstName, lastName, position, department, phone, baseSalary } = data

    if (!firstName || !lastName || !position) {
      return NextResponse.json({ error: "Ism, familiya va lavozim majburiy" }, { status: 400 })
    }

    const parsedDeptId = department && !isNaN(parseInt(department)) ? parseInt(department) : undefined

    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        position,
        departmentId: parsedDeptId,
        phone,
        salaryBase: baseSalary ? parseFloat(baseSalary) : 0,
        status: 'ACTIVE',
        hireDate: new Date()
      }
    })

    return NextResponse.json({
      ...employee,
      baseSalary: employee.salaryBase || 0,
      isActive: employee.status === 'ACTIVE',
      department: department || 'Ishlab chiqarish (Sex)'
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating employee:', error)
    return NextResponse.json({ error: 'Xodim yaratishda xatolik' }, { status: 500 })
  }
}
