import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function inferProductDetails(name: string) {
  const s = name.toLowerCase()

  if (
    s.includes('пакет') ||
    s.includes('каробка') ||
    s.includes('короб') ||
    s.includes('karobka') ||
    s.includes('этикетк') ||
    s.includes('стрич') ||
    s.includes('яшик') ||
    s.includes('падон')
  ) {
    return {
      category: 'Qadoqlash & Idishlar',
      unit: 'dona',
      minTemp: 15,
      maxTemp: 25,
      type: 'RAW_MATERIAL',
      gost: "O'zDSt 2024"
    }
  }

  if (
    s.includes('хлор') ||
    s.includes('гипохлорит') ||
    s.includes('кислота') ||
    s.includes('бензоат') ||
    s.includes('сорбат') ||
    s.includes('suma') ||
    s.includes('divosan') ||
    s.includes('alco') ||
    s.includes('solides')
  ) {
    return {
      category: 'Kimyo & Dezinfeksiya',
      unit: s.includes('вода') ? 'litr' : 'kg',
      minTemp: 10,
      maxTemp: 22,
      type: 'RAW_MATERIAL',
      gost: 'SanQvaN 0366-19'
    }
  }

  if (
    s.includes('перчатк') ||
    s.includes('шапка') ||
    s.includes('бахила') ||
    s.includes('маска') ||
    s.includes('халат') ||
    s.includes('бумага') ||
    s.includes('салфетк') ||
    s.includes('полотенц') ||
    s.includes('рукавадник')
  ) {
    return {
      category: "Gigiyena & Xo'jalik",
      unit: 'dona',
      minTemp: 15,
      maxTemp: 25,
      type: 'RAW_MATERIAL',
      gost: 'SanQvaN Standart'
    }
  }

  if (s.includes('томат') || s.includes('помидор')) {
    return {
      category: 'Sabzavot (Pomidor)',
      unit: 'kg',
      minTemp: 8,
      maxTemp: 12,
      type: 'RAW_MATERIAL',
      gost: 'GOST 34298-2017'
    }
  }

  if (s.includes('айсберг') || s.includes('айзберг') || s.includes('салат')) {
    return {
      category: 'Sabzavot (Aysberg)',
      unit: 'kg',
      minTemp: 1.5,
      maxTemp: 4,
      type: 'RAW_MATERIAL',
      gost: 'GOST 32882-2014'
    }
  }

  if (s.includes('лук') || s.includes('пиёз')) {
    return {
      category: 'Sabzavot (Piyoz)',
      unit: 'kg',
      minTemp: 0,
      maxTemp: 3,
      type: 'RAW_MATERIAL',
      gost: 'GOST 34306-2017'
    }
  }

  if (s.includes('капуст') || s.includes('карам')) {
    return {
      category: 'Sabzavot (Karam)',
      unit: 'kg',
      minTemp: 0,
      maxTemp: 2,
      type: 'RAW_MATERIAL',
      gost: 'GOST 34323-2017'
    }
  }

  if (s.includes('морков') || s.includes('сабзи')) {
    return {
      category: 'Sabzavot (Sabzi)',
      unit: 'kg',
      minTemp: 0,
      maxTemp: 2,
      type: 'RAW_MATERIAL',
      gost: 'GOST 32284-2013'
    }
  }

  if (s.includes('лимон') || s.includes('мева')) {
    return {
      category: 'Meva (Limon)',
      unit: 'kg',
      minTemp: 6,
      maxTemp: 10,
      type: 'RAW_MATERIAL',
      gost: 'GOST 4429-82'
    }
  }

  if (s.includes('огурц') || s.includes('бодринг')) {
    return {
      category: 'Sabzavot (Bodring)',
      unit: 'kg',
      minTemp: 10,
      maxTemp: 14,
      type: 'RAW_MATERIAL',
      gost: 'GOST 33952-2016'
    }
  }

  return {
    category: "Xomashyo & Oziq-ovqat",
    unit: s.includes('вода') ? 'litr' : 'kg',
    minTemp: 2,
    maxTemp: 8,
    type: 'RAW_MATERIAL',
    gost: 'Standart TU'
  }
}

