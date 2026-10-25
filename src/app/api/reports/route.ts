import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function detectRejectionCategory(conclusion: string = '', notes: string = ''): string {
  const text = (conclusion + ' ' + notes).toLowerCase()
  if (
    text.includes('harorat') ||
    text.includes('erigan') ||
    text.includes('sovutgich') ||
    text.includes('muzlatish') ||
    text.includes('температур')
  ) {
    return 'Harorat rejimi buzilishi'
  }
  if (
    text.includes("mog'or") ||
    text.includes('chiri') ||
    text.includes('chirigan') ||
    text.includes('плесен') ||
    text.includes('гнил')
  ) {
    return "Mog'orlash va chirish"
  }
  if (
    text.includes('hashorat') ||
    text.includes('qurt') ||
    text.includes('zararkunanda') ||
    text.includes('parazit') ||
    text.includes('вредител')
  ) {
    return 'Zararkunandalar shikasti'
  }
  if (
    text.includes('kalibr') ||
    text.includes("o'lcham") ||
    text.includes('mayda') ||
    text.includes('diametr') ||
    text.includes('калибр')
  ) {
    return 'Standart kalibr nomuvofiqligi'
  }
  if (
    text.includes('sertifikat') ||
    text.includes('hujjat') ||
    text.includes('karantin') ||
    text.includes('документ')
  ) {
    return "Hujjatlar / Sertifikat yo'qligi"
  }
  return 'Boshqa sifat kamchiliklari'
}

function parseActDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null
  const clean = dateStr.trim().replace(/,/g, '.').replace(/\//g, '.')
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    return new Date(clean)
  }
  const parts = clean.split('.')
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    const year = parseInt(parts[2], 10)
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month - 1, day)
    }
  }
  return null
}

