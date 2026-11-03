import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function inferProductUnit(name: string, dbUnit?: string): 'kg' | 'dona' | 'litr' {
  if (dbUnit) {
    const u = dbUnit.toLowerCase().trim()
    if (u === 'dona' || u === 'шт' || u === 'pcs' || u === 'quti' || u === 'korobka' || u === 'don') return 'dona'
    if (u === 'litr' || u === 'л' || u === 'l') return 'litr'
    if (u === 'kg' || u === 'кг') return 'kg'
  }

  const s = name.toLowerCase().trim()
  if (
    s.includes('пакет') ||
    s.includes('каробка') ||
    s.includes('короб') ||
    s.includes('karobka') ||
    s.includes('этикетк') ||
    s.includes('стрич') ||
    s.includes('яшик') ||
    s.includes('падон') ||
    s.includes('скотч') ||
    s.includes('перчатк') ||
    s.includes('шапка') ||
    s.includes('бахила') ||
    s.includes('маска') ||
    s.includes('халат') ||
    s.includes('бумага') ||
    s.includes('салфетк') ||
    s.includes('полотенц') ||
    s.includes('рукавадник') ||
    s.includes('тара') ||
    s.includes('мешок') ||
    s.includes('сетка')
  ) {
    return 'dona'
  }

  if (s.includes('вода') || s.includes('масло') || s.includes('сироп')) {
    return 'litr'
  }

  return 'kg'
}

export async function GET() {
  try {
    // 1. Fetch products to get accurate unit definitions
    const dbProducts = await prisma.product.findMany({
      select: { name: true, unit: true, category: true }
    })
    const prodUnitMap = new Map<string, string>()
    for (const p of dbProducts) {
      if (p.name) prodUnitMap.set(p.name.trim().toLowerCase(), p.unit || 'kg')
    }

    // 2. Fetch real arrivals from Prixod to analyze suppliers
    const arrivals = await prisma.shopArrival.findMany({
      select: {
        supplier: true,
        quantity: true,
        nomenclature: true,
        date: true
      }
    })

    // Group & analyze by supplier separating kg, dona, and litr
    const prixodMap: Record<
      string,
      {
        canonicalName: string
        totalKg: number
        totalDona: number
        totalLitr: number
        deliveriesCount: number
        productsMap: Map<string, { name: string; qty: number; unit: string }>
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
          totalDona: 0,
          totalLitr: 0,
          deliveriesCount: 0,
          productsMap: new Map(),
          lastDeliveryDate: ''
        }
      }

      const stat = prixodMap[norm]
      const nom = (a.nomenclature || '').trim()
      const qty = Number(a.quantity) || 0
      const dbUnit = nom ? prodUnitMap.get(nom.toLowerCase()) : undefined
      const unit = inferProductUnit(nom, dbUnit)

      if (unit === 'dona') {
        stat.totalDona += Math.round(qty)
      } else if (unit === 'litr') {
        stat.totalLitr += qty
      } else {
        stat.totalKg += qty
      }

      stat.deliveriesCount += 1

      if (nom) {
        const nomKey = nom.toLowerCase()
        if (!stat.productsMap.has(nomKey)) {
          stat.productsMap.set(nomKey, { name: nom, qty: 0, unit })
        }
        const existing = stat.productsMap.get(nomKey)!
        existing.qty += qty
      }

      if (a.date && (!stat.lastDeliveryDate || a.date > stat.lastDeliveryDate)) {
        stat.lastDeliveryDate = a.date
      }
    }

    // 3. Fetch existing suppliers in DB
    const existingSuppliers = await prisma.supplier.findMany()
    const existingMap: Record<string, typeof existingSuppliers[0]> = {}
    for (const s of existingSuppliers) {
      existingMap[s.name.trim().toLowerCase()] = s
    }

    // 4. Auto-sync missing suppliers from Prixod into DB table
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

    // 5. Deduplicate suppliers by normalized name so duplicates in DB are unified
    const seenNames = new Set<string>()
    const uniqueSuppliers = allSuppliers.filter((s) => {
      const norm = s.name.trim().toLowerCase()
      if (seenNames.has(norm)) return false
      seenNames.add(norm)
      return true
    })

    // 6. Enrich suppliers with Prixod statistics (kg & dona strictly separated)
    const enriched = uniqueSuppliers
      .filter((s) => s.isActive)
      .map((s) => {
        const norm = s.name.trim().toLowerCase()
        const stat = prixodMap[norm]
        const totalKg = stat ? Math.round(stat.totalKg * 10) / 10 : 0
        const totalTonnes = Math.round((totalKg / 1000) * 100) / 100
        const totalDona = stat ? Math.round(stat.totalDona) : 0
        const totalLitr = stat ? Math.round(stat.totalLitr * 10) / 10 : 0
        const deliveriesCount = stat ? stat.deliveriesCount : 0
        const productsList = stat ? Array.from(stat.productsMap.values()) : []
        const products = productsList.map((p) => p.name).slice(0, 8)
        const productsDetails = productsList.slice(0, 12)
        const lastDeliveryDate = stat?.lastDeliveryDate || '-'

        // Determine primary supplier profile
        const hasWeight = totalKg > 0
        const hasDona = totalDona > 0
        let supplyType: 'KG' | 'DONA' | 'MIXED' = 'KG'
        if (hasWeight && hasDona) supplyType = 'MIXED'
        else if (hasDona && !hasWeight) supplyType = 'DONA'

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
          totalDona,
          totalLitr,
          supplyType,
          deliveriesCount,
          products,
          productsDetails,
          lastDeliveryDate,
          status: s.isActive ? 'Faol' : 'Nofaol'
        }
      })
      .sort((a, b) => (b.totalKg - a.totalKg) || (b.totalDona - a.totalDona))

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
