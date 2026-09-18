import { db } from '@/lib/db'

export interface TimeSlotOption {
  timeSlot: string // "09:00", "10:00", etc.
  label: string // "9:00 AM", etc.
  available: boolean
  reason?: string
}

export interface DateAvailabilityResult {
  date: string // "YYYY-MM-DD"
  dayOfWeek: number // 0-6
  isClosed: boolean
  closureReason?: string
  operatingHours?: {
    isOpen: boolean
    openTime: string
    closeTime: string
    slotDurationMinutes: number
  }
  slots: TimeSlotOption[]
}

export interface SlotValidationResult {
  allowed: boolean
  reason?: string
}

/**
 * Parses "HH:MM" into minutes from midnight
 */
function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':')
  if (parts.length < 2) return 0
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
}

/**
 * Formats minutes from midnight to "HH:MM"
 */
function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/**
 * Formats "HH:MM" into "9:00 AM" human readable label
 */
function formatTimeToLabel(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(':')
  let h = parseInt(hStr, 10)
  const m = mStr || '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  if (h === 0) h = 12
  else if (h > 12) h -= 12
  return `${h}:${m} ${ampm}`
}

/**
 * Centralized Engine: Checks slot availability for a specific date
 */
export async function getAvailabilityForDate(
  dateStr: string,
  options?: {
    instructorId?: string
    serviceId?: string
    durationMinutes?: number
  }
): Promise<DateAvailabilityResult> {
  const targetDate = new Date(`${dateStr}T00:00:00`)
  if (isNaN(targetDate.getTime())) {
    return {
      date: dateStr,
      dayOfWeek: 0,
      isClosed: true,
      closureReason: 'Invalid date format (must be YYYY-MM-DD)',
      slots: [],
    }
  }

  const dayOfWeek = targetDate.getDay() // 0 = Sunday, 1 = Monday, ...

  // 1. Check Studio-Wide Closures
  const studioClosure = await db.studioClosure.findUnique({
    where: { date: dateStr },
  })

  if (studioClosure) {
    return {
      date: dateStr,
      dayOfWeek,
      isClosed: true,
      closureReason: studioClosure.reason || 'Studio closed for scheduled closure/holiday',
      slots: [],
    }
  }

  // 2. Check Admin-Configured Operating Hours for this day of week
  let opHours = await db.operatingHours.findUnique({
    where: { dayOfWeek },
  })

  // Fallback defaults if table was not yet seeded
  if (!opHours) {
    const isSunday = dayOfWeek === 0
    opHours = {
      id: `op_${dayOfWeek}`,
      dayOfWeek,
      isOpen: !isSunday,
      openTime: isSunday ? '00:00' : '09:00',
      closeTime: isSunday ? '00:00' : '18:00',
      slotDurationMinutes: 60,
    }
  }

  if (!opHours.isOpen) {
    return {
      date: dateStr,
      dayOfWeek,
      isClosed: true,
      closureReason: 'Studio is normally closed on this day of the week',
      operatingHours: opHours,
      slots: [],
    }
  }

  // 3. Check Instructor-Specific Days Off (exact date check, e.g. 2026-10-14)
  let instructorOff = false
  let instructorReason = ''
  if (options?.instructorId) {
    const dayOff = await db.instructorDayOff.findUnique({
      where: {
        instructorId_date: {
          instructorId: options.instructorId,
          date: dateStr,
        },
      },
    })
    if (dayOff) {
      instructorOff = true
      instructorReason = dayOff.reason || 'Requested photographer/instructor is scheduled off on this date'
    }
  }

  // 4. Check Instructor's specific weekly availability (if instructor assigned)
  let instructorAvail: any = null
  if (options?.instructorId && !instructorOff) {
    instructorAvail = await db.instructorAvailability.findFirst({
      where: {
        instructorId: options.instructorId,
        dayOfWeek,
      },
    })
  }

  // 5. Query existing confirmed bookings for this date
  const existingBookings = await db.booking.findMany({
    where: {
      eventDate: dateStr,
      status: { in: ['scheduled', 'in_progress', 'confirmed'] },
      ...(options?.instructorId ? { instructorId: options.instructorId } : {}),
    },
  })

  // 6. Generate time slots based on operating hours
  const openMin = parseTimeToMinutes(opHours.openTime)
  const closeMin = parseTimeToMinutes(opHours.closeTime)
  const step = opHours.slotDurationMinutes || 60
  const duration = options?.durationMinutes || 60

  const bookedSlots = new Set(
    existingBookings.map((b: any) => b.timeSlot || (b.notes && b.notes.match(/\d{2}:\d{2}/)?.[0])).filter(Boolean)
  )

  const slots: TimeSlotOption[] = []

  for (let m = openMin; m + duration <= closeMin; m += step) {
    const slotTime = formatMinutesToTime(m)
    const label = formatTimeToLabel(slotTime)

    // Check if slot has passed for today
    const now = new Date()
    const nowStr = now.toISOString().split('T')[0]
    let isPast = false
    if (dateStr === nowStr) {
      const currentMin = now.getHours() * 60 + now.getMinutes()
      if (m <= currentMin + 120) {
        // Minimum 2-hour advance notice requirement
        isPast = true
      }
    }

    if (instructorOff) {
      slots.push({
        timeSlot: slotTime,
        label,
        available: false,
        reason: instructorReason,
      })
      continue
    }

    if (instructorAvail) {
      const instStart = parseTimeToMinutes(instructorAvail.startTime)
      const instEnd = parseTimeToMinutes(instructorAvail.endTime)
      if (m < instStart || m + duration > instEnd) {
        slots.push({
          timeSlot: slotTime,
          label,
          available: false,
          reason: 'Outside assigned instructor working hours',
        })
        continue
      }
    }

    if (isPast) {
      slots.push({
        timeSlot: slotTime,
        label,
        available: false,
        reason: 'Requires minimum 2 hours advance booking notice',
      })
      continue
    }

    if (bookedSlots.has(slotTime)) {
      slots.push({
        timeSlot: slotTime,
        label,
        available: false,
        reason: 'Time slot is already reserved by another confirmed session',
      })
      continue
    }

    slots.push({
      timeSlot: slotTime,
      label,
      available: true,
    })
  }

  return {
    date: dateStr,
    dayOfWeek,
    isClosed: false,
    operatingHours: opHours,
    slots,
  }
}

