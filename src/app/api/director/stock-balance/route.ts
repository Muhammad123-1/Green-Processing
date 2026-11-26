import { NextRequest, NextResponse } from 'next/server'
import dailyStockData from '@/data/dailyStockLedger.json'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date') // e.g. 2026-11-25, 2026-11-02, 2026-11-02_2026-11-07
    const typeParam = searchParams.get('type') // daily or weekly

    const tables = dailyStockData.tables as any[]
    const availableDates = dailyStockData.availableDates as any[]

    let selectedTable = null

    if (dateParam) {
      selectedTable = tables.find(t => t.id === dateParam || t.isoDate === dateParam || t.title.includes(dateParam))
    }

    // Default to the latest available table (2026-11-25)
    if (!selectedTable) {
      selectedTable = tables.find(t => t.id === '2026-11-25') || tables[tables.length - 1]
    }

    return NextResponse.json({
      success: true,
      currentTable: selectedTable,
      availableDates,
      totalTables: dailyStockData.totalTables,
      dailyCount: dailyStockData.dailyCount,
      weeklyCount: dailyStockData.weeklyCount,
      updatedAt: dailyStockData.updatedAt
    })
  } catch (error) {
    console.error('Error in director stock-balance API:', error)
    return NextResponse.json({ success: false, error: 'Failed to load stock balance data' }, { status: 500 })
  }
}