export async function GET() {
  try {
    // 1. Fetch real arrivals from Prixod to analyze nomenclatures
    const arrivals = await prisma.shopArrival.findMany({
      select: {
        nomenclature: true,
        quantity: true,
        date: true,
        batch: true
      }
    })

    const prixodMap: Record<
      string,
      {
        canonicalName: string
        totalKg: number
        deliveriesCount: number
        lastArrivalDate: string
      }
    > = {}

    for (const a of arrivals) {
      const raw = (a.nomenclature || '').trim()
      if (!raw || raw === '-' || raw.toLowerCase().includes('object') || raw.length < 2) continue

      const norm = raw.toLowerCase()
      if (!prixodMap[norm]) {
        prixodMap[norm] = {
          canonicalName: raw,
          totalKg: 0,
          deliveriesCount: 0,
          lastArrivalDate: ''
        }
      }

      const stat = prixodMap[norm]
      const qty = Number(a.quantity) || 0
      stat.totalKg += qty
      stat.deliveriesCount += 1
      if (a.date && (!stat.lastArrivalDate || a.date > stat.lastArrivalDate)) {
        stat.lastArrivalDate = a.date
      }
    }

    // 2. Fetch existing products from DB
    const existingProducts = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })

    const existingMap: Record<string, typeof existingProducts[0]> = {}
    for (const p of existingProducts) {
      existingMap[p.name.trim().toLowerCase()] = p
    }

    // 3. Auto-sync missing nomenclatures from Prixod into DB
    const allProducts = [...existingProducts]
    for (const [norm, stat] of Object.entries(prixodMap)) {
      if (!existingMap[norm]) {
        const info = inferProductDetails(stat.canonicalName)
        const cleanSlug = stat.canonicalName
          .replace(/[^a-zA-Z0-9а-яА-ЯёЁ]/g, '')
          .slice(0, 4)
          .toUpperCase()
        const code = `PRD-${cleanSlug || 'MAT'}-${Math.floor(100 + Math.random() * 900)}`

        try {
          const created = await prisma.product.create({
            data: {
              name: stat.canonicalName,
              code,
              category: info.category,
              unit: info.unit,
              minTemperature: info.minTemp,
              maxTemperature: info.maxTemp,
              gost: info.gost,
              type: info.type,
              isActive: true,
            }
          })
          allProducts.push(created)
          existingMap[norm] = created
        } catch (err) {
          console.error('Failed to auto-seed product from prixod:', stat.canonicalName, err)
        }
      }
    }

    // 4. Enrich products with Prixod statistics
    const enriched = allProducts
      .filter((p) => p.isActive)
      .map((p) => {
        const norm = p.name.trim().toLowerCase()
        const stat = prixodMap[norm]
        const totalKg = stat ? Math.round(stat.totalKg * 10) / 10 : 0
        const totalTonnes = Math.round((totalKg / 1000) * 100) / 100
        const deliveriesCount = stat ? stat.deliveriesCount : 0
        const lastArrivalDate = stat?.lastArrivalDate || '-'

        return {
          id: p.id,
          name: p.name,
          code: p.code,
          category: p.category,
          unit: p.unit,
          imageUrl: p.imageUrl,
          minTemperature: p.minTemperature,
          maxTemperature: p.maxTemperature,
          defaultPackaging: p.defaultPackaging,
          defaultConclusion: p.defaultConclusion,
          gost: p.gost,
          type: p.type || 'RAW_MATERIAL',
          isActive: p.isActive,
          totalArrivalKg: totalKg,
          totalArrivalTonnes: totalTonnes,
          deliveriesCount,
          lastArrivalDate,
        }
      })
      .sort((a, b) => b.totalArrivalKg - a.totalArrivalKg)

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Mahsulot nomi kiritilishi shart" }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name: body.name.trim(),
        code: body.code ? body.code.trim() : null,
        category: body.category ? body.category.trim() : null,
        unit: body.unit || 'kg',
        imageUrl: body.imageUrl || null,
        defaultTemperature: body.defaultTemperature || null,
        minTemperature: body.minTemperature ? parseFloat(body.minTemperature) : null,
        maxTemperature: body.maxTemperature ? parseFloat(body.maxTemperature) : null,
        defaultPackaging: body.defaultPackaging || null,
        defaultConclusion: body.defaultConclusion || 'Muvofiq',
        storageCondition: body.storageCondition || null,
        shelfLife: body.shelfLife || null,
        gost: body.gost || null,
        description: body.description || null,
        type: body.type || 'RAW_MATERIAL',
        isActive: true,
      },
    })

    // If initial stock is entered from the product modal, create warehouse batch
    if (body.initialStock && parseFloat(body.initialStock) > 0) {
      const warehouse = await prisma.warehouse.findFirst()
      const warehouseId = warehouse?.id || 1
      const numStock = parseFloat(body.initialStock)

      let batchNum = body.initialBatchNumber?.trim()
      if (!batchNum) {
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const rand = Math.floor(1000 + Math.random() * 9000)
        batchNum = `B-${datePart}-${rand}`
      }

      await prisma.inventoryBatch.create({
        data: {
          productId: product.id,
          batchNumber: batchNum,
          warehouseId,
          quantity: numStock,
          qcStatus: 'APPROVED',
          arrivalPhotoUrl: body.imageUrl || null,
          expirationDate: body.initialExpirationDate ? new Date(body.initialExpirationDate) : null,
          transactions: {
            create: {
              transactionType: 'IN',
              quantity: numStock,
              referenceDocId: "Mahsulot yaratishda boshlang'ich qoldiq"
            }
          }
        }
      })
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
