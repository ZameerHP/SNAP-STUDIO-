import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifySquarePayment } from '@/lib/square'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const invoiceId = searchParams.get('invoiceId')
    const paymentId = searchParams.get('paymentId')

    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId parameter' }, { status: 400 })
    }

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // If a Square payment ID was provided, verify directly with Square
    if (paymentId) {
      const verifyRes = await verifySquarePayment(paymentId)
      if (verifyRes.verified && verifyRes.amount) {
        // Update payment status in database
        await db.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: verifyRes.amount,
            provider: 'square',
            providerTxId: paymentId,
            status: 'COMPLETED',
          },
        })

        // Update invoice
        const newPaid = (invoice.amountPaid || 0) + verifyRes.amount
        const newStatus = newPaid >= (invoice.total || invoice.amount || 0) ? 'paid' : 'partially_paid'
        await db.invoice.update({
          where: { id: invoice.id },
          data: {
            amountPaid: newPaid,
            status: newStatus,
            squarePaymentId: paymentId,
          },
        })
      }
    }

    // Return fresh invoice state from database
    const updatedInvoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true },
    })

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    })
  } catch (err: any) {
    console.error('[Verify Payment API Error]', err)
    return NextResponse.json({ error: err?.message || 'Verification error' }, { status: 500 })
  }
}
