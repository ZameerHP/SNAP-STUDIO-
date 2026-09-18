import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/session-user'
import { db } from '@/lib/db'
import { createSquarePaymentLink } from '@/lib/square'

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    const body = await req.json()
    const { invoiceId } = body

    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })
    }

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { user: true, booking: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Permission check: admin or the invoice owner can initiate payment
    if (user?.role !== 'ADMIN' && user?.id !== invoice.userId) {
      return NextResponse.json({ error: 'Unauthorized to pay this invoice' }, { status: 403 })
    }

    const balanceDue = Math.max(0, invoice.total - invoice.amountPaid)
    if (balanceDue <= 0) {
      return NextResponse.json({ error: 'This invoice is already paid in full' }, { status: 400 })
    }

    // Determine host for redirect URL
    const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const redirectUrl = `${origin}/portal/payments/success?invoiceId=${encodeURIComponent(
      invoice.id
    )}&invoiceNumber=${encodeURIComponent(invoice.invoiceNumber)}`

    const squareResult = await createSquarePaymentLink({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: balanceDue,
      currency: 'CAD',
      title: invoice.title,
      clientEmail: invoice.user?.email,
      redirectUrl: redirectUrl,
    })

    if (!squareResult.success || !squareResult.url) {
      return NextResponse.json(
        { error: squareResult.error || 'Failed to initialize Square payment session.' },
        { status: 503 }
      )
    }

    // Record pending payment in database
    await db.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: balanceDue,
        provider: 'square',
        providerTxId: squareResult.orderId || squareResult.paymentLinkId || null,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: squareResult.url,
      balanceDue,
    })
  } catch (error: any) {
    console.error('[Square Checkout API Error]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initiate Square payment' },
      { status: 500 }
    )
  }
}
