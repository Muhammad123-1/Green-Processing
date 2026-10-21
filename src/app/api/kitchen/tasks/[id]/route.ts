import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const taskId = parseInt(id, 10)
    if (isNaN(taskId)) {
      return NextResponse.json({ success: false, error: "Noto'g'ri ID" }, { status: 400 })
    }

    const session = await getSession()
    const body = await req.json()

    // Check if this is a Director/Inspector review action
    if (body.action === 'REVIEW') {
      const { status, reviewComment, reviewedBy } = body
      if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
        return NextResponse.json({ success: false, error: "Noto'g'ri status" }, { status: 400 })
      }

      const updated = await prisma.kitchenTaskLog.update({
        where: { id: taskId },
        data: {
          status,
          reviewComment: reviewComment || null,
          reviewedBy: reviewedBy || session?.name || 'Direktor',
          reviewedAt: new Date()
        }
      })

      return NextResponse.json({ success: true, task: updated })
    }

    // Normal edit of task fields
    const {
      date,
      staffName,
      staffRole,
      timeFrom,
      timeTo,
      shift,
      category,
      title,
      description,
      servings,
      itemsUsed,
      cleaningArea,
      cleaningAgent,
      photos
    } = body

    const updated = await prisma.kitchenTaskLog.update({
      where: { id: taskId },
      data: {
        ...(date && { date }),
        ...(staffName && { staffName }),
        ...(staffRole && { staffRole }),
        ...(timeFrom && { timeFrom }),
        ...(timeTo && { timeTo }),
        ...(shift && { shift }),
        ...(category && { category }),
        ...(title && { title }),
        description: description ?? undefined,
        servings: servings !== undefined ? (servings ? parseInt(String(servings), 10) : null) : undefined,
        itemsUsed: itemsUsed !== undefined ? (typeof itemsUsed === 'string' ? itemsUsed : JSON.stringify(itemsUsed)) : undefined,
        cleaningArea: cleaningArea ?? undefined,
        cleaningAgent: cleaningAgent ?? undefined,
        photos: photos !== undefined ? (typeof photos === 'string' ? photos : JSON.stringify(photos)) : undefined
      }
    })

    return NextResponse.json({ success: true, task: updated })
  } catch (error: any) {
    console.error('Kitchen task PUT error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const taskId = parseInt(id, 10)
    if (isNaN(taskId)) {
      return NextResponse.json({ success: false, error: "Noto'g'ri ID" }, { status: 400 })
    }

    await prisma.kitchenTaskLog.delete({
      where: { id: taskId }
    })

    return NextResponse.json({ success: true, message: "O'chirildi" })
  } catch (error: any) {
    console.error('Kitchen task DELETE error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
