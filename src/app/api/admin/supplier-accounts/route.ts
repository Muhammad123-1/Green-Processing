import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'DIRECTOR' && session.role !== 'SUPPLY')) {
      return NextResponse.json({ error: 'Ruxsat berilmagan / Unauthorized' }, { status: 403 })
    }

    // Fetch all active suppliers with their linked user accounts
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      include: {
        users: {
          where: { role: 'SUPPLIER' },
          select: {
            id: true,
            name: true,
            username: true,
            password: true,
            role: true,
            isActive: true,
            createdAt: true
          }
        },
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Also get all users with role 'SUPPLIER'
    const supplierUsers = await prisma.user.findMany({
      where: { role: 'SUPPLIER' },
      select: {
        id: true,
        name: true,
        username: true,
        password: true,
        role: true,
        isActive: true,
        createdAt: true,
        supplier: {
          select: { id: true, name: true, phone: true, category: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ suppliers, supplierUsers })
  } catch (error: any) {
    console.error('Fetch supplier accounts error:', error)
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'DIRECTOR')) {
      return NextResponse.json({ error: 'Faqat Administrator ta\'minotchiga akkaunt ocha oladi' }, { status: 403 })
    }

    const body = await request.json()
    const { supplierId, username, password, name } = body

    if (!supplierId) {
      return NextResponse.json({ error: "Ta'minotchi korxonasi tanlanmagan" }, { status: 400 })
    }
    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Login (foydalanuvchi nomi) kiritilishi shart' }, { status: 400 })
    }
    if (!password || !password.trim()) {
      return NextResponse.json({ error: 'Parol kiritilishi shart' }, { status: 400 })
    }

    const cleanUsername = username.trim().toLowerCase()
    const existing = await prisma.user.findUnique({
      where: { username: cleanUsername }
    })
    if (existing) {
      return NextResponse.json({ error: `"${cleanUsername}" logini allaqachon mavjud! Boshqa login tanlang.` }, { status: 400 })
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(supplierId) }
    })
    if (!supplier) {
      return NextResponse.json({ error: "Bunday ta'minotchi topilmadi" }, { status: 404 })
    }

    const newUser = await prisma.user.create({
      data: {
        name: (name && name.trim()) || supplier.name,
        username: cleanUsername,
        password: password.trim(),
        role: 'SUPPLIER',
        supplierId: supplier.id,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        supplierId: true,
        createdAt: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      user: newUser,
      message: `Ta'minotchi "${supplier.name}" uchun yangi login yaratildi!` 
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create supplier account error:', error)
    return NextResponse.json({ error: error.message || 'Akkaunt yaratishda xatolik' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'DIRECTOR')) {
      return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, password, isActive, name } = body

    if (!userId) {
      return NextResponse.json({ error: 'Foydalanuvchi ID ko\'rsatilmadi' }, { status: 400 })
    }

    const updateData: any = {}
    if (password && password.trim()) updateData.password = password.trim()
    if (typeof isActive === 'boolean') updateData.isActive = isActive
    if (name && name.trim()) updateData.name = name.trim()

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        supplierId: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error: any) {
    console.error('Update supplier account error:', error)
    return NextResponse.json({ error: error.message || 'Yangilashda xatolik' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'DIRECTOR')) {
      return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'Foydalanuvchi ID kerak' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: parseInt(userId) }
    })

    return NextResponse.json({ success: true, message: "Ta'minotchi akkaunti o'chirildi" })
  } catch (error: any) {
    console.error('Delete supplier account error:', error)
    return NextResponse.json({ error: error.message || "O'chirishda xatolik" }, { status: 500 })
  }
}
