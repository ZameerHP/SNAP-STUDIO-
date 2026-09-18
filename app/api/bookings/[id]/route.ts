import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/session-user'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req)
    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { status, notes, eventDate, location } = body

    const updated = await db.booking.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(eventDate && { eventDate }),
        ...(location && { location }),
      },
    })

    return NextResponse.json({ success: true, booking: updated })
  } catch (error: any) {
    console.error('Failed to update booking:', error)
    return NextResponse.json({ success: false, error: 'Failed to update booking' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req)
    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    await db.booking.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete booking:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete booking' }, { status: 500 })
  }
}
