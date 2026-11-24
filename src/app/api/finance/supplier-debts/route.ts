import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/app/actions/auth'
import { calculateSupplierDebts } from '@/lib/supplierDebts'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await calculateSupplierDebts()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in supplier-debts route:', error)
    return NextResponse.json({ error: "Ta'minotchi qarzdorliklarini yuklashda xatolik" }, { status: 500 })
  }
}
