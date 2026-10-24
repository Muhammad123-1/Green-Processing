import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productName = searchParams.get('productName')?.trim().toLowerCase() || ''
    const supplierName = searchParams.get('supplierName')?.trim().toLowerCase() || ''
    const date = searchParams.get('date')?.trim() || ''

    // Fetch recent arrivals
    const arrivals = await prisma.shopArrival.findMany({
      take: 200,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        nomenclature: true,
        quantity: true,
        supplier: true,
        batch: true,
        createdAt: true
      }
    })

    // Filter by matching criteria
    const filtered = arrivals.filter((item) => {
      const nom = (item.nomenclature || '').toLowerCase()
      const sup = (item.supplier || '').toLowerCase()

      // If product name is provided, match keywords
      if (productName) {
        const words = productName.split(/\s+/).filter((w: string) => w.length > 2)
        const matchesProduct = words.length > 0 
          ? words.some((w: string) => nom.includes(w)) || nom.includes(productName)
          : nom.includes(productName)

        if (!matchesProduct) return false
      }

      // If supplier is provided, check match
      if (supplierName && supplierName !== "noma'lum" && supplierName !== 'ta\'minotchi ko\'rsatilmagan') {
        const sWords = supplierName.split(/\s+/).filter((w: string) => w.length > 2)
        const matchesSup = sWords.some((w: string) => sup.includes(w)) || sup.includes(supplierName)
        if (!matchesSup && !productName) return false
      }

      // If date is provided (optional soft match)
      if (date && item.date === date) {
        return true
      }

      return true
    }).slice(0, 15)

    return NextResponse.json(filtered)
  } catch (error) {
    console.error('Match arrivals error:', error)
    return NextResponse.json({ error: 'Failed to search arrivals' }, { status: 500 })
  }
}
