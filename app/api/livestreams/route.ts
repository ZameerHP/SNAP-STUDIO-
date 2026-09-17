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

    const livestreams = await db.livestream.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, email: true } },
        booking: { select: { serviceName: true, eventDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, livestreams })
  } catch (error: any) {
    console.error('Failed to fetch livestreams:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch livestreams' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, bookingId, title, streamUrl, status } = body

    if (!userId || !title) {
      return NextResponse.json({ success: false, error: 'Client and Title are required' }, { status: 400 })
    }

    const stream = await db.livestream.create({
      data: {
        userId,
        bookingId: bookingId || null,
        title,
        streamUrl: streamUrl || null,
        status: status || 'OFFLINE',
      },
    })

    return NextResponse.json({ success: true, stream }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create livestream:', error)
    return NextResponse.json({ success: false, error: 'Failed to create livestream' }, { status: 500 })
  }
}
