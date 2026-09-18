import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/session-user'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 })
    }

    const [operatingHours, closures, instructors, daysOff] = await Promise.all([
      db.operatingHours.findMany({ orderBy: { dayOfWeek: 'asc' } }),
      db.studioClosure.findMany({ orderBy: { date: 'asc' } }),
      db.instructor.findMany({
        include: { availability: true, daysOff: true },
        orderBy: { name: 'asc' },
      }),
      db.instructorDayOff.findMany({
        include: { instructor: true },
        orderBy: { date: 'asc' },
      }),
    ])

    return NextResponse.json({
      success: true,
      operatingHours,
      closures,
      instructors,
      daysOff,
    })
  } catch (err: any) {
    console.error('[Admin Availability GET Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 })
    }

    const body = await req.json()
    const { action, payload } = body

    switch (action) {
      case 'update_operating_hours': {
        const { dayOfWeek, isOpen, openTime, closeTime, slotDurationMinutes } = payload
        const updated = await db.operatingHours.upsert({
          where: { dayOfWeek: Number(dayOfWeek) },
          update: {
            isOpen: Boolean(isOpen),
            openTime: openTime || '09:00',
            closeTime: closeTime || '18:00',
            slotDurationMinutes: Number(slotDurationMinutes) || 60,
          },
          create: {
            dayOfWeek: Number(dayOfWeek),
            isOpen: Boolean(isOpen),
            openTime: openTime || '09:00',
            closeTime: closeTime || '18:00',
            slotDurationMinutes: Number(slotDurationMinutes) || 60,
          },
        })
        return NextResponse.json({ success: true, updated })
      }

      case 'add_studio_closure': {
        const { date, reason } = payload
        if (!date) return NextResponse.json({ error: 'Date is required (YYYY-MM-DD)' }, { status: 400 })
        const closure = await db.studioClosure.upsert({
          where: { date },
          update: { reason: reason || 'Studio Closure' },
          create: { date, reason: reason || 'Studio Closure' },
        })
        return NextResponse.json({ success: true, closure })
      }

      case 'delete_studio_closure': {
        const { id, date } = payload
        if (id) {
          await db.studioClosure.delete({ where: { id } })
        } else if (date) {
          await db.studioClosure.delete({ where: { date } })
        }
        return NextResponse.json({ success: true })
      }

      case 'add_instructor': {
        const { name, email, phone } = payload
        if (!name || !email) return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
        const instructor = await db.instructor.create({
          data: { name, email, phone: phone || null, active: true },
        })
        return NextResponse.json({ success: true, instructor })
      }

      case 'add_instructor_day_off': {
        const { instructorId, date, reason } = payload
        if (!instructorId || !date) return NextResponse.json({ error: 'instructorId and date required' }, { status: 400 })
        const dayOff = await db.instructorDayOff.upsert({
          where: {
            instructorId_date: {
              instructorId,
              date,
            },
          },
          update: { reason: reason || 'Instructor Day Off' },
          create: { instructorId, date, reason: reason || 'Instructor Day Off' },
        })
        return NextResponse.json({ success: true, dayOff })
      }

      case 'delete_instructor_day_off': {
        const { id } = payload
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
        await db.instructorDayOff.delete({ where: { id } })
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err: any) {
    console.error('[Admin Availability POST Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
