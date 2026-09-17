import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { streamUrl, status, title } = body

    const updated = await db.livestream.update({
      where: { id },
      data: {
        ...(streamUrl !== undefined && { streamUrl }),
        ...(status && { status }),
        ...(title && { title }),
      },
    })

    return NextResponse.json({ success: true, livestream: updated })
  } catch (error: any) {
    console.error('Failed to update livestream:', error)
    return NextResponse.json({ success: false, error: 'Failed to update livestream' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    await db.livestream.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete livestream:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete livestream' }, { status: 500 })
  }
}
