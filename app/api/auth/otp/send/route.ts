import { NextRequest, NextResponse } from 'next/server'
import { sendEmailOtp } from '@/lib/otp'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 })
    }

    const result = await sendEmailOtp(email)

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send OTP' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      expiresInMinutes: result.expiresInMinutes,
      emailServiceConfigured: result.emailServiceConfigured,
      note: result.error,
    })
  } catch (err: any) {
    console.error('[Send OTP API Error]', err)
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 })
  }
}
