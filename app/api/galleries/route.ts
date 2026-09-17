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

    const galleries = await db.gallery.findMany({
      where: whereClause,
      include: {
        media: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, galleries })
  } catch (error: any) {
    console.error('Failed to fetch galleries:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch galleries' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, bookingId, title, description, accessCode, isPublic } = body

    if (!userId || !title) {
      return NextResponse.json({ success: false, error: 'User and Title are required' }, { status: 400 })
    }

    const gallery = await db.gallery.create({
      data: {
        userId,
        bookingId: bookingId || null,
        title,
        description: description || null,
        accessCode: accessCode || null,
        isPublic: !!isPublic,
      },
    })

    return NextResponse.json({ success: true, gallery }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create gallery:', error)
    return NextResponse.json({ success: false, error: 'Failed to create gallery' }, { status: 500 })
  }
}
