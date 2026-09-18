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

    const notes = await db.retouchingNote.findMany({
      where: {
        galleryId,
        ...(user.role !== 'ADMIN' && clientRecord ? { clientId: clientRecord.id } : {}),
      },
    })

    const noteMap: Record<string, string> = {}
    for (const n of notes) {
      noteMap[n.photoId] = n.note
    }

    return NextResponse.json({
      success: true,
      notes: noteMap,
    })
  } catch (err: any) {
    console.error('[Retouching Notes GET Error]', err)
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
    const { photoId, note } = body

    if (!photoId) {
      return NextResponse.json({ error: 'photoId required' }, { status: 400 })
    }

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

    if (!note || note.trim() === '') {
      // Remove note
      await db.retouchingNote.deleteMany({
        where: {
          photoId,
          clientId: client.id,
        },
      })
      return NextResponse.json({ success: true, saved: false })
    }

    // Upsert note
    const saved = await db.retouchingNote.upsert({
      where: {
        photoId_clientId: {
          photoId,
          clientId: client.id,
        },
      },
      update: {
        note: note.trim(),
        updatedAt: new Date(),
      },
      create: {
        photoId,
        galleryId,
        clientId: client.id,
        note: note.trim(),
      },
    })

    return NextResponse.json({
      success: true,
      saved: true,
      note: saved.note,
    })
  } catch (err: any) {
    console.error('[Retouching Notes POST Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
