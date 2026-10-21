import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim() || ''
    const category = searchParams.get('category')?.trim() || '' // 'all', 'DEZ', 'MOYUSHIE'
    const substance = searchParams.get('substance')?.trim() || ''
    const dateFrom = searchParams.get('dateFrom')?.trim() || ''
    const dateTo = searchParams.get('dateTo')?.trim() || ''
    const sort = searchParams.get('sort')?.trim() || 'asc'

    const where: any = {}

    if (search) {
      where.OR = [
        { substanceName: { contains: search, mode: 'insensitive' } },
        { supplierName: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { accompanyingDoc: { contains: search, mode: 'insensitive' } },
        { inspectorName: { contains: search, mode: 'insensitive' } },
        { productType: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (substance && substance !== 'all') {
      where.substanceName = { equals: substance, mode: 'insensitive' }
    }

    if (dateFrom && dateTo) {
      where.arrivalDate = { gte: dateFrom, lte: dateTo }
    } else if (dateFrom) {
      where.arrivalDate = { gte: dateFrom }
    } else if (dateTo) {
      where.arrivalDate = { lte: dateTo }
    }

    const acts = await prisma.disinfectionIncomingAct.findMany({
      where,
      orderBy: sort === 'desc' 
        ? [{ arrivalDate: 'desc' }, { id: 'desc' }] 
        : [{ arrivalDate: 'asc' }, { id: 'asc' }]
    })

    // Compute stats
    const allActs = await prisma.disinfectionIncomingAct.findMany()
    let totalReceivedKg = 0
    let totalReleasedKg = 0
    let totalBatches = allActs.length
    const substancesSet = new Set<string>()
    const suppliersSet = new Set<string>()

    allActs.forEach(a => {
      if (a.quantityReceived) totalReceivedKg += a.quantityReceived
      if (a.releasedKg) totalReleasedKg += a.releasedKg
      if (a.substanceName) substancesSet.add(a.substanceName)
      if (a.supplierName) suppliersSet.add(a.supplierName)
    })

    return NextResponse.json({
      success: true,
      acts,
      stats: {
        totalActs: allActs.length,
        filteredCount: acts.length,
        totalReceivedKg,
        totalReleasedKg,
        totalBatches,
        substances: Array.from(substancesSet),
        suppliers: Array.from(suppliersSet)
      }
    })
  } catch (error: any) {
    console.error('Error fetching disinfection acts:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      orderNumber,
      arrivalDate,
      substanceName,
      productType,
      supplierName,
      batchNumber,
      accompanyingDoc,
      activeChlorinePercent,
      quantityReceived,
      unit = 'кг',
      manufactureDate,
      expiryDate,
      transportCondition = 'удовлетворительно',
      accessPermit = 'допущено',
      releasedKg,
      releasedDate,
      inspectorName,
      pricePerKg,
      registrationCert,
      conformityDeclaration,
      category = 'DEZ',
      notes
    } = body

    if (!substanceName?.trim()) {
      return NextResponse.json({ error: 'Vosita nomi kiritilishi shart' }, { status: 400 })
    }

    // Auto calculate orderNumber if not provided
    let calculatedOrderNumber = parseInt(orderNumber, 10)
    if (isNaN(calculatedOrderNumber) || calculatedOrderNumber <= 0) {
      const count = await prisma.disinfectionIncomingAct.count()
      calculatedOrderNumber = count + 1
    }

    const newAct = await prisma.disinfectionIncomingAct.create({
      data: {
        orderNumber: calculatedOrderNumber,
        arrivalDate: arrivalDate || new Date().toISOString().slice(0, 10),
        substanceName: substanceName.trim(),
        productType: productType?.trim() || null,
        supplierName: supplierName?.trim() || null,
        batchNumber: batchNumber ? String(batchNumber).trim() : null,
        accompanyingDoc: accompanyingDoc?.trim() || null,
        activeChlorinePercent: activeChlorinePercent !== null && activeChlorinePercent !== undefined && activeChlorinePercent !== '' 
          ? parseFloat(activeChlorinePercent) 
          : null,
        quantityReceived: quantityReceived !== null && quantityReceived !== undefined && quantityReceived !== '' 
          ? parseFloat(quantityReceived) 
          : null,
        unit: unit || 'кг',
        manufactureDate: manufactureDate || null,
        expiryDate: expiryDate || null,
        transportCondition: transportCondition || 'удовлетворительно',
        accessPermit: accessPermit || 'допущено',
        releasedKg: releasedKg !== null && releasedKg !== undefined && releasedKg !== '' 
          ? parseFloat(releasedKg) 
          : null,
        releasedDate: releasedDate || null,
        inspectorName: inspectorName?.trim() || session.name || 'Камбарова А.М.',
        pricePerKg: pricePerKg !== null && pricePerKg !== undefined && pricePerKg !== '' 
          ? parseFloat(pricePerKg) 
          : null,
        registrationCert: registrationCert?.trim() || null,
        conformityDeclaration: conformityDeclaration?.trim() || null,
        category: category || 'DEZ',
        notes: notes?.trim() || null
      }
    })

    return NextResponse.json({ success: true, act: newAct }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating disinfection act:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
