import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/session-user'
import { db } from '@/lib/db'
import { validateBookingSlot } from '@/lib/availability'
import { sendAdminNotification } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = user.role === 'ADMIN'

    // Look up client record for non-admin
    let clientWhere = {}
    if (!isAdmin) {
      const client = await db.client.findFirst({ where: { email: user.email } })
      if (!client) {
        return NextResponse.json({ success: true, bookings: [] })
      }
      clientWhere = { clientId: client.id }
    }

    const bookings = await db.booking.findMany({
      where: clientWhere,
      include: {
        client: true,
        service: true,
        invoices: true,
        contracts: true,
        galleries: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, bookings })
  } catch (error: any) {
    console.error('Failed to fetch bookings:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    const body = await req.json()
    const {
      clientName,
      clientEmail,
      clientPhone,
      serviceId,
      instructorId,
      eventDate,
      timeSlot,
      location,
      notes,
    } = body

    const cleanEmail = (clientEmail || user?.email)?.trim().toLowerCase()
    const cleanName = (clientName || user?.name)?.trim()

    if (!cleanName || !cleanEmail) {
      return NextResponse.json(
        { success: false, error: 'Client name and valid email address are required' },
        { status: 400 }
      )
    }

    // 1. BACKEND BOOKING PROTECTION: If date and timeSlot provided, strictly validate against availability rules
    if (eventDate && timeSlot) {
      const validation = await validateBookingSlot(eventDate, timeSlot, {
        instructorId: instructorId || undefined,
        serviceId: serviceId || undefined,
      })

      if (!validation.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: validation.reason || 'Requested date and time slot are unavailable.',
          },
          { status: 409 }
        )
      }
    }

    // 2. Get or create Client record in database
    let client = await db.client.findFirst({
      where: { email: cleanEmail },
    })

    if (!client) {
      client = await db.client.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          phone: clientPhone || null,
        },
      })
    } else if (clientPhone && !client.phone) {
      client = await db.client.update({
        where: { id: client.id },
        data: { phone: clientPhone },
      })
    }

    // 3. Create Booking with transaction & double-booking guard
    const scheduledAt = eventDate && timeSlot
      ? new Date(`${eventDate}T${timeSlot}:00`)
      : new Date()

    const booking = await db.$transaction(async (tx: any) => {
      if (eventDate && timeSlot) {
        const doubleBookCheck = await tx.booking.findFirst({
          where: {
            eventDate,
            timeSlot,
            status: { in: ['scheduled', 'in_progress', 'confirmed'] },
            ...(instructorId ? { instructorId } : {}),
          },
        })

        if (doubleBookCheck) {
          throw new Error(`Time slot ${timeSlot} on ${eventDate} was just claimed. Please choose another slot.`)
        }
      }

      return tx.booking.create({
        data: {
          clientId: client.id,
          serviceId: serviceId || null,
          instructorId: instructorId || null,
          scheduledAt,
          eventDate: eventDate || null,
          timeSlot: timeSlot || null,
          location: location || 'Super Snap Studio London',
          notes: notes || null,
          status: 'scheduled',
        },
        include: {
          client: true,
          service: true,
        },
      })
    })

    // 4. Create Notification in database
    await db.notification.create({
      data: {
        userId: client.id,
        title: 'Session Reserved',
        message: `Your booking for ${eventDate || 'upcoming production'} at ${timeSlot || 'scheduled time'} has been recorded.`,
        type: 'booking',
        link: '/portal',
      },
    })

    // 5. Send real administrative notification
    await sendAdminNotification({
      subject: `New Production Booking: ${cleanName}`,
      html: `
        <h2>Production Booking Created</h2>
        <p><strong>Client:</strong> ${cleanName} (${cleanEmail})</p>
        <p><strong>Phone:</strong> ${clientPhone || 'Not provided'}</p>
        <p><strong>Date:</strong> ${eventDate || 'TBD'}</p>
        <p><strong>Time Slot:</strong> ${timeSlot || 'TBD'}</p>
        <p><strong>Location:</strong> ${location || 'London Studio'}</p>
        <p><strong>Notes:</strong> ${notes || 'None'}</p>
      `,
      data: { bookingId: booking.id, clientName: cleanName, clientEmail: cleanEmail },
    })

    return NextResponse.json({ success: true, booking }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create booking:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create booking' },
      { status: error?.message?.includes('claimed') ? 409 : 500 }
    )
  }
}
