import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function detectRejectionCategory(conclusion: string = '', notes: string = ''): string {
  const text = (conclusion + ' ' + notes).toLowerCase()
  if (text.includes('harorat') || text.includes('erigan') || text.includes('sovutgich') || text.includes('muzlatish')) {
    return "Harorat rejimi buzilishi"
  }
  if (text.includes("mog'or") || text.includes('chiri') || text.includes('chirigan')) {
    return "Mog'orlash va chirish"
  }
  if (text.includes('hashorat') || text.includes('qurt') || text.includes('zararkunanda') || text.includes('parazit')) {
    return "Zararkunandalar shikasti"
  }
  if (text.includes('kalibr') || text.includes("o'lcham") || text.includes('mayda') || text.includes('diametr')) {
    return "Standart kalibr nomuvofiqligi"
  }
  if (text.includes('sertifikat') || text.includes('hujjat') || text.includes('karantin')) {
    return "Hujjatlar / Sertifikat yo'qligi"
  }
  return "Boshqa sifat kamchiliklari"
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'monthly'
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))

    // MONTHLY STATS
    if (type === 'monthly') {
      const startDate = new Date(year, month - 1, 1, 0, 0, 0)
      const endDate = new Date(year, month, 0, 23, 59, 59)

      const inspections = await prisma.inspection.findMany({
        where: { inspectionDate: { gte: startDate, lte: endDate } },
        include: {
          product: { select: { id: true, name: true, category: true } },
          supplier: { select: { id: true, name: true } },
          images: { select: { id: true, url: true, type: true } },
        },
        orderBy: { inspectionDate: 'desc' },
      })

      const total = inspections.length
      const accepted = inspections.filter((i) => i.status === 'ACCEPTED').length
      const rejected = inspections.filter((i) => i.status === 'REJECTED').length
      const conditional = inspections.filter((i) => i.status === 'CONDITIONAL').length
      const totalQuantity = inspections.reduce((sum, i) => sum + (i.quantity || 0), 0)

      // By Product
      const productMap: Record<number, { productId: number; name: string; count: number; totalQuantity: number; accepted: number; rejected: number }> = {}
      inspections.forEach((ins) => {
        const pid = ins.productId
        const pname = ins.product?.name || 'Noma\'lum mahsulot'
        if (!productMap[pid]) {
          productMap[pid] = { productId: pid, name: pname, count: 0, totalQuantity: 0, accepted: 0, rejected: 0 }
        }
        productMap[pid].count++
        productMap[pid].totalQuantity += ins.quantity || 0
        if (ins.status === 'ACCEPTED') productMap[pid].accepted++
        if (ins.status === 'REJECTED') productMap[pid].rejected++
      })
      const byProduct = Object.values(productMap).sort((a, b) => b.count - a.count)

      // By Supplier
      const supplierMap: Record<number, { supplierId: number; name: string; count: number; totalQuantity: number; accepted: number; rejected: number }> = {}
      inspections.forEach((ins) => {
        const sid = ins.supplierId
        const sname = ins.supplier?.name || 'Noma\'lum ta\'minotchi'
        if (!supplierMap[sid]) {
          supplierMap[sid] = { supplierId: sid, name: sname, count: 0, totalQuantity: 0, accepted: 0, rejected: 0 }
        }
        supplierMap[sid].count++
        supplierMap[sid].totalQuantity += ins.quantity || 0
        if (ins.status === 'ACCEPTED') supplierMap[sid].accepted++
        if (ins.status === 'REJECTED') supplierMap[sid].rejected++
      })
      const bySupplier = Object.values(supplierMap).sort((a, b) => b.count - a.count)

      // By Inspector ("kim tomonidan qabul qilinvotti")
      const inspectorMap: Record<string, { name: string; total: number; accepted: number; rejected: number; conditional: number; totalQuantity: number }> = {}
      inspections.forEach((ins) => {
        const inspName = ins.inspector?.trim() || 'Noma\'lum nazoratchi'
        if (!inspectorMap[inspName]) {
          inspectorMap[inspName] = { name: inspName, total: 0, accepted: 0, rejected: 0, conditional: 0, totalQuantity: 0 }
        }
        inspectorMap[inspName].total++
        inspectorMap[inspName].totalQuantity += ins.quantity || 0
        if (ins.status === 'ACCEPTED') inspectorMap[inspName].accepted++
        else if (ins.status === 'REJECTED') inspectorMap[inspName].rejected++
        else if (ins.status === 'CONDITIONAL') inspectorMap[inspName].conditional++
      })
      const byInspector = Object.values(inspectorMap)
        .map((item) => ({
          ...item,
          acceptRate: item.total > 0 ? Math.round((item.accepted / item.total) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total)

      // Rejected & Conditional Inspections ("bular nega rad etildi hamma fikrlar rasmlari bilan")
      const rejectedInspections = inspections
        .filter((ins) => ins.status === 'REJECTED' || ins.status === 'CONDITIONAL')
        .map((ins) => ({
          id: ins.id,
          actNumber: ins.actNumber,
          inspectionDate: ins.inspectionDate,
          supplierName: ins.supplier?.name || '-',
          productName: ins.product?.name || '-',
          batchNumber: ins.batchNumber,
          quantity: ins.quantity,
          quantityUnit: ins.quantityUnit || 'kg',
          temperature: ins.temperature,
          temperatureUnit: ins.temperatureUnit || '°C',
          conclusion: ins.conclusion,
          notes: ins.notes,
          inspector: ins.inspector || 'Sifat nazoratchisi',
          status: ins.status,
          rating: ins.rating,
          category: detectRejectionCategory(ins.conclusion, ins.notes || ''),
          images: ins.images.map((img) => ({ id: img.id, url: img.url, type: img.type })),
        }))

      // Rejection Reasons Breakdown
      const reasonCounts: Record<string, number> = {}
      rejectedInspections
        .filter((r) => r.status === 'REJECTED')
        .forEach((r) => {
          reasonCounts[r.category] = (reasonCounts[r.category] || 0) + 1
        })
      const rejectionReasons = Object.entries(reasonCounts)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)

      return NextResponse.json({
        total,
        accepted,
        rejected,
        conditional,
        totalQuantity,
        acceptRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
        byProduct,
        bySupplier,
        byInspector,
        rejectedInspections,
        rejectionReasons,
      })
    }

    // YEARLY STATS
    if (type === 'yearly') {
      const startDate = new Date(year, 0, 1, 0, 0, 0)
      const endDate = new Date(year, 11, 31, 23, 59, 59)

      const inspections = await prisma.inspection.findMany({
        where: { inspectionDate: { gte: startDate, lte: endDate } },
        include: {
          product: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
          images: { select: { id: true, url: true, type: true } },
        },
        orderBy: { inspectionDate: 'asc' },
      })

      const MONTHS_SHORT = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']

      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        monthName: MONTHS_SHORT[i],
        total: 0,
        accepted: 0,
        rejected: 0,
        conditional: 0,
        quantity: 0,
        acceptRate: 0,
      }))

      inspections.forEach((ins) => {
        const m = new Date(ins.inspectionDate).getMonth()
        monthlyData[m].total++
        monthlyData[m].quantity += ins.quantity || 0
        if (ins.status === 'ACCEPTED') monthlyData[m].accepted++
        else if (ins.status === 'REJECTED') monthlyData[m].rejected++
        else if (ins.status === 'CONDITIONAL') monthlyData[m].conditional++
      })

      monthlyData.forEach((m) => {
        m.acceptRate = m.total > 0 ? Math.round((m.accepted / m.total) * 100) : 0
      })

      const totalYear = inspections.length
      const acceptedYear = inspections.filter((i) => i.status === 'ACCEPTED').length
      const rejectedYear = inspections.filter((i) => i.status === 'REJECTED').length
      const conditionalYear = inspections.filter((i) => i.status === 'CONDITIONAL').length
      const totalQuantityYear = inspections.reduce((s, i) => s + (i.quantity || 0), 0)

      // By Inspector across year
      const inspectorMap: Record<string, { name: string; total: number; accepted: number; rejected: number; conditional: number }> = {}
      inspections.forEach((ins) => {
        const name = ins.inspector?.trim() || 'Noma\'lum nazoratchi'
        if (!inspectorMap[name]) {
          inspectorMap[name] = { name, total: 0, accepted: 0, rejected: 0, conditional: 0 }
        }
        inspectorMap[name].total++
        if (ins.status === 'ACCEPTED') inspectorMap[name].accepted++
        else if (ins.status === 'REJECTED') inspectorMap[name].rejected++
        else if (ins.status === 'CONDITIONAL') inspectorMap[name].conditional++
      })
      const byInspector = Object.values(inspectorMap)
        .map((i) => ({
          ...i,
          acceptRate: i.total > 0 ? Math.round((i.accepted / i.total) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total)

      // Rejected & Conditional Inspections across year
      const rejectedInspections = inspections
        .filter((ins) => ins.status === 'REJECTED' || ins.status === 'CONDITIONAL')
        .map((ins) => ({
          id: ins.id,
          actNumber: ins.actNumber,
          inspectionDate: ins.inspectionDate,
          supplierName: ins.supplier?.name || '-',
          productName: ins.product?.name || '-',
          batchNumber: ins.batchNumber,
          quantity: ins.quantity,
          quantityUnit: ins.quantityUnit || 'kg',
          temperature: ins.temperature,
          temperatureUnit: ins.temperatureUnit || '°C',
          conclusion: ins.conclusion,
          notes: ins.notes,
          inspector: ins.inspector || 'Sifat nazoratchisi',
          status: ins.status,
          rating: ins.rating,
          category: detectRejectionCategory(ins.conclusion, ins.notes || ''),
          images: ins.images.map((img) => ({ id: img.id, url: img.url, type: img.type })),
        }))

      // Rejection categories for year
      const reasonCounts: Record<string, number> = {}
      rejectedInspections
        .filter((r) => r.status === 'REJECTED')
        .forEach((r) => {
          reasonCounts[r.category] = (reasonCounts[r.category] || 0) + 1
        })
      const rejectionReasons = Object.entries(reasonCounts)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)

      return NextResponse.json({
        year,
        yearlySummary: {
          total: totalYear,
          accepted: acceptedYear,
          rejected: rejectedYear,
          conditional: conditionalYear,
          totalQuantity: totalQuantityYear,
          acceptRate: totalYear > 0 ? Math.round((acceptedYear / totalYear) * 100) : 0,
        },
        monthlyData,
        byInspector,
        rejectedInspections,
        rejectionReasons,
      })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  } catch (error) {
    console.error('Reports API error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
