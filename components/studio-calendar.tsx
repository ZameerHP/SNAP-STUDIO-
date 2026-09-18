'use client'

import React, { useState, useMemo } from 'react'

export interface StudioCalendarProps {
  initialDate?: string
  initialTimeSlot?: string
  onDateChange?: (date: string, timeSlot: string) => void
}

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning Light', time: '09:00 AM — 12:00 PM', desc: 'Soft studio/natural ambient lighting' },
  { id: 'midday', label: 'Midday Prime', time: '12:00 PM — 03:00 PM', desc: 'Optimal for corporate, commercial & passports' },
  { id: 'golden', label: 'Golden Hour', time: '03:30 PM — 06:30 PM', desc: 'Warm cinematic outdoor & portrait tone' },
  { id: 'twilight', label: 'Twilight / Night', time: '07:00 PM — 10:00 PM', desc: 'Dramatic studio strobes & live broadcasts' },
  { id: 'fullday', label: 'Full Day Call', time: 'Custom All-Day', desc: 'Comprehensive multi-scene production' },
]

export default function StudioCalendar({
  initialDate,
  initialTimeSlot,
  onDateChange,
}: StudioCalendarProps) {
  // Base reference date (fallback to current year 2026)
  const today = useMemo(() => new Date(), [])
  
  // Default selected date is tomorrow or initialDate
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (initialDate) {
      const parsed = new Date(initialDate)
      if (!isNaN(parsed.getTime())) return parsed
    }
    // Default to tomorrow
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(0, 0, 0, 0)
    return d
  })

  // Current calendar view month/year
  const [viewYear, setViewYear] = useState<number>(() => selectedDate?.getFullYear() || today.getFullYear())
  const [viewMonth, setViewMonth] = useState<number>(() => selectedDate?.getMonth() ?? today.getMonth())

  // Selected time slot
  const [selectedSlot, setSelectedSlot] = useState<string>(
    initialTimeSlot || 'Midday Prime (12:00 PM — 03:00 PM)'
  )

  // Format selected date for hidden input: YYYY-MM-DD
  const formattedDateStr = useMemo(() => {
    if (!selectedDate) return ''
    const y = selectedDate.getFullYear()
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const d = String(selectedDate.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [selectedDate])

  // Formatted display info: exact day of the week, full date
  const dayInfo = useMemo(() => {
    if (!selectedDate) return null
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' })
    const fullDate = selectedDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6
    return {
      dayOfWeek,
      fullDate,
      isWeekend,
      label: `${dayOfWeek}, ${fullDate}`,
      classification: isWeekend ? 'Weekend Production Session' : 'Weekday Studio / Location Call',
    }
  }, [selectedDate])

  // Days in current view month
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1)
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    
    // Day of week for 1st day (0 = Sun, 1 = Mon, ... 6 = Sat)
    // Convert to Monday = 0, Sunday = 6
    let startDay = firstDayOfMonth.getDay() - 1
    if (startDay === -1) startDay = 6 // Sunday becomes 6

    const days = []
    
    // Previous month padding
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate()
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        dayNumber: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(viewYear, viewMonth - 1, prevMonthDays - i),
        isPast: true,
      })
    }

    // Current month days
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(viewYear, viewMonth, d)
      const isPast = dateObj.getTime() < todayZero
      days.push({
        dayNumber: d,
        isCurrentMonth: true,
        date: dateObj,
        isPast,
      })
    }

    // Next month padding to fill grid to 35 or 42 cells
    const remaining = 35 - days.length
    if (remaining > 0) {
      for (let n = 1; n <= remaining; n++) {
        days.push({
          dayNumber: n,
          isCurrentMonth: false,
          date: new Date(viewYear, viewMonth + 1, n),
          isPast: false,
        })
      }
    } else if (days.length > 35 && days.length < 42) {
      const extra = 42 - days.length
      for (let n = 1; n <= extra; n++) {
        days.push({
          dayNumber: n,
          isCurrentMonth: false,
          date: new Date(viewYear, viewMonth + 1, n),
          isPast: false,
        })
      }
    }

    return days
  }, [viewYear, viewMonth, today])

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  function handlePrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  function handleNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  function selectDate(dateObj: Date) {
    setSelectedDate(dateObj)
    if (onDateChange) {
      const y = dateObj.getFullYear()
      const m = String(dateObj.getMonth() + 1).padStart(2, '0')
      const d = String(dateObj.getDate()).padStart(2, '0')
      onDateChange(`${y}-${m}-${d}`, selectedSlot)
    }
  }

  function handleSlotSelect(slotLabel: string) {
    setSelectedSlot(slotLabel)
    if (onDateChange && formattedDateStr) {
      onDateChange(formattedDateStr, slotLabel)
    }
  }

  function handleQuickSelect(daysFromNow: number) {
    const d = new Date()
    d.setDate(d.getDate() + daysFromNow)
    d.setHours(0, 0, 0, 0)
    setSelectedDate(d)
    setViewMonth(d.getMonth())
    setViewYear(d.getFullYear())
    if (onDateChange) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      onDateChange(`${y}-${m}-${day}`, selectedSlot)
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#131512',
        border: '1px solid rgba(244, 241, 233, 0.15)',
        borderRadius: '6px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        color: '#F4F1E9',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Hidden inputs for form submission */}
      <input type="hidden" name="date" value={formattedDateStr} />
      <input type="hidden" name="timeSlot" value={selectedSlot} />

      {/* Calendar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D7FF3F', boxShadow: '0 0 8px #D7FF3F' }} />
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#D7FF3F', fontWeight: 700 }}>
              PRODUCTION CALENDAR & TIME SELECTION
            </span>
          </div>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 600, color: '#F4F1E9', letterSpacing: '-0.01em' }}>
            {monthName}
          </h3>
        </div>

        {/* Month Navigation */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handlePrevMonth}
            style={{
              background: '#1D201A',
              border: '1px solid rgba(244, 241, 233, 0.2)',
              color: '#F4F1E9',
              padding: '6px 14px',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ‹ Prev
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            style={{
              background: '#1D201A',
              border: '1px solid rgba(244, 241, 233, 0.2)',
              color: '#F4F1E9',
              padding: '6px 14px',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Next ›
          </button>
        </div>
      </div>

      {/* Quick Day Presets */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', textTransform: 'uppercase', color: '#88907f', letterSpacing: '0.08em' }}>
          Quick Pick:
        </span>
        <button
          type="button"
          onClick={() => handleQuickSelect(0)}
          style={{
            background: 'rgba(244, 241, 233, 0.05)',
            border: '1px solid rgba(244, 241, 233, 0.15)',
            color: '#F4F1E9',
            fontSize: '11px',
            padding: '4px 10px',
            borderRadius: '20px',
            cursor: 'pointer',
          }}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => handleQuickSelect(1)}
          style={{
            background: 'rgba(244, 241, 233, 0.05)',
            border: '1px solid rgba(244, 241, 233, 0.15)',
            color: '#F4F1E9',
            fontSize: '11px',
            padding: '4px 10px',
            borderRadius: '20px',
            cursor: 'pointer',
          }}
        >
          Tomorrow
        </button>
        <button
          type="button"
          onClick={() => {
            const d = new Date()
            const distToSat = (6 - d.getDay() + 7) % 7 || 7
            handleQuickSelect(distToSat)
          }}
          style={{
            background: 'rgba(215, 255, 63, 0.12)',
            border: '1px solid rgba(215, 255, 63, 0.3)',
            color: '#D7FF3F',
            fontSize: '11px',
            padding: '4px 10px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          This Saturday
        </button>
        <button
          type="button"
          onClick={() => {
            const d = new Date()
            const distToSun = (7 - d.getDay()) % 7 || 7
            handleQuickSelect(distToSun)
          }}
          style={{
            background: 'rgba(215, 255, 63, 0.12)',
            border: '1px solid rgba(215, 255, 63, 0.3)',
            color: '#D7FF3F',
            fontSize: '11px',
            padding: '4px 10px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          This Sunday
        </button>
        <button
          type="button"
          onClick={() => handleQuickSelect(7)}
          style={{
            background: 'rgba(244, 241, 233, 0.05)',
            border: '1px solid rgba(244, 241, 233, 0.15)',
            color: '#F4F1E9',
            fontSize: '11px',
            padding: '4px 10px',
            borderRadius: '20px',
            cursor: 'pointer',
          }}
        >
          Next Week (+7d)
        </button>
      </div>

      {/* Weekday Labels Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          gap: '4px',
          borderBottom: '1px solid rgba(244, 241, 233, 0.1)',
          paddingBottom: '8px',
        }}
      >
        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, idx) => (
          <div
            key={day}
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: '11px',
              fontWeight: 700,
              color: idx >= 5 ? '#D7FF3F' : '#88907f',
              letterSpacing: '0.05em',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid - 100% High Contrast, No Fading */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '6px',
        }}
      >
        {calendarGrid.map((item, index) => {
          const isSelected =
            selectedDate &&
            item.date.getFullYear() === selectedDate.getFullYear() &&
            item.date.getMonth() === selectedDate.getMonth() &&
            item.date.getDate() === selectedDate.getDate()

          const isToday =
            item.date.getFullYear() === today.getFullYear() &&
            item.date.getMonth() === today.getMonth() &&
            item.date.getDate() === today.getDate()

          return (
            <button
              type="button"
              key={index}
              disabled={item.isPast}
              onClick={() => selectDate(item.date)}
              style={{
                aspectRatio: '1 / 1',
                minHeight: '44px',
                borderRadius: '6px',
                border: isSelected
                  ? '2px solid #D7FF3F'
                  : isToday
                  ? '1px solid rgba(215, 255, 63, 0.6)'
                  : '1px solid rgba(244, 241, 233, 0.08)',
                backgroundColor: isSelected
                  ? '#D7FF3F'
                  : isToday
                  ? 'rgba(215, 255, 63, 0.08)'
                  : item.isCurrentMonth
                  ? '#1A1D18'
                  : 'rgba(255, 255, 255, 0.02)',
                color: isSelected
                  ? '#10110F'
                  : item.isPast
                  ? 'rgba(244, 241, 233, 0.25)'
                  : item.isCurrentMonth
                  ? '#F4F1E9'
                  : 'rgba(244, 241, 233, 0.45)',
                fontWeight: isSelected ? 800 : item.isCurrentMonth ? 600 : 400,
                fontSize: '14px',
                cursor: item.isPast ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{item.dayNumber}</span>
              {isToday && !isSelected && (
                <span
                  style={{
                    fontSize: '8px',
                    fontFamily: 'ui-monospace, monospace',
                    color: '#D7FF3F',
                    lineHeight: '1',
                    marginTop: '2px',
                    fontWeight: 700,
                  }}
                >
                  TODAY
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Confirmed Exact Day Display Banner */}
      {dayInfo ? (
        <div
          style={{
            backgroundColor: 'rgba(215, 255, 63, 0.08)',
            border: '1px solid rgba(215, 255, 63, 0.35)',
            borderRadius: '6px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#D7FF3F', fontSize: '16px', fontWeight: 800 }}>✓</span>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#D7FF3F', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                CONFIRMED PRODUCTION DATE
              </span>
            </div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#F4F1E9', marginTop: '4px' }}>
              {dayInfo.dayOfWeek}, {dayInfo.fullDate}
            </div>
            <div style={{ fontSize: '12px', color: '#88907f', marginTop: '2px', fontFamily: 'ui-monospace, monospace' }}>
              {dayInfo.classification}
            </div>
          </div>

          <div
            style={{
              padding: '6px 14px',
              backgroundColor: '#10110F',
              border: '1px solid rgba(215, 255, 63, 0.4)',
              borderRadius: '20px',
              color: '#D7FF3F',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {dayInfo.dayOfWeek.toUpperCase()}
          </div>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: '#10110F',
            border: '1px dashed rgba(244, 241, 233, 0.2)',
            borderRadius: '6px',
            padding: '14px',
            textAlign: 'center',
            color: '#88907f',
            fontSize: '13px',
          }}
        >
          Select a date on the calendar above to reserve your studio call time
        </div>
      )}

      {/* Production Time Slot Selection */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <label style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', textTransform: 'uppercase', color: '#F4F1E9', letterSpacing: '0.08em', fontWeight: 700 }}>
            Preferred Production Call Time
          </label>
          <span style={{ fontSize: '11px', color: '#D7FF3F', fontFamily: 'ui-monospace, monospace' }}>
            Flexible / Adjustable
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          {TIME_SLOTS.map((slot) => {
            const isSlotActive = selectedSlot.includes(slot.label)
            return (
              <button
                type="button"
                key={slot.id}
                onClick={() => handleSlotSelect(`${slot.label} (${slot.time})`)}
                style={{
                  backgroundColor: isSlotActive ? 'rgba(215, 255, 63, 0.12)' : '#181A15',
                  border: isSlotActive ? '1px solid #D7FF3F' : '1px solid rgba(244, 241, 233, 0.1)',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  color: isSlotActive ? '#D7FF3F' : '#F4F1E9',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px' }}>{slot.label}</span>
                  {isSlotActive && <span style={{ fontSize: '12px' }}>✓</span>}
                </div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: isSlotActive ? '#F4F1E9' : '#88907f', marginTop: '2px' }}>
                  {slot.time}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