/**
 * Backend Booking Protection: Validates whether a specific slot can be booked.
 * Re-validates all rules on the server. Never trusts frontend availability.
 */
export async function validateBookingSlot(
  dateStr: string,
  timeSlot: string,
  options?: {
    instructorId?: string
    serviceId?: string
    durationMinutes?: number
    excludeBookingId?: string
  }
): Promise<SlotValidationResult> {
  // Check date string format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { allowed: false, reason: 'Invalid date format. Required: YYYY-MM-DD' }
  }

  // Check timeSlot string format HH:MM
  if (!/^\d{2}:\d{2}$/.test(timeSlot)) {
    return { allowed: false, reason: 'Invalid time slot format. Required: HH:MM' }
  }

  const targetDate = new Date(`${dateStr}T${timeSlot}:00`)
  if (isNaN(targetDate.getTime())) {
    return { allowed: false, reason: 'Invalid date and time specified' }
  }

  // Prevent past bookings
  const now = new Date()
  if (targetDate.getTime() < now.getTime() + 60 * 60 * 1000) {
    return { allowed: false, reason: 'Cannot book past dates or slots less than 1 hour away' }
  }

  // Check Studio-wide closure
  const closure = await db.studioClosure.findUnique({
    where: { date: dateStr },
  })
  if (closure) {
    return {
      allowed: false,
      reason: `Studio is closed on ${dateStr}: ${closure.reason || 'Scheduled Studio Closure'}`,
    }
  }

  // Check operating hours
  const dayOfWeek = targetDate.getDay()
  let opHours = await db.operatingHours.findUnique({
    where: { dayOfWeek },
  })
  if (!opHours) {
    const isSunday = dayOfWeek === 0
    opHours = {
      id: `op_${dayOfWeek}`,
      dayOfWeek,
      isOpen: !isSunday,
      openTime: isSunday ? '00:00' : '09:00',
      closeTime: isSunday ? '00:00' : '18:00',
      slotDurationMinutes: 60,
    }
  }

  if (!opHours.isOpen) {
    return { allowed: false, reason: `Studio is closed on day ${dayOfWeek} of the week` }
  }

  const slotMin = parseTimeToMinutes(timeSlot)
  const openMin = parseTimeToMinutes(opHours.openTime)
  const closeMin = parseTimeToMinutes(opHours.closeTime)
  const duration = options?.durationMinutes || 60

  if (slotMin < openMin || slotMin + duration > closeMin) {
    return {
      allowed: false,
      reason: `Selected time slot ${timeSlot} falls outside studio operating hours (${opHours.openTime} - ${opHours.closeTime})`,
    }
  }

  // Check instructor days off
  if (options?.instructorId) {
    const dayOff = await db.instructorDayOff.findUnique({
      where: {
        instructorId_date: {
          instructorId: options.instructorId,
          date: dateStr,
        },
      },
    })
    if (dayOff) {
      return {
        allowed: false,
        reason: `Selected instructor is unavailable on ${dateStr}: ${dayOff.reason || 'Day Off'}`,
      }
    }
  }

  // Double-booking check: Concurrency lock / existing reservation check
  const conflict = await db.booking.findFirst({
    where: {
      eventDate: dateStr,
      timeSlot,
      status: { in: ['scheduled', 'in_progress', 'confirmed'] },
      ...(options?.instructorId ? { instructorId: options.instructorId } : {}),
      ...(options?.excludeBookingId ? { NOT: { id: options.excludeBookingId } } : {}),
    },
  })

  if (conflict) {
    return {
      allowed: false,
      reason: `Time slot ${timeSlot} on ${dateStr} is already booked. Please choose another time.`,
    }
  }

  return { allowed: true }
}
