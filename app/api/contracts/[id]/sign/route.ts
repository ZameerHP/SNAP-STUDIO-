import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { fullName } = body

    if (!fullName || fullName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Full legal name is required to sign agreement' },
        { status: 400 }
      )
    }

    // Verify contract belongs to client
    const contract = await db.contract.findUnique({
      where: { id },
    })

    if (!contract || contract.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Contract not found or access denied' },
        { status: 404 }
      )
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1'
    const userAgent = req.headers.get('user-agent') || 'Browser Client'

    // Create signature record & update contract status
    const [signature, updatedContract] = await db.$transaction([
      db.signature.create({
        data: {
          contractId: id,
          userId: session.user.id,
          fullName: fullName.trim(),
          ipAddress,
          userAgent,
        },
      }),
      db.contract.update({
        where: { id },
        data: {
          status: 'SIGNED',
          signedAt: new Date(),
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Agreement digitally executed and recorded with timestamp audit trail.',
      signatureId: signature.id,
      signedAt: signature.signedAt,
    })
  } catch (error: any) {
    console.error('Failed to sign contract:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process signature' },
      { status: 500 }
    )
  }
}
