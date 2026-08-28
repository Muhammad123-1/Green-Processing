import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await request.json()
    const { bankAccountId, type, amount, category, description } = data

    if (!bankAccountId || !type || !amount) {
      return NextResponse.json({ error: "Barcha majburiy maydonlarni to'ldiring" }, { status: 400 })
    }

    const parsedAmount = parseFloat(amount)
    if (parsedAmount <= 0) {
      return NextResponse.json({ error: "Summa 0 dan katta bo'lishi kerak" }, { status: 400 })
    }

    // Begin Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Record the transaction
      const newTx = await tx.transaction.create({
        data: {
          bankAccountId: parseInt(bankAccountId),
          type, // INCOME, EXPENSE
          amount: parsedAmount,
          category: category || 'GENERAL',
          description,
          userId: session.id
        }
      })

      // 2. Update Bank Account Balance
      const balanceChange = type === 'INCOME' ? parsedAmount : -parsedAmount
      
      const account = await tx.bankAccount.update({
        where: { id: parseInt(bankAccountId) },
        data: {
          balance: { increment: balanceChange }
        }
      })

      return { newTx, account }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error creating transaction:', error)
    return NextResponse.json({ error: 'Tranzaksiya saqlashda xatolik' }, { status: 500 })
  }
}
