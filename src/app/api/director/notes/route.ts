import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

const NOTES_FILE_PATH = path.join(process.cwd(), 'src/data/customDirectorNotes.json')

function readNotesFromFile(): any[] {
  try {
    if (fs.existsSync(NOTES_FILE_PATH)) {
      const content = fs.readFileSync(NOTES_FILE_PATH, 'utf-8')
      const parsed = JSON.parse(content)
      return Array.isArray(parsed.notes) ? parsed.notes : []
    }
  } catch (err) {
    console.error('Error reading notes file:', err)
  }
  return []
}

function writeNotesToFile(notes: any[]) {
  try {
    fs.writeFileSync(NOTES_FILE_PATH, JSON.stringify({ notes }, null, 2), 'utf-8')
  } catch (err) {
    console.error('Error writing notes file:', err)
  }
}

export async function GET() {
  try {
    // Try to get from database first
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: 'director_custom_notes' }
      })
      if (setting && setting.value) {
        const dbNotes = JSON.parse(setting.value)
        return NextResponse.json({ success: true, notes: dbNotes })
      }
    } catch (dbErr) {
      // Database read fallback to file
    }

    const fileNotes = readNotesFromFile()
    return NextResponse.json({ success: true, notes: fileNotes })
  } catch (error) {
    console.error('Error fetching director notes:', error)
    return NextResponse.json({ success: false, notes: [] }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, product, period, category, author } = body

    if (!text || !text.trim()) {
      return NextResponse.json({ success: false, error: 'Izoh matni bo‘sh bo‘lishi mumkin emas' }, { status: 400 })
    }

    const newNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text: text.trim(),
      product: product || 'Umumiy',
      period: period || 'Noyabr 2026',
      category: category || 'general',
      author: author || 'Direktor',
      createdAt: new Date().toISOString()
    }

    // Read current
    let currentNotes = readNotesFromFile()
    currentNotes.unshift(newNote)

    // Save to file
    writeNotesToFile(currentNotes)

    // Sync to database
    try {
      await prisma.setting.upsert({
        where: { key: 'director_custom_notes' },
        update: { value: JSON.stringify(currentNotes) },
        create: {
          key: 'director_custom_notes',
          value: JSON.stringify(currentNotes),
          category: 'director'
        }
      })
    } catch (dbErr) {
      console.warn('Could not sync director note to database Setting:', dbErr)
    }

    return NextResponse.json({ success: true, note: newNote, notes: currentNotes })
  } catch (error) {
    console.error('Error saving director note:', error)
    return NextResponse.json({ success: false, error: 'Izohni saqlashda xatolik yuz berdi' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID talab qilinadi' }, { status: 400 })
    }

    let currentNotes = readNotesFromFile()
    currentNotes = currentNotes.filter((n: any) => n.id !== id)

    writeNotesToFile(currentNotes)

    try {
      await prisma.setting.upsert({
        where: { key: 'director_custom_notes' },
        update: { value: JSON.stringify(currentNotes) },
        create: {
          key: 'director_custom_notes',
          value: JSON.stringify(currentNotes),
          category: 'director'
        }
      })
    } catch (dbErr) {
      console.warn('Could not sync note deletion to database Setting:', dbErr)
    }

    return NextResponse.json({ success: true, notes: currentNotes })
  } catch (error) {
    console.error('Error deleting director note:', error)
    return NextResponse.json({ success: false, error: 'Izohni o‘chirishda xatolik yuz berdi' }, { status: 500 })
  }
}