function parseActStatus(act: any): 'ACCEPTED' | 'REJECTED' | 'CONDITIONAL' {
  const dec = (act.decisionText || '').toLowerCase()
  if (
    act.rejectionActNumber ||
    (act.decisionRating && act.decisionRating <= 2) ||
    dec.includes('rad') ||
    dec.includes('брак') ||
    dec.includes('yomon')
  ) {
    return 'REJECTED'
  }
  if (
    act.decisionRating === 3 ||
    dec.includes('shartli') ||
    dec.includes('qoniqarli')
  ) {
    return 'CONDITIONAL'
  }
  return 'ACCEPTED'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'monthly'
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10)

    // Load all real incoming raw material acts
    const rawActs = await prisma.incomingRawMaterialAct.findMany({
      orderBy: { actDate: 'desc' },
    })

    // Map each act to unified structure
    const allParsedActs = rawActs
      .map((a) => {
        const d = parseActDate(a.actDate)
        if (!d || isNaN(d.getTime())) return null
        const status = parseActStatus(a)
        const qty = a.warehouseKg || 0
        const temp =
          typeof a.temperature === 'string'
            ? parseFloat(a.temperature.replace(/[^0-9.-]/g, '')) || null
            : null

        return {
          id: a.id,
          actNumber: a.actNumber || `AKT-${a.id}`,
          date: d,
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          productName: a.productName || 'Noma\'lum xomashyo',
          supplierName: a.supplierName || 'Noma\'lum ta\'minotchi',
          quantity: qty,
          quantityUnit: 'kg',
          temperature: temp,
          temperatureUnit: '°C',
          status,
          rating: a.decisionRating || (status === 'ACCEPTED' ? 5 : 1),
          conclusion:
            a.decisionText ||
            (status === 'ACCEPTED'
              ? 'MUVOFIQ: Sifat talablariga to\'liq javob beradi. Qabul qilindi.'
              : 'RAD ETILDI: Sifat standartiga nomuvofiq.'),
          notes: a.notes || '',
          inspector: a.inspectorName?.trim() || 'Sifat Nazorati (QC)',
          category: detectRejectionCategory(a.decisionText || '', a.notes || ''),
          images: [] as { id: number; url: string; type?: string | null }[],
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    // MONTHLY STATS
    if (type === 'monthly') {
      const monthActs = allParsedActs.filter(
        (a) => a.year === year && a.month === month
      )

      const total = monthActs.length
      const accepted = monthActs.filter((i) => i.status === 'ACCEPTED').length
      const rejected = monthActs.filter((i) => i.status === 'REJECTED').length
      const conditional = monthActs.filter((i) => i.status === 'CONDITIONAL').length
      const totalQuantity = monthActs.reduce((sum, i) => sum + (i.quantity || 0), 0)

      // By Product
      const productMap: Record<
        string,
        {
          productId: number
          name: string
          count: number
          totalQuantity: number
          accepted: number
          rejected: number
        }
      > = {}
      let pIdx = 1
      monthActs.forEach((ins) => {
        const pname = ins.productName
        if (!productMap[pname]) {
          productMap[pname] = {
            productId: pIdx++,
            name: pname,
            count: 0,
            totalQuantity: 0,
            accepted: 0,
            rejected: 0,
          }
        }
        productMap[pname].count++
        productMap[pname].totalQuantity += ins.quantity || 0
        if (ins.status === 'ACCEPTED') productMap[pname].accepted++
        if (ins.status === 'REJECTED') productMap[pname].rejected++
      })
      const byProduct = Object.values(productMap).sort((a, b) => b.count - a.count)

      // By Supplier
      const supplierMap: Record<
        string,
        {
          supplierId: number
          name: string
          count: number
          totalQuantity: number
          accepted: number
          rejected: number
        }
      > = {}
      let sIdx = 1
      monthActs.forEach((ins) => {
        const sname = ins.supplierName
        if (!supplierMap[sname]) {
          supplierMap[sname] = {
            supplierId: sIdx++,
            name: sname,
            count: 0,
            totalQuantity: 0,
            accepted: 0,
            rejected: 0,
          }
        }
        supplierMap[sname].count++
        supplierMap[sname].totalQuantity += ins.quantity || 0
        if (ins.status === 'ACCEPTED') supplierMap[sname].accepted++
        if (ins.status === 'REJECTED') supplierMap[sname].rejected++
      })
      const bySupplier = Object.values(supplierMap).sort((a, b) => b.count - a.count)

      // By Inspector
      const inspectorMap: Record<
        string,
        {
          name: string
          total: number
          accepted: number
          rejected: number
          conditional: number
          totalQuantity: number
        }
      > = {}
      monthActs.forEach((ins) => {
        const inspName = ins.inspector
        if (!inspectorMap[inspName]) {
          inspectorMap[inspName] = {
            name: inspName,
            total: 0,
            accepted: 0,
            rejected: 0,
            conditional: 0,
            totalQuantity: 0,
          }
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

      // Rejected & Conditional Inspections
      const rejectedInspections = monthActs
        .filter((ins) => ins.status === 'REJECTED' || ins.status === 'CONDITIONAL')
        .map((ins) => ({
          id: ins.id,
          actNumber: ins.actNumber,
          inspectionDate: ins.date.toISOString(),
          supplierName: ins.supplierName,
          productName: ins.productName,
          batchNumber: ins.actNumber,
          quantity: ins.quantity,
          quantityUnit: ins.quantityUnit,
          temperature: ins.temperature,
          temperatureUnit: ins.temperatureUnit,
          conclusion: ins.conclusion,
          notes: ins.notes,
          inspector: ins.inspector,
          status: ins.status,
          rating: ins.rating,
          category: ins.category,
          images: ins.images,
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
      const yearActs = allParsedActs.filter((a) => a.year === year)

      const MONTHS_SHORT = [
        'Yan',
        'Fev',
        'Mar',
        'Apr',
        'May',
        'Iyun',
        'Iyul',
        'Avg',
        'Sen',
        'Okt',
        'Noy',
        'Dek',
      ]

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

      yearActs.forEach((ins) => {
        const m = ins.month - 1
        if (m >= 0 && m < 12) {
          monthlyData[m].total++
          monthlyData[m].quantity += ins.quantity || 0
          if (ins.status === 'ACCEPTED') monthlyData[m].accepted++
          else if (ins.status === 'REJECTED') monthlyData[m].rejected++
          else if (ins.status === 'CONDITIONAL') monthlyData[m].conditional++
        }
      })

      monthlyData.forEach((m) => {
        m.acceptRate = m.total > 0 ? Math.round((m.accepted / m.total) * 100) : 0
      })

      const totalYear = yearActs.length
      const acceptedYear = yearActs.filter((i) => i.status === 'ACCEPTED').length
      const rejectedYear = yearActs.filter((i) => i.status === 'REJECTED').length
      const conditionalYear = yearActs.filter((i) => i.status === 'CONDITIONAL').length
      const totalQuantityYear = yearActs.reduce((s, i) => s + (i.quantity || 0), 0)

      // By Inspector across year
      const inspectorMap: Record<
        string,
        {
          name: string
          total: number
          accepted: number
          rejected: number
          conditional: number
        }
      > = {}
      yearActs.forEach((ins) => {
        const name = ins.inspector
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
      const rejectedInspections = yearActs
        .filter((ins) => ins.status === 'REJECTED' || ins.status === 'CONDITIONAL')
        .map((ins) => ({
          id: ins.id,
          actNumber: ins.actNumber,
          inspectionDate: ins.date.toISOString(),
          supplierName: ins.supplierName,
          productName: ins.productName,
          batchNumber: ins.actNumber,
          quantity: ins.quantity,
          quantityUnit: ins.quantityUnit,
          temperature: ins.temperature,
          temperatureUnit: ins.temperatureUnit,
          conclusion: ins.conclusion,
          notes: ins.notes,
          inspector: ins.inspector,
          status: ins.status,
          rating: ins.rating,
          category: ins.category,
          images: ins.images,
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
