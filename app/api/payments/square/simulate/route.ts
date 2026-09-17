import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { invoiceId, method = 'Square Pay' } = body

    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })
    }

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const remainingBalance = Math.max(0, invoice.total - invoice.amountPaid)
    const simulatedTxId = `sq_sim_${Date.now()}`

    // Update or create payment
    await db.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: remainingBalance,
        provider: 'square',
        providerTxId: simulatedTxId,
        status: 'COMPLETED',
      },
    })

    // Mark invoice as paid
    await db.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid: invoice.total,
        status: 'PAID',
      },
    })

    return NextResponse.json({
      success: true,
      transactionId: simulatedTxId,
      amount: remainingBalance,
      invoiceNumber: invoice.invoiceNumber,
      method,
    })
  } catch (err: any) {
    console.error('[Square Simulation Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
