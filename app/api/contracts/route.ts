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

    const contracts = await db.contract.findMany({
      where: whereClause,
      include: {
        signatures: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, contracts })
  } catch (error: any) {
    console.error('Failed to fetch contracts:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch contracts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, bookingId, title, content } = body

    if (!userId || !title || !content) {
      return NextResponse.json({ success: false, error: 'Missing required contract fields' }, { status: 400 })
    }

    const contract = await db.contract.create({
      data: {
        userId,
        bookingId: bookingId || null,
        title,
        content,
        status: 'SENT',
      },
    })

    return NextResponse.json({ success: true, contract }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create contract:', error)
    return NextResponse.json({ success: false, error: 'Failed to create contract' }, { status: 500 })
  }
}
