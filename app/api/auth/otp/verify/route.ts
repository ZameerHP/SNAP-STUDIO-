import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailOtp } from '@/lib/otp'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
    }

    const result = await verifyEmailOtp(email, code)

    if (!result.valid) {
      return NextResponse.json({ error: result.error || 'Invalid code' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Email address successfully verified.',
    })
  } catch (err: any) {
    console.error('[Verify OTP API Error]', err)
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 })
  }
}
