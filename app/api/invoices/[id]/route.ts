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
    const { status, amountPaid, depositPaid, notes } = body

    const updated = await db.invoice.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(amountPaid !== undefined && { amountPaid: parseFloat(amountPaid) }),
        ...(depositPaid !== undefined && { depositPaid: parseFloat(depositPaid) }),
        ...(notes !== undefined && { notes }),
      },
    })

    return NextResponse.json({ success: true, invoice: updated })
  } catch (error: any) {
    console.error('Failed to update invoice:', error)
    return NextResponse.json({ success: false, error: 'Failed to update invoice' }, { status: 500 })
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
    await db.invoice.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete invoice:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete invoice' }, { status: 500 })
  }
}
