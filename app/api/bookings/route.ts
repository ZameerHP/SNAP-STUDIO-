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

    const bookings = await db.booking.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, email: true, phone: true } },
        invoices: true,
        contracts: true,
        galleries: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, bookings })
  } catch (error: any) {
    console.error('Failed to fetch bookings:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, clientName, clientEmail, clientPhone, serviceName, packageName, eventDate, location, notes } = body

    if (!clientName || !clientEmail || !serviceName) {
      return NextResponse.json({ success: false, error: 'Missing required booking parameters' }, { status: 400 })
    }

    const booking = await db.booking.create({
      data: {
        userId: userId || null,
        clientName,
        clientEmail,
        clientPhone: clientPhone || null,
        serviceName,
        packageName: packageName || null,
        eventDate: eventDate || null,
        location: location || null,
        notes: notes || null,
        status: 'CONFIRMED',
      },
    })

    return NextResponse.json({ success: true, booking }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create booking:', error)
    return NextResponse.json({ success: false, error: 'Failed to create booking' }, { status: 500 })
  }
}
