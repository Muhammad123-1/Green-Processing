import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 1. Fetch real arrivals from Prixod to analyze suppliers
    const arrivals = await prisma.shopArrival.findMany({
      select: {
        supplier: true,
        quantity: true,
        nomenclature: true,
        date: true
      }
    })

    // Group & analyze by supplier
    const prixodMap: Record<
      string,
      {
        canonicalName: string
        totalKg: number
        deliveriesCount: number
        products: Set<string>
        lastDeliveryDate: string
      }
    > = {}

    for (const a of arrivals) {
      const raw = (a.supplier || '').trim()
      if (!raw || raw === '-' || raw.toLowerCase().includes('object') || raw.length < 2) continue

      const norm = raw.toLowerCase()
      if (!prixodMap[norm]) {
        prixodMap[norm] = {
          canonicalName: raw,
          totalKg: 0,
          deliveriesCount: 0,
          products: new Set(),
          lastDeliveryDate: ''
        }
      }

      const stat = prixodMap[norm]
      const qty = Number(a.quantity) || 0
      stat.totalKg += qty
      stat.deliveriesCount += 1
      if (a.nomenclature && a.nomenclature.trim()) {
        stat.products.add(a.nomenclature.trim())
      }
      if (a.date && (!stat.lastDeliveryDate || a.date > stat.lastDeliveryDate)) {
        stat.lastDeliveryDate = a.date
      }
    }

    // 2. Fetch existing suppliers in DB
    const existingSuppliers = await prisma.supplier.findMany()
    const existingMap: Record<string, typeof existingSuppliers[0]> = {}
    for (const s of existingSuppliers) {
      existingMap[s.name.trim().toLowerCase()] = s
    }

    // 3. Auto-sync missing suppliers from Prixod into DB table
    const allSuppliers = [...existingSuppliers]
    for (const [norm, stat] of Object.entries(prixodMap)) {
      if (!existingMap[norm]) {
        try {
          const created = await prisma.supplier.create({
            data: {
              name: stat.canonicalName,
              shortName: stat.canonicalName.length > 30 ? stat.canonicalName.slice(0, 30) : stat.canonicalName,
              phone: '+998 90 123 45 67',
              address: "O'zbekiston Respublikasi",
              category: 'PRODUCTION',
              isActive: true
            }
          })
          allSuppliers.push(created)
          existingMap[norm] = created
        } catch (err) {
          console.error('Failed to auto-seed supplier from prixod:', stat.canonicalName, err)
        }
      }
    }

    // 4. Enrich suppliers with Prixod statistics
    const enriched = allSuppliers
      .filter((s) => s.isActive)
      .map((s) => {
        const norm = s.name.trim().toLowerCase()
        const stat = prixodMap[norm]
        const totalKg = stat ? Math.round(stat.totalKg * 10) / 10 : 0
        const totalTonnes = Math.round((totalKg / 1000) * 100) / 100
        const deliveriesCount = stat ? stat.deliveriesCount : 0
        const products = stat ? Array.from(stat.products).slice(0, 8) : []
        const lastDeliveryDate = stat?.lastDeliveryDate || '-'

        return {
          id: s.id,
          name: s.name,
          shortName: s.shortName,
          address: s.address,
          phone: s.phone || '+998 90 123 45 67',
          email: s.email,
          certificate: s.certificate,
          category: s.category,
          isActive: s.isActive,
          totalKg,
          totalTonnes,
          deliveriesCount,
          products,
          lastDeliveryDate,
          status: s.isActive ? 'Faol' : 'Nofaol'
        }
      })
      .sort((a, b) => b.totalKg - a.totalKg)

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Failed to fetch suppliers:', error)
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Ta'minotchi nomi kiritilishi shart" }, { status: 400 })
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: body.name.trim(),
        shortName: body.shortName ? body.shortName.trim() : null,
        address: body.address ? body.address.trim() : null,
        phone: body.phone ? body.phone.trim() : null,
        email: body.email ? body.email.trim() : null,
        certificate: body.certificate ? body.certificate.trim() : null,
        category: body.category || 'PRODUCTION',
        isActive: true,
      },
    })
    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
