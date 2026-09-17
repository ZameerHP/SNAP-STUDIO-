import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const items = await db.portfolioItem.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ success: true, items })
  } catch (error: any) {
    console.error('Failed to fetch portfolio items:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch portfolio' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { title, type, category, client, year, image, camera, lens, lighting, brief, deliverables, stats, sortOrder } = body

    if (!title || !image) {
      return NextResponse.json({ success: false, error: 'Title and Image URL are required' }, { status: 400 })
    }

    const item = await db.portfolioItem.create({
      data: {
        title,
        type: type || 'Commercial',
        category: category || 'Photography',
        client: client || null,
        year: year || '2026',
        image,
        camera: camera || null,
        lens: lens || null,
        lighting: lighting || null,
        brief: brief || null,
        deliverables: deliverables ? JSON.stringify(deliverables) : null,
        stats: stats || null,
        sortOrder: sortOrder || 0,
        isPublished: true,
      },
    })

    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create portfolio item:', error)
    return NextResponse.json({ success: false, error: 'Failed to create portfolio item' }, { status: 500 })
  }
}
