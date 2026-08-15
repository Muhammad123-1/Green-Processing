import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Fetch all active suppliers with inspections and defect logs
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      include: {
        inspections: {
          select: {
            id: true,
            quantity: true,
            status: true,
            conclusion: true,
            inspectionDate: true
          }
        },
        orders: {
          select: {
            id: true,
            deliveredQuantity: true,
            acceptedQuantity: true,
            rejectedQuantity: true,
            status: true
          }
        },
        defects: {
          select: {
            id: true,
            quantity: true,
            defectType: true,
            reason: true,
            createdAt: true
          }
        }
      }
    })

    const scores = suppliers.map((sup: any) => {
      let totalDeliveries = sup.inspections.length
      let totalDeliveredKg = 0
      let totalAcceptedKg = 0
      let totalRejectedKg = 0

      sup.inspections.forEach((ins: any) => {
        const qty = ins.quantity || 0
        totalDeliveredKg += qty
        if (ins.status === 'ACCEPTED') {
          totalAcceptedKg += qty
        } else if (ins.status === 'REJECTED') {
          totalRejectedKg += qty
        } else if (ins.status === 'CONDITIONAL') {
          // 85% accepted, 15% loss
          totalAcceptedKg += qty * 0.85
          totalRejectedKg += qty * 0.15
        }
      })

      // Add defect logs kg
      const defectKg = sup.defects?.reduce((sum: number, d: any) => sum + (d.quantity || 0), 0) || 0
      totalRejectedKg += defectKg

      const qualityScore = totalDeliveredKg > 0 
        ? Math.max(0, Math.min(100, (totalAcceptedKg / (totalDeliveredKg + defectKg)) * 100))
        : 100

      let grade = 'EXCELLENT' // EXCELLENT (>=95), GOOD (85-94), WARNING (<85)
      if (qualityScore < 85) grade = 'WARNING'
      else if (qualityScore < 95) grade = 'GOOD'

      return {
        supplierId: sup.id,
        name: sup.name,
        shortName: sup.shortName,
        phone: sup.phone,
        category: sup.category,
        totalDeliveries,
        totalDeliveredKg: Math.round(totalDeliveredKg),
        totalAcceptedKg: Math.round(totalAcceptedKg),
        totalRejectedKg: Math.round(totalRejectedKg),
        defectCount: sup.defects?.length || 0,
        qualityScore: parseFloat(qualityScore.toFixed(1)),
        grade
      }
    })

    // Sort by qualityScore ascending or descending
    scores.sort((a, b) => b.totalDeliveredKg - a.totalDeliveredKg)

    return NextResponse.json({
      data: scores,
      summary: {
        totalSuppliers: suppliers.length,
        trustedCount: scores.filter(s => s.grade === 'EXCELLENT').length,
        warningCount: scores.filter(s => s.grade === 'WARNING').length,
        avgScore: scores.length > 0 ? parseFloat((scores.reduce((acc, s) => acc + s.qualityScore, 0) / scores.length).toFixed(1)) : 100
      }
    })
  } catch (error) {
    console.error('Error computing supplier quality scores:', error)
    return NextResponse.json({ error: 'Yetkazib beruvchilar sifat reytingini hisoblashda xatolik' }, { status: 500 })
  }
}
