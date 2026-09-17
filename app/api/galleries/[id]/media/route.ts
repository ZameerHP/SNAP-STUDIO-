import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { id: galleryId } = await params
    const body = await req.json()
    const { title, url, thumbnailUrl, type, isDownloadable } = body

    if (!url) {
      return NextResponse.json({ success: false, error: 'Media URL is required' }, { status: 400 })
    }

    const media = await db.mediaItem.create({
      data: {
        galleryId,
        title: title || 'Production Master Deliverable',
        url,
        thumbnailUrl: thumbnailUrl || url,
        type: type || 'PHOTO',
        isDownloadable: isDownloadable !== undefined ? !!isDownloadable : true,
      },
    })

    return NextResponse.json({ success: true, media }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to add media to gallery:', error)
    return NextResponse.json({ success: false, error: 'Failed to add media' }, { status: 500 })
  }
}
