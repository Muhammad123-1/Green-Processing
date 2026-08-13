import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const recipes = await prisma.recipe.findMany({
      include: {
        outputProduct: true,
        ingredients: {
          include: {
            inputProduct: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(recipes)
  } catch (error) {
    console.error('Error fetching recipes:', error)
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { outputProductId, baseYieldQty, ingredients } = body

    if (!outputProductId || !baseYieldQty || !ingredients || ingredients.length === 0) {
      return NextResponse.json({ error: 'Barcha maydonlarni to\'ldiring' }, { status: 400 })
    }

    const recipe = await prisma.recipe.create({
      data: {
        outputProductId: parseInt(outputProductId),
        baseYieldQty: parseFloat(baseYieldQty),
        technologistId: session.userId,
        isApproved: true,
        ingredients: {
          create: ingredients.map((ing: any) => ({
            inputProductId: parseInt(ing.inputProductId),
            requiredQty: parseFloat(ing.requiredQty),
          }))
        }
      },
      include: {
        outputProduct: true,
        ingredients: {
          include: {
            inputProduct: true
          }
        }
      }
    })

    // Log action
    await prisma.log.create({
      data: {
        action: 'CREATE_RECIPE',
        entity: 'Recipe',
        entityId: recipe.id,
        details: `Yangi retsept yaratildi: ${recipe.outputProduct.name}`,
      },
    })

    return NextResponse.json(recipe, { status: 201 })
  } catch (error) {
    console.error('Error creating recipe:', error)
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 })
  }
}
