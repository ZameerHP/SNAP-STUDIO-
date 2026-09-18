import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/session-user'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: galleryId } = await params
    const clientRecord = await db.client.findFirst({
      where: { email: user.email },
    })

    const favorites = await db.photoFavorite.findMany({
      where: {
        galleryId,
        ...(user.role !== 'ADMIN' && clientRecord ? { clientId: clientRecord.id } : {}),
      },
      select: { photoId: true, clientId: true },
    })

    return NextResponse.json({
      success: true,
      favorites: favorites.map((f: any) => f.photoId),
    })
  } catch (err: any) {
    console.error('[Favorites GET Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: galleryId } = await params
    const body = await req.json()
    const { photoId } = body

    if (!photoId) {
      return NextResponse.json({ error: 'photoId required' }, { status: 400 })
    }

    // Get client id
    let client = await db.client.findFirst({
      where: { email: user.email },
    })
    if (!client) {
      client = await db.client.create({
        data: {
          name: user.name || 'Studio Client',
          email: user.email,
        },
      })
    }

    // Check if already favorited
    const existing = await db.photoFavorite.findUnique({
      where: {
        photoId_clientId: {
          photoId,
          clientId: client.id,
        },
      },
    })

    if (existing) {
      // Toggle off
      await db.photoFavorite.delete({
        where: { id: existing.id },
      })
      return NextResponse.json({ success: true, favorited: false })
    } else {
      // Toggle on
      await db.photoFavorite.create({
        data: {
          photoId,
          galleryId,
          clientId: client.id,
        },
      })
      return NextResponse.json({ success: true, favorited: true })
    }
  } catch (err: any) {
    console.error('[Favorites POST Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
