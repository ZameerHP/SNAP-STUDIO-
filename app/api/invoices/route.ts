import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = session.user.role === 'ADMIN'
    const whereClause = isAdmin ? {} : { userId: session.user.id }

    const invoices = await db.invoice.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, email: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, invoices })
  } catch (error: any) {
    console.error('Failed to fetch invoices:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, bookingId, title, lineItems, total, depositRequired, notes } = body

    if (!userId || !title || total === undefined) {
      return NextResponse.json({ success: false, error: 'User, Title, and Total are required' }, { status: 400 })
    }

    const count = await db.invoice.count()
    const invoiceNumber = `INV-2026-${String(count + 1).padStart(3, '0')}`

    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        userId,
        bookingId: bookingId || null,
        title,
        lineItems: typeof lineItems === 'string' ? lineItems : JSON.stringify(lineItems || []),
        total: parseFloat(total),
        depositRequired: depositRequired ? parseFloat(depositRequired) : 0,
        status: 'SENT',
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, invoice }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create invoice:', error)
    return NextResponse.json({ success: false, error: 'Failed to create invoice' }, { status: 500 })
  }
}
