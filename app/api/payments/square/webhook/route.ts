import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifySquareWebhook } from '@/lib/square'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-square-hmacsha256-signature') || ''
    const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || ''
    const notificationUrl = req.nextUrl.href

    // If a signature key is configured, verify HMAC signature
    if (signatureKey && !verifySquareWebhook(rawBody, signature, signatureKey, notificationUrl)) {
      console.warn('[Square Webhook] Invalid signature detected')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    console.log('[Square Webhook Event]', event.type)

    if (event.type === 'payment.updated') {
      const paymentObj = event.data?.object?.payment
      if (paymentObj && paymentObj.status === 'COMPLETED') {
        const orderId = paymentObj.order_id
        const amountCents = paymentObj.amount_money?.amount || 0
        const amountDollars = amountCents / 100

        // Find associated payment or invoice
        let paymentRecord = await db.payment.findFirst({
          where: {
            OR: [
              { providerTxId: orderId },
              { providerTxId: paymentObj.id },
            ],
          },
          include: { invoice: true },
        })

        if (paymentRecord) {
          // Mark payment completed
          await db.payment.update({
            where: { id: paymentRecord.id },
            data: { status: 'COMPLETED' },
          })

          // Update invoice paid amounts
          const invoice = paymentRecord.invoice
          const newAmountPaid = invoice.amountPaid + paymentRecord.amount
          const isFullyPaid = newAmountPaid >= invoice.total

          await db.invoice.update({
            where: { id: invoice.id },
            data: {
              amountPaid: newAmountPaid,
              status: isFullyPaid ? 'PAID' : 'PARTIAL',
            },
          })
          console.log(`[Square Webhook] Invoice ${invoice.invoiceNumber} updated to ${isFullyPaid ? 'PAID' : 'PARTIAL'}`)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[Square Webhook Error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
