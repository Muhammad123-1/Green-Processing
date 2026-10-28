import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/app/actions/auth'
import { prisma } from '@/lib/prisma'

function dateRange(from: string, to: string) {
  if (!from && !to) return undefined
  return { ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}) }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !['DIRECTOR', 'ADMIN'].includes(session.role)) return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 })
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('dateFrom') || ''
    const to = searchParams.get('dateTo') || ''
    const period = dateRange(from, to)

    const [orders, batches, transfers, processLogs, defectLogs, tickets, auditLogs] = await Promise.all([
      prisma.productionOrder.findMany({
        where: period ? { createdAt: period } : {}, orderBy: { createdAt: 'desc' }, take: 100,
        include: { recipe: { include: { outputProduct: { select: { name: true, unit: true } } } }, batchInputs: { include: { inputBatch: { select: { batchNumber: true, product: { select: { name: true } } } } } } },
      }),
      prisma.inventoryBatch.findMany({
        where: { quantity: { gt: 0 } }, orderBy: { receivedAt: 'desc' }, take: 500,
        include: { product: { select: { name: true, unit: true, minStockLevel: true } }, warehouse: { select: { name: true } }, zone: { select: { name: true } }, supplier: { select: { name: true } } },
      }),
      prisma.stockTransfer.findMany({
        where: period ? { issuedAt: period } : {}, orderBy: { issuedAt: 'desc' }, take: 100,
        include: { product: { select: { name: true } }, batch: { select: { batchNumber: true } } },
      }),
      prisma.processQCLog.findMany({ where: period ? { dateTime: period } : {}, orderBy: { dateTime: 'desc' }, take: 100, include: { inspector: { select: { name: true } } } }),
      prisma.defectLog.findMany({ where: period ? { createdAt: period } : {}, orderBy: { createdAt: 'desc' }, take: 100, include: { product: { select: { name: true } }, supplier: { select: { name: true } } } }),
      prisma.maintenanceTicket.findMany({ where: { status: { not: 'RESOLVED' } }, orderBy: { createdAt: 'desc' }, take: 50, include: { reportedBy: { select: { name: true } }, assignedTo: { select: { name: true } } } }),
      prisma.auditLog.findMany({ where: period ? { createdAt: period } : {}, orderBy: { createdAt: 'desc' }, take: 100, include: { user: { select: { name: true, username: true, role: true } } } }),
    ])

    const productionByProduct = new Map<string, { name: string; unit: string; orders: number; planned: number; actual: number; incomplete: number }>()
    for (const order of orders) {
      const product = order.recipe.outputProduct
      const item = productionByProduct.get(product.name) || { name: product.name, unit: product.unit, orders: 0, planned: 0, actual: 0, incomplete: 0 }
      item.orders++; item.planned += order.plannedOutput; item.actual += order.actualOutput ?? 0
      if (order.actualOutput === null || order.status !== 'COMPLETED') item.incomplete++
      productionByProduct.set(product.name, item)
    }
    const plannedOutput = orders.reduce((sum, item) => sum + item.plannedOutput, 0)
    const actualOutput = orders.reduce((sum, item) => sum + (item.actualOutput ?? 0), 0)

    const stockByProduct = new Map<string, { name: string; unit: string; quantity: number; batches: number; threshold: number | null; quarantine: number; rejected: number }>()
    for (const batch of batches) {
      const item = stockByProduct.get(batch.product.name) || { name: batch.product.name, unit: batch.product.unit, quantity: 0, batches: 0, threshold: batch.product.minStockLevel, quarantine: 0, rejected: 0 }
      item.quantity += batch.quantity; item.batches++
      if (batch.qcStatus === 'QUARANTINE') item.quarantine++
      if (batch.qcStatus === 'REJECTED') item.rejected++
      stockByProduct.set(batch.product.name, item)
    }
    const stockRows = [...stockByProduct.values()].map((item) => ({ ...item, status: item.threshold === null ? 'NO_THRESHOLD' : item.quantity <= item.threshold ? 'LOW' : 'OK' })).sort((a, b) => a.status === b.status ? a.quantity - b.quantity : a.status === 'LOW' ? -1 : 1)

    const alerts = [
      ...transfers.filter((item) => item.status === 'DISCREPANCY' || (item.discrepancy ?? 0) > 0).map((item) => ({ id: `transfer-${item.id}`, kind: 'TRANSFER', severity: 'WARNING', title: `${item.product.name}: transfer farqi`, detail: `${item.transferNumber} · ${item.discrepancy ?? 0} ${item.issuedUnit} · ${item.sourceLocation} → ${item.targetLocation}`, occurredAt: item.issuedAt, source: item })),
      ...batches.filter((item) => ['QUARANTINE', 'REJECTED'].includes(item.qcStatus)).map((item) => ({ id: `batch-${item.id}`, kind: 'INVENTORY', severity: item.qcStatus === 'REJECTED' ? 'CRITICAL' : 'WARNING', title: `${item.product.name}: ${item.qcStatus}`, detail: `Partiya ${item.batchNumber} · ${item.quantity} ${item.product.unit} · ${item.warehouse?.name || 'Ombor ko‘rsatilmagan'}`, occurredAt: item.updatedAt, source: item })),
      ...processLogs.filter((item) => ['ATTENTION', 'REJECTED'].includes(item.status)).map((item) => ({ id: `qc-${item.id}`, kind: 'QC', severity: item.status === 'REJECTED' ? 'CRITICAL' : 'WARNING', title: `QC: ${item.status}`, detail: `${item.date} ${item.time} · ${item.responsible || item.inspector?.name || 'Javobgar ko‘rsatilmagan'}`, occurredAt: item.dateTime, source: item })),
      ...defectLogs.map((item) => ({ id: `defect-${item.id}`, kind: 'DEFECT', severity: 'WARNING', title: `${item.product.name}: ${item.defectType}`, detail: `${item.defectNumber} · ${item.quantity} ${item.unit} · ${item.status}`, occurredAt: item.createdAt, source: item })),
      ...tickets.map((item) => ({ id: `ticket-${item.id}`, kind: 'MAINTENANCE', severity: item.status === 'OPEN' ? 'WARNING' : 'INFO', title: item.title, detail: `${item.status} · Mas’ul: ${item.assignedTo?.name || 'Belgilanmagan'}`, occurredAt: item.createdAt, source: item })),
    ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()).slice(0, 100)

    return NextResponse.json({
      success: true,
      production: { totals: { orders: orders.length, plannedOutput, actualOutput, yieldPercent: plannedOutput > 0 ? Number(((actualOutput / plannedOutput) * 100).toFixed(2)) : null }, products: [...productionByProduct.values()].sort((a, b) => b.actual - a.actual), orders },
      warehouse: { totals: { batches: batches.length, products: stockRows.length, lowStock: stockRows.filter((item) => item.status === 'LOW').length, quarantinedBatches: batches.filter((item) => item.qcStatus === 'QUARANTINE').length }, products: stockRows, batches, transfers },
      alerts,
      audit: auditLogs.map((item) => ({ id: item.id, tableName: item.tableName, operation: item.operation, createdAt: item.createdAt, actor: item.user?.name || null, username: item.user?.username || null, role: item.user?.role || null, oldValues: item.oldValues, newValues: item.newValues })),
    })
  } catch (error: any) {
    console.error('Executive operations overview error:', error)
    return NextResponse.json({ error: error?.message || 'Server xatoligi' }, { status: 500 })
  }
}
