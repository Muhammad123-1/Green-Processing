import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { getRatingText } from '@/lib/incoming-acts/excel'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim() || ''
    const product = searchParams.get('product')?.trim() || ''
    const ratingStr = searchParams.get('rating')?.trim() || ''
    const dateFrom = searchParams.get('dateFrom')?.trim() || ''
    const dateTo = searchParams.get('dateTo')?.trim() || ''

    const where: any = {}

    if (search) {
      where.OR = [
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { supplierName: { contains: search, mode: 'insensitive' } },
        { inspectorName: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } },
        { actNumber: { contains: search, mode: 'insensitive' } },
        { rejectionActNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (product && product !== 'all') {
      where.productName = { equals: product, mode: 'insensitive' }
    }

    if (ratingStr && ratingStr !== 'all') {
      const rating = parseInt(ratingStr, 10)
      if (!isNaN(rating)) {
        where.decisionRating = rating
      }
    }

    if (dateFrom && dateTo) {
      where.actDate = { gte: dateFrom, lte: dateTo }
    } else if (dateFrom) {
      where.actDate = { gte: dateFrom }
    } else if (dateTo) {
      where.actDate = { lte: dateTo }
    }

    const acts = await prisma.incomingRawMaterialAct.findMany({
      where,
      orderBy: [{ actDate: 'desc' }, { id: 'desc' }]
    })

    // Compute stats
    let totalKg = 0
    let countRating5 = 0
    let countRating4 = 0
    let countRating3 = 0
    let countRating2 = 0
    const productsSet = new Set<string>()

    const allActs = await prisma.incomingRawMaterialAct.findMany({
      select: { productName: true, decisionRating: true, warehouseKg: true }
    })

    allActs.forEach(a => {
      if (a.productName) productsSet.add(a.productName)
      if (a.warehouseKg) totalKg += a.warehouseKg
      if (a.decisionRating === 5) countRating5++
      else if (a.decisionRating === 4) countRating4++
      else if (a.decisionRating === 3) countRating3++
      else if (a.decisionRating === 2) countRating2++
    })

    return NextResponse.json({
      success: true,
      acts,
      stats: {
        totalActs: allActs.length,
        filteredCount: acts.length,
        totalKg,
        rating5: countRating5,
        rating4: countRating4,
        rating3: countRating3,
        rating2: countRating2,
        products: Array.from(productsSet)
      }
    })
  } catch (error: any) {
    console.error('Error fetching incoming acts:', error)
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
      actNumber,
      actDate,
      productName,
      supplierName,
      temperature,
      transportCondition,
      hasDocumentation,
      structure,
      leafColor,
      tasteSmell,
      internalOxidation,
      insectTraces,
      rotDiseases,
      stemCut,
      density,
      diameterWeight,
      outerLeavesRemoved,
      noMechanicalDamage,
      batchNumber,
      decisionRating,
      decisionText,
      warehouseKg,
      shopIssuedKg,
      shopIssuedDate,
      rejectionActNumber,
      inspectorName,
      pricePerKg,
      notes
    } = body

    if (!actDate || !productName || !supplierName) {
      return NextResponse.json(
        { error: 'Sana, mahsulot va ta\'minotchi maydonlari majburiy!' },
        { status: 400 }
      )
    }

    const rating = Number(decisionRating) || 4
    const resolvedDecisionText = decisionText || getRatingText(rating, 'uz')

    const newAct = await prisma.incomingRawMaterialAct.create({
      data: {
        actNumber: String(actNumber || Date.now().toString().slice(-4)),
        actDate: String(actDate),
        productName: String(productName).trim(),
        supplierName: String(supplierName).trim(),
        temperature: temperature ? String(temperature) : null,
        transportCondition: transportCondition !== undefined ? Number(transportCondition) : 1,
        hasDocumentation: hasDocumentation !== undefined ? Number(hasDocumentation) : 1,
        structure: structure !== undefined ? Number(structure) : 1,
        leafColor: leafColor !== undefined ? Number(leafColor) : 1,
        tasteSmell: tasteSmell !== undefined ? Number(tasteSmell) : 1,
        internalOxidation: internalOxidation !== undefined ? Number(internalOxidation) : 0,
        insectTraces: insectTraces !== undefined ? Number(insectTraces) : 0,
        rotDiseases: rotDiseases !== undefined ? Number(rotDiseases) : 0,
        stemCut: stemCut !== undefined ? Number(stemCut) : 1,
        density: density !== undefined ? Number(density) : 1,
        diameterWeight: diameterWeight ? String(diameterWeight) : null,
        outerLeavesRemoved: outerLeavesRemoved !== undefined ? Number(outerLeavesRemoved) : 1,
        noMechanicalDamage: noMechanicalDamage !== undefined ? Number(noMechanicalDamage) : 1,
        batchNumber: batchNumber ? String(batchNumber).trim() : null,
        decisionRating: rating,
        decisionText: resolvedDecisionText,
        warehouseKg: warehouseKg !== null && warehouseKg !== undefined && warehouseKg !== '' ? Number(warehouseKg) : null,
        shopIssuedKg: shopIssuedKg ? String(shopIssuedKg) : null,
        shopIssuedDate: shopIssuedDate ? String(shopIssuedDate) : null,
        rejectionActNumber: rejectionActNumber ? String(rejectionActNumber) : null,
        inspectorName: inspectorName ? String(inspectorName).trim() : (session as any).name || 'Nazoratchi',
        pricePerKg: pricePerKg !== null && pricePerKg !== undefined && pricePerKg !== '' ? Number(pricePerKg) : null,
        notes: notes ? String(notes).trim() : null
      }
    })

    return NextResponse.json({ success: true, act: newAct }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating incoming act:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
