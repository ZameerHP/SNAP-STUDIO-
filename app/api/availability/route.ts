import { NextRequest, NextResponse } from 'next/server'
import { getAvailabilityForDate } from '@/lib/availability'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const instructorId = searchParams.get('instructorId') || undefined
    const serviceId = searchParams.get('serviceId') || undefined

    if (!date) {
      return NextResponse.json({ error: 'Date query parameter (YYYY-MM-DD) is required' }, { status: 400 })
    }

    const availability = await getAvailabilityForDate(date, {
      instructorId,
      serviceId,
    })

    return NextResponse.json({
      success: true,
      availability,
    })
  } catch (error: any) {
    console.error('[Availability API Error]', error)
    return NextResponse.json({ error: error?.message || 'Failed to check availability' }, { status: 500 })
  }
}
