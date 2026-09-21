import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;
    const batchIdentifier = batchId;
    
    // Yoki ID yoki batchNumber bo'lishi mumkin. Qidiramiz:
    const isNumeric = !isNaN(Number(batchIdentifier));
    
    const batch = await prisma.inventoryBatch.findFirst({
      where: isNumeric 
        ? { OR: [{ id: Number(batchIdentifier) }, { batchNumber: batchIdentifier }] }
        : { batchNumber: batchIdentifier },
      include: {
        product: true,
        warehouse: true,
        zone: true,
        shipments: true,
        defects: true,
      }
    });

    if (!batch) {
      return NextResponse.json({ error: 'Partiya topilmadi' }, { status: 404 });
    }

    // Bu partiya tayyor mahsulot (FG) yoki oraliq (P/F) bo'lishi mumkin. 
    // Agar u ishlab chiqarishdan chiqqan bo'lsa, uning ProductionOrder'i bor:
    const productionOrder = await prisma.productionOrder.findFirst({
      where: { outputBatchId: batch.id },
      include: {
        recipe: true,
        batchInputs: {
          include: {
            inputBatch: {
              include: {
                product: true,
                warehouse: true,
                zone: true
              }
            }
          }
        },
        reagentUsages: true,
        processTemps: true,
      }
    });

    // Agar u xomashyo bo'lsa, qaysi ProductionOrder'larga ketganini ham bilish foydali
    const usedInProduction = await prisma.productionBatchInput.findMany({
      where: { inputBatchId: batch.id },
      include: {
        productionOrder: {
          include: {
            recipe: {
              include: { outputProduct: true }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      batch: {
        id: batch.id,
        batchNumber: batch.batchNumber,
        productName: batch.product.name,
        quantity: batch.quantity,
        receivedAt: batch.receivedAt,
        expirationDate: batch.expirationDate,
        qcStatus: batch.qcStatus,
        supplierBatchNumber: batch.supplierBatchNumber,
        certificateNumber: batch.certificateNumber,
        arrivalTemperature: batch.arrivalTemperature,
        zone: batch.zone?.name || '-',
        warehouse: batch.warehouse?.name || '-',
        supplierId: batch.supplierId,
        inspectionId: batch.inspectionId
      },
      productionInfo: productionOrder ? {
        orderId: productionOrder.id,
        orderNumber: productionOrder.orderNumber,
        startedAt: productionOrder.startedAt,
        endedAt: productionOrder.endedAt,
        workerPin: productionOrder.workerPinCode,
        yieldPercent: productionOrder.yieldPercent,
        rawMaterials: productionOrder.batchInputs.map(input => ({
          inputBatchId: input.inputBatch.id,
          batchNumber: input.inputBatch.batchNumber,
          productName: input.inputBatch.product.name,
          quantityUsed: input.quantityUsed,
          unit: input.unit,
          supplierBatchNumber: input.inputBatch.supplierBatchNumber,
          certificateNumber: input.inputBatch.certificateNumber,
          zone: input.inputBatch.zone?.name,
        })),
        reagents: productionOrder.reagentUsages.map(reagent => ({
          name: reagent.reagentName,
          batchCode: reagent.reagentBatchCode,
          quantity: reagent.quantityUsed,
          unit: reagent.unit,
          appliedBy: reagent.appliedByName,
          processStep: reagent.processStep,
          time: reagent.appliedAt
        })),
        temperatures: productionOrder.processTemps.map(temp => ({
          step: temp.processStep,
          tempC: temp.temperatureC,
          measuredBy: temp.measuredByName,
          time: temp.measuredAt,
          isWithinNorm: temp.isWithinNorm
        }))
      } : null,
      usedIn: usedInProduction.map(usage => ({
        orderId: usage.productionOrder.id,
        orderNumber: usage.productionOrder.orderNumber,
        outputProductName: usage.productionOrder.recipe.outputProduct.name,
        quantityUsed: usage.quantityUsed,
        unit: usage.unit,
        usedAt: usage.usedAt
      })),
      shipments: batch.shipments,
      defects: batch.defects
    });

  } catch (error: any) {
    console.error('Traceability API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
