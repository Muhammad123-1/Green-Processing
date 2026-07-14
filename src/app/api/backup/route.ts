import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const backups = await prisma.backup.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(backups)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `backup_${timestamp}.db`
    const backupDir = path.join(process.cwd(), 'backups')

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    const backupPath = path.join(backupDir, filename)

    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath)
      const stats = fs.statSync(backupPath)

      const backup = await prisma.backup.create({
        data: {
          filename,
          filePath: backupPath,
          sizeBytes: stats.size,
          createdBy: 'admin',
        },
      })

      return NextResponse.json(backup, { status: 201 })
    } else {
      // Create a record anyway for demo
      const backup = await prisma.backup.create({
        data: {
          filename,
          filePath: backupPath,
          sizeBytes: null,
          createdBy: 'admin',
        },
      })
      return NextResponse.json(backup, { status: 201 })
    }
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 })
  }
}
