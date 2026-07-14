import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const backup = await prisma.backup.findUnique({
      where: { id: parseInt(id) },
    })

    if (!backup) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (fs.existsSync(backup.filePath)) {
      const buffer = fs.readFileSync(backup.filePath)
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${backup.filename}"`,
        },
      })
    }

    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
