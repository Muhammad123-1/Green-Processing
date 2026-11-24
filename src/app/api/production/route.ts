import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { getTodayTashkent } from '@/lib/auditRules'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      recipeId,
      plannedOutput,
      actualOutput,
      lineName = '1-Sex / Asosiy Liniya',
      supervisorName = session.name || 'Sex Nazoratchisi',
      notes,
      workerPinCode, // NEW
      reagentUsages = [], // NEW
      processTemps = [] // NEW
    } = body

    if (!recipeId || !plannedOutput || parseFloat(plannedOutput) <= 0) {
      return NextResponse.json({ error: 'Noto\'g\'ri ma\'lumotlar' }, { status: 400 })
    }

    const outputQty = parseFloat(plannedOutput)
    const actOutputQty = actualOutput ? parseFloat(actualOutput) : outputQty

    // 1. Fetch recipe with ingredients
    const recipe = await prisma.recipe.findUnique({
      where: { id: parseInt(recipeId) },
      include: {
        outputProduct: true,
        ingredients: {
          include: { inputProduct: true }
        }
      }
    })

    if (!recipe) return NextResponse.json({ error: 'Retsept topilmadi' }, { status: 404 })

    // 2. Calculate required ingredient quantities based on output ratio
    const ratio = outputQty / recipe.baseYieldQty
    let totalRawKg = 0
    const usedBatchCodes: string[] = []

    // We will do this inside a transaction to ensure atomic deducts
    const result = await prisma.$transaction(async (tx) => {
      
      const batchInputsData: any[] = []

      // Step A: Check and deduct inventory for each ingredient (FEFO)
      for (const ingredient of recipe.ingredients) {
        const requiredQty = ingredient.requiredQty * ratio
        totalRawKg += requiredQty
        let remainingToDeduct = requiredQty

        // Find available approved batches for this ingredient, ordered by expirationDate ASC (FEFO)
        const batches = await tx.inventoryBatch.findMany({
          where: {
            productId: ingredient.inputProductId,
            qcStatus: 'APPROVED',
            quantity: { gt: 0 }
          },
          orderBy: {
            expirationDate: 'asc'
          }
        })

        // Check total available
        const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0)
        if (totalAvailable < requiredQty) {
          throw new Error(`Yetarli xomashyo yo'q: ${ingredient.inputProduct.name}. Talab: ${requiredQty} ${ingredient.inputProduct.unit}, Ombor qoldig'i: ${totalAvailable} ${ingredient.inputProduct.unit}`)
        }

        // Deduct from batches
        for (const batch of batches) {
          if (remainingToDeduct <= 0) break

          const deductAmt = Math.min(batch.quantity, remainingToDeduct)
          usedBatchCodes.push(`#${batch.batchNumber}`)

          // Update batch
          await tx.inventoryBatch.update({
            where: { id: batch.id },
            data: {
              quantity: { decrement: deductAmt }
            }
          })

          // Record transaction
          await tx.inventoryTransaction.create({
            data: {
              batchId: batch.id,
              transactionType: 'OUT',
              quantity: deductAmt,
              userId: session.id,
              referenceDocId: `RECIPE-${recipe.id}`
            }
          })

          // Record Traceability Input
          batchInputsData.push({
            inputBatchId: batch.id,
            quantityUsed: deductAmt,
            unit: ingredient.inputProduct.unit,
            usedByName: session.name,
            usedById: session.id
          })

          remainingToDeduct -= deductAmt
        }
      }

      // Step B: Calculate Yield Rate (%)
      const yieldPercent = totalRawKg > 0 ? (actOutputQty / totalRawKg) * 100 : 100
      const orderCount = await tx.productionOrder.count()
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`
      const finishedBatchCode = `FG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(orderCount + 1).padStart(3, '0')}`
      const rawBatchCode = Array.from(new Set(usedBatchCodes)).join(', ')

      // Step C: Create finished product batch into inventory (FINISHED GOODS)
      const outputBatch = await tx.inventoryBatch.create({
        data: {
          productId: recipe.outputProductId,
          batchNumber: finishedBatchCode,
          quantity: actOutputQty,
          qcStatus: 'APPROVED'
        }
      })

      // Step D: Create Production Order record with full traceability relations
      const order = await tx.productionOrder.create({
        data: {
          orderNumber,
          recipeId: recipe.id,
          plannedOutput: outputQty,
          actualOutput: actOutputQty,
          yieldPercent: parseFloat(yieldPercent.toFixed(1)),
          rawBatchCode,
          finishedBatchCode,
          outputBatchId: outputBatch.id, // NEW: Link to batch
          lineName,
          supervisorName,
          workerPinCode, // NEW
          status: 'COMPLETED',
          notes: notes || null,
          startedAt: new Date(),
          endedAt: new Date(),
          
          // NEW: Create all traceability relations in one go
          batchInputs: {
            create: batchInputsData
          },
          reagentUsages: {
            create: reagentUsages.map((ru: any) => ({
              reagentName: ru.reagentName,
              reagentBatchCode: ru.reagentBatchCode,
              quantityUsed: ru.quantityUsed,
              unit: ru.unit || 'g',
              appliedByName: ru.appliedByName || session.name,
              processStep: ru.processStep,
              temperatureAtUse: ru.temperatureAtUse
            }))
          },
          processTemps: {
            create: processTemps.map((pt: any) => ({
              batchId: pt.batchId,
              processStep: pt.processStep,
              temperatureC: pt.temperatureC,
              measuredByName: pt.measuredByName || session.name,
              measuredById: session.id,
              isWithinNorm: pt.isWithinNorm ?? true,
              photoUrl: pt.photoUrl
            }))
          }
        }
      })

      return order
    })

    // Log action
    await prisma.log.create({
      data: {
        userId: session.id,
        action: 'EXECUTE_PRODUCTION',
        entity: 'ProductionOrder',
        entityId: result.id,
        details: `Ishlab chiqarish yakunlandi: ${recipe.outputProduct?.name}, Chiqish: ${actOutputQty} ${recipe.outputProduct?.unit}, Partiya: ${result.finishedBatchCode}`,
      },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error executing production:', error)
    return NextResponse.json({ error: error.message || 'Ishlab chiqarishda xatolik' }, { status: 400 })
  }
}

function getProductCategory(allNames: string): 'tomato' | 'iceberg' | 'coleslaw' | 'onion' | 'other' {
  const p = (allNames || '').toLowerCase()
  if (p.includes('томат') || p.includes('помидор') || p.includes('tomat') || p.includes('pomidor')) return 'tomato'
  if (p.includes('айсберг') || p.includes('айзберг') || p.includes('aysberg') || p.includes('iceberg')) return 'iceberg'
  if (p.includes('коул') || p.includes('капуст') || p.includes('coleslaw') || p.includes('karam') || p.includes('koul') || p.includes('slou')) return 'coleslaw'
  if (p.includes('лук') || p.includes('пиёз') || p.includes('onion') || p.includes('piyoz')) return 'onion'
  return 'other'
}

function getCleanUzbekProductName(rawName: string): string {
  const s = (rawName || '').toLowerCase()
  if (s.includes('томаты целые') || s.includes('butun pomidor')) return 'Butun pomidor'
  if (s.includes('томат') || s.includes('помидор') || s.includes('tomat') || s.includes('pomidor')) return 'Pomidor (Tomat)'
  if (s.includes('салат айсберг нарезанный') || s.includes('kesilgan aysberg')) return 'Kesilgan Aysberg salati'
  if (s.includes('айсберг (листовой)') || s.includes('bargli aysberg')) return 'Bargli Aysberg'
  if (s.includes('айсберг') || s.includes('айзберг') || s.includes('aysberg') || s.includes('iceberg')) return 'Salat Aysberg'
  if (s.includes('коул') || s.includes('koul') || s.includes('coleslaw')) return 'Koul Slou salati'
  if (s.includes('лук салатный белый нарезанный') || s.includes('kesilgan oq piyoz')) return 'Kesilgan oq salat piyozi'
  if (s.includes('лук салатный белый') || s.includes('oq salat piyozi')) return 'Oq salat piyozi'
  if (s.includes('лук') || s.includes('пиёз') || s.includes('onion') || s.includes('piyoz')) return 'Tozalangan piyoz'
  if (s.includes('капуст') || s.includes('karam')) return 'Karam'
  if (s.includes('морков') || s.includes('sabzi')) return 'Sabzi'
  if (s.includes('огурц') || s.includes('bodring')) return 'Bodring'
  if (s.includes('мята') || s.includes('yalpiz') || s.includes('myata')) return 'Yalpiz (Myata)'
  if (s.includes('лимон') || s.includes('limon')) return 'Limon'
  if (s.includes('сельдерей') || s.includes('selderey')) return 'Selderey'
  if (s.includes('микс') || s.includes('mix') || s.includes('miks')) return 'Miks salat'
  if (s.includes('шпинат') || s.includes('shpinat')) return 'Shpinat'
  if (s.includes('руккол') || s.includes('rukkola')) return 'Rukkola'
  return rawName
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const format = request.nextUrl.searchParams.get('format')
    const today = getTodayTashkent()

    const [dbOrders, expenses, arrivals] = await Promise.all([
      prisma.productionOrder.findMany({
        include: {
          recipe: {
            include: {
              outputProduct: true,
              ingredients: {
                include: { inputProduct: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.shopExpense.findMany({
        orderBy: { date: 'desc' }
      }),
      prisma.shopArrival.findMany({
        where: { batch: { not: null } },
        select: { date: true, nomenclature: true, batch: true, quantity: true, supplier: true },
        orderBy: { date: 'asc' }
      })
    ])

    function findRawBatch(rawName: string, date: string) {
      const norm = rawName.toLowerCase()
      const matches = arrivals.filter((a) => {
        if (a.date > date) return false
        const n = a.nomenclature.toLowerCase()
        if (norm.includes('айсберг') && n.includes('айсберг')) return true
        if (norm.includes('томат') && (n.includes('томат') || n.includes('помидор'))) return true
        if (norm.includes('капуст') && n.includes('капуст')) return true
        if (norm.includes('морков') && n.includes('морков')) return true
        if (norm.includes('лук') && n.includes('лук')) return true
        if (norm.includes('шпинат') && n.includes('шпинат')) return true
        if (norm.includes('руккол') && n.includes('руккол')) return true
        if (norm.includes('мята') && n.includes('мята')) return true
        if (norm.includes('сельдерей') && n.includes('сельдерей')) return true
        if (norm.includes('огур') && n.includes('огур')) return true
        if (norm.includes('лимон') && n.includes('лимон')) return true
        return false
      })
      if (matches.length === 0) return null
      return matches[matches.length - 1]
    }

    function isPackaging(name: string) {
      const s = name.toLowerCase()
      return (
        s.includes('пакет') ||
        s.includes('коробк') ||
        s.includes('гофр') ||
        s.includes('этикет') ||
        s.includes('ящик') ||
        s.includes('скотч') ||
        s.includes('стретч') ||
        s.includes('перчат') ||
        s.includes('халат') ||
        s.includes('шапка') ||
        s.includes('маска') ||
        s.includes('салфет') ||
        s.includes('бумаг') ||
        s.includes('брак')
      )
    }

    let totalFinishedGoodsKg = 0
    let totalRawConsumedKg = 0
    const byProduct: Record<string, number> = {}

    // Map all ShopExpense daily records (historical and active daily production outputs)
    const mappedExpenseOrders = expenses.map((exp) => {
      const outputs = (exp.outputs || {}) as Record<string, any>
      const materials = (exp.materials || {}) as Record<string, any>

      let totalOutputKg = 0
      const outputItems: { name: string; quantityKg: number; unit: string }[] = []
      const seenCleanOutputs = new Set<string>()

      for (const [pName, val] of Object.entries(outputs)) {
        const kg = typeof val === 'object' && val !== null ? ((val as any).kg ?? (val as any).val ?? 0) : Number(val) || 0
        if (kg <= 0) continue
        if (isPackaging(pName)) continue

        const cleanName = getCleanUzbekProductName(pName)

        totalOutputKg += kg
        outputItems.push({ name: cleanName, quantityKg: Math.round(kg * 10) / 10, unit: 'kg' })
        byProduct[cleanName] = (byProduct[cleanName] || 0) + kg
      }

      let totalRawKg = 0
      const materialItems: { name: string; quantityKg: number; unit: string; isPackaging?: boolean }[] = []
      const rawBatchesList: Array<{
        name: string
        quantityKg: number
        batchNumber: string
        supplier: string
        arrivalDate: string
      }> = []

      for (const [mName, val] of Object.entries(materials)) {
        const num = typeof val === 'object' && val !== null ? ((val as any).kg ?? (val as any).val ?? 0) : Number(val) || 0
        if (num <= 0) continue

        const packaging = isPackaging(mName)
        const cleanMatName = getCleanUzbekProductName(mName)
        const unit = packaging ? 'dona' : 'kg'

        materialItems.push({
          name: cleanMatName,
          quantityKg: Math.round(num * 10) / 10,
          unit,
          isPackaging: packaging
        })

        // Only sum food ingredients into totalRawKg (ignore plastic bags, boxes, packaging)
        if (!packaging) {
          totalRawKg += num

          const matched = findRawBatch(mName, exp.date)
          rawBatchesList.push({
            name: cleanMatName,
            quantityKg: Math.round(num * 10) / 10,
            batchNumber: matched ? ((matched.batch || '').replace(/^#/, '').trim() || '1') : exp.date.replace(/-/g, ''),
            supplier: matched?.supplier || "Ombor",
            arrivalDate: matched?.date || exp.date
          })
        }
      }

      totalFinishedGoodsKg += totalOutputKg
      totalRawConsumedKg += totalRawKg

      const yieldPercent = totalRawKg > 0 ? Math.min(100, Math.round((totalOutputKg / totalRawKg) * 100)) : (totalOutputKg > 0 ? 82 : 0)

      const isToday = exp.date === today
      let status: 'COMPLETED' | 'IN_PROGRESS' | 'PLANNED' = 'COMPLETED'
      if (isToday) {
        status = totalOutputKg > 0 ? 'COMPLETED' : 'IN_PROGRESS'
      } else {
        if (totalOutputKg > 0) {
          status = 'COMPLETED'
        } else if (totalRawKg > 0) {
          status = 'IN_PROGRESS'
        } else {
          status = 'PLANNED'
        }
      }

      const dayCategories = Array.from(new Set(outputItems.map((o) => getProductCategory(o.name))))
      const primaryProduct = outputItems[0]?.name || (materialItems[0]?.name ? `${materialItems[0].name} (Tayyorlash)` : 'Aralash sabzavotlar')
      const displayName = outputItems.length > 1 ? `${primaryProduct} (+${outputItems.length - 1} xil)` : primaryProduct
      const primaryCategory = dayCategories[0] || getProductCategory(primaryProduct)

      let lineName = 'Salat yuvish va qadoqlash liniyasi'
      if (dayCategories.includes('tomato')) {
        lineName = 'Pomidor saralash va qayta ishlash liniyasi'
      } else if (dayCategories.includes('coleslaw')) {
        lineName = 'Koul Slou va karam qirqish liniyasi'
      } else if (dayCategories.includes('onion')) {
        lineName = 'Piyoz tozalash va qadoqlash liniyasi'
      }

      // Build traceability linking: which raw batches went into which finished goods
      const traceability = outputItems.map((out) => {
        const outNorm = out.name.toLowerCase()
        const matchedInputs = rawBatchesList.filter((b) => {
          const bn = b.name.toLowerCase()
          if (outNorm.includes('pomidor') || outNorm.includes('tomat') || outNorm.includes('томат')) {
            return bn.includes('pomidor') || bn.includes('tomat') || bn.includes('томат')
          }
          if (outNorm.includes('aysberg') || outNorm.includes('айсберг')) {
            return bn.includes('aysberg') || bn.includes('айсберг')
          }
          if (outNorm.includes('koul') || outNorm.includes('slou') || outNorm.includes('коул')) {
            return bn.includes('karam') || bn.includes('sabzi') || bn.includes('капуст') || bn.includes('морков')
          }
          if (outNorm.includes('piyoz') || outNorm.includes('лук')) {
            return bn.includes('piyoz') || bn.includes('лук')
          }
          if (outNorm.includes('miks') || outNorm.includes('mix') || outNorm.includes('микс')) {
            return bn.includes('shpinat') || bn.includes('rukkola') || bn.includes('lollo') || bn.includes('шпинат') || bn.includes('руккол')
          }
          if (outNorm.includes('yalpiz') || outNorm.includes('myata') || outNorm.includes('мята')) {
            return bn.includes('yalpiz') || bn.includes('myata') || bn.includes('мята')
          }
          if (outNorm.includes('selderey') || outNorm.includes('сельдерей')) {
            return bn.includes('selderey') || bn.includes('сельдерей')
          }
          if (outNorm.includes('bodring') || outNorm.includes('огур')) {
            return bn.includes('bodring') || bn.includes('огур')
          }
          if (outNorm.includes('limon') || outNorm.includes('лимон')) {
            return bn.includes('limon') || bn.includes('лимон')
          }
          return false
        })

        const totalInputKg = matchedInputs.reduce((sum, i) => sum + i.quantityKg, 0)
        const lineYield = totalInputKg > 0 ? Math.min(100, Math.round((out.quantityKg / totalInputKg) * 100)) : (yieldPercent || 78)

        return {
          outputName: out.name,
          outputKg: out.quantityKg,
          yieldPercent: lineYield,
          inputs: matchedInputs
        }
      })

      // Formatted summary for the table column
      let usedBatchesDisplay = ''
      if (rawBatchesList.length > 0) {
        const relevantBatches = rawBatchesList.filter((b) => {
          const bn = b.name.toLowerCase()
          if (primaryCategory === 'tomato') return bn.includes('pomidor') || bn.includes('tomat')
          if (primaryCategory === 'iceberg') return bn.includes('aysberg')
          if (primaryCategory === 'coleslaw') return bn.includes('karam') || bn.includes('sabzi')
          if (primaryCategory === 'onion') return bn.includes('piyoz')
          return true
        })
        const chosen = relevantBatches.length > 0 ? relevantBatches : rawBatchesList
        usedBatchesDisplay = chosen.slice(0, 2).map((b) => `${b.name} (Partiya #${b.batchNumber})`).join(', ')
        if (chosen.length > 2) {
          usedBatchesDisplay += ` +${chosen.length - 2} ta`
        }
      } else {
        usedBatchesDisplay = `Partiya #${exp.date.replace(/-/g, '')}`
      }

      const orderNumber = exp.date.replace(/-/g, '')
      const finishedBatchCode = exp.date.replace(/-/g, '')
      const rawBatchCode = rawBatchesList[0]?.batchNumber || exp.date.replace(/-/g, '')

      return {
        id: exp.id,
        orderNumber,
        date: exp.date,
        createdAt: new Date(`${exp.date}T18:00:00Z`).toISOString(),
        recipe: {
          outputProduct: {
            name: displayName,
            code: String(exp.id),
            unit: 'kg'
          }
        },
        productName: primaryProduct,
        category: primaryCategory,
        categories: dayCategories,
        allOutputs: outputItems,
        allMaterials: materialItems,
        rawMaterialBatches: rawBatchesList,
        traceability,
        usedBatchesDisplay,
        plannedOutput: Math.round((totalRawKg > 0 ? totalRawKg * 0.78 : totalOutputKg) * 10) / 10,
        actualOutput: Math.round(totalOutputKg * 10) / 10,
        rawConsumedKg: Math.round(totalRawKg * 10) / 10,
        yieldPercent: yieldPercent || 78,
        finishedBatchCode,
        rawBatchCode,
        lineName,
        supervisorName: '',
        status,
        notes: outputItems.length > 0 ? outputItems.map((o) => `${o.name} (${o.quantityKg} kg)`).join(', ') : null
      }
    }).filter((o) => o.actualOutput > 0 || o.rawConsumedKg > 0)

    // Formatted DB production orders (if any)
    const existingOrderNumbers = new Set(mappedExpenseOrders.map((m) => m.orderNumber))
    const formattedDbOrders = dbOrders
      .filter((o) => !o.orderNumber || !existingOrderNumbers.has(o.orderNumber))
      .map((o) => {
        const outKg = o.actualOutput || o.plannedOutput || 0
        totalFinishedGoodsKg += outKg
        const yp = typeof o.yieldPercent === 'number' ? o.yieldPercent : 100
        const pName = getCleanUzbekProductName(o.recipe?.outputProduct?.name || 'Tayyor Mahsulot')
        const category = getProductCategory(pName)
        return {
          id: o.id,
          orderNumber: o.orderNumber ? o.orderNumber.replace(/^(ORD|PRD)-?/i, '') : String(o.id),
          date: new Date(o.createdAt).toISOString().slice(0, 10),
          createdAt: o.createdAt.toISOString(),
          recipe: {
            outputProduct: {
              name: pName,
              code: String(o.id),
              unit: o.recipe?.outputProduct?.unit || 'kg'
            }
          },
          productName: pName,
          category,
          categories: [category],
          allOutputs: [{ name: pName, quantityKg: outKg, unit: 'kg' }],
          allMaterials: [],
          rawMaterialBatches: [],
          traceability: [],
          usedBatchesDisplay: o.rawBatchCode ? `Partiya #${o.rawBatchCode.replace(/^RM-?/i, '')}` : `Partiya #${o.id}`,
          plannedOutput: o.plannedOutput,
          actualOutput: outKg,
          rawConsumedKg: yp > 0 ? Math.round((outKg / (yp / 100)) * 10) / 10 : outKg,
          yieldPercent: yp,
          finishedBatchCode: o.finishedBatchCode ? o.finishedBatchCode.replace(/^(FG|BATCH)-?/i, '') : String(o.id),
          rawBatchCode: o.rawBatchCode ? o.rawBatchCode.replace(/^RM-?/i, '') : '',
          lineName: o.lineName || 'Asosiy ishlab chiqarish liniyasi',
          supervisorName: '',
          status: o.status as 'COMPLETED' | 'IN_PROGRESS' | 'PLANNED',
          notes: o.notes
        }
      })

    const combinedOrders = [...formattedDbOrders, ...mappedExpenseOrders].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    const completedBatchesCount = combinedOrders.filter((o) => o.status === 'COMPLETED').length
    const inProgressBatchesCount = combinedOrders.filter((o) => o.status === 'IN_PROGRESS').length

    const summary = {
      totalFinishedGoodsKg: Math.round(totalFinishedGoodsKg * 10) / 10,
      totalFinishedGoodsTonnes: Math.round((totalFinishedGoodsKg / 1000) * 10) / 10,
      totalRawConsumedKg: Math.round(totalRawConsumedKg * 10) / 10,
      totalRawConsumedTonnes: Math.round((totalRawConsumedKg / 1000) * 10) / 10,
      averageYieldPercent: totalRawConsumedKg > 0 ? Math.round((totalFinishedGoodsKg / totalRawConsumedKg) * 100) : 78,
      totalProductionDays: combinedOrders.length,
      completedBatchesCount,
      inProgressBatchesCount
    }

    // Categories breakdown computed by summing each finished good output individually
    const catTotals: Record<string, number> = {
      all: totalFinishedGoodsKg,
      tomato: 0,
      iceberg: 0,
      coleslaw: 0,
      onion: 0,
      other: 0
    }

    for (const o of combinedOrders) {
      if (Array.isArray(o.allOutputs)) {
        for (const out of o.allOutputs) {
          const kg = Number(out.quantityKg) || 0
          const cat = getProductCategory(out.name)
          if (cat in catTotals) {
            catTotals[cat] += kg
          } else {
            catTotals.other += kg
          }
        }
      }
    }

    const categoriesStats = [
      { id: 'all', nameUz: 'Barchasi', totalKg: Math.round(totalFinishedGoodsKg * 10) / 10, totalTonnes: Math.round((totalFinishedGoodsKg / 1000) * 10) / 10, percent: 100 },
      { id: 'tomato', nameUz: 'Pomidor (Tomat)', totalKg: Math.round(catTotals.tomato * 10) / 10, totalTonnes: Math.round((catTotals.tomato / 1000) * 10) / 10, percent: totalFinishedGoodsKg > 0 ? Math.round((catTotals.tomato / totalFinishedGoodsKg) * 100) : 0 },
      { id: 'iceberg', nameUz: 'Aysberg', totalKg: Math.round(catTotals.iceberg * 10) / 10, totalTonnes: Math.round((catTotals.iceberg / 1000) * 10) / 10, percent: totalFinishedGoodsKg > 0 ? Math.round((catTotals.iceberg / totalFinishedGoodsKg) * 100) : 0 },
      { id: 'coleslaw', nameUz: 'Koul Slou', totalKg: Math.round(catTotals.coleslaw * 10) / 10, totalTonnes: Math.round((catTotals.coleslaw / 1000) * 10) / 10, percent: totalFinishedGoodsKg > 0 ? Math.round((catTotals.coleslaw / totalFinishedGoodsKg) * 100) : 0 },
      { id: 'onion', nameUz: 'Piyoz', totalKg: Math.round(catTotals.onion * 10) / 10, totalTonnes: Math.round((catTotals.onion / 1000) * 10) / 10, percent: totalFinishedGoodsKg > 0 ? Math.round((catTotals.onion / totalFinishedGoodsKg) * 100) : 0 },
      { id: 'other', nameUz: 'Boshqa mahsulotlar', totalKg: Math.round(catTotals.other * 10) / 10, totalTonnes: Math.round((catTotals.other / 1000) * 10) / 10, percent: totalFinishedGoodsKg > 0 ? Math.round((catTotals.other / totalFinishedGoodsKg) * 100) : 0 }
    ]

    // Sort byProduct portfolio descending
    const sortedPortfolio = Object.entries(byProduct)
      .map(([name, kg]) => ({
        name,
        totalKg: Math.round(kg * 10) / 10,
        totalTonnes: Math.round((kg / 1000) * 10) / 10,
        percent: totalFinishedGoodsKg > 0 ? Math.round((kg / totalFinishedGoodsKg) * 100) : 0
      }))
      .sort((a, b) => b.totalKg - a.totalKg)

    if (format === 'detailed') {
      return NextResponse.json({
        orders: combinedOrders,
        summary,
        categories: categoriesStats,
        byProduct: sortedPortfolio,
        productsList: sortedPortfolio
      })
    }

    return NextResponse.json(combinedOrders)
  } catch (error) {
    console.error('Error fetching production orders:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
