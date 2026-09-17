'use client'

import React, { useState, useEffect } from 'react'

interface Booking {
  id: string
  clientName: string
  clientEmail: string
  clientPhone: string | null
  serviceName: string
  packageName: string | null
  eventDate: string | null
  location: string | null
  status: string
  notes: string | null
  createdAt: string
  user?: {
    name: string | null
    email: string
  } | null
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [updating, setUpdating] = useState(false)

  async function loadBookings() {
    try {
      const res = await fetch('/api/bookings')
      const data = await res.json()
      if (data.success) {
        setBookings(data.bookings)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  async function updateBookingStatus(id: string, newStatus: string) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
        )
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  const filtered = bookings.filter((b) => {
    if (filter === 'ALL') return true
    return b.status === filter
  })

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#D7FF3F', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            PRODUCTION SCHEDULE
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', margin: '4px 0 0 0' }}>
            Bookings & Studio Sessions
          </h1>
          <p style={{ color: '#88907f', fontSize: '13px', margin: '6px 0 0 0' }}>
            Scheduled shoot dates, production locations, and client assignment lifecycle.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'CONFIRMED', 'INQUIRY', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              style={{
                padding: '6px 12px',
                borderRadius: '999px',
                border: '1px solid',
                borderColor: filter === st ? '#D7FF3F' : 'rgba(244, 241, 233, 0.15)',
                backgroundColor: filter === st ? '#D7FF3F' : 'transparent',
                color: filter === st ? '#10110F' : '#F4F1E9',
                fontSize: '10px',
                fontFamily: 'ui-monospace, monospace',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {st} ({bookings.filter((b) => st === 'ALL' || b.status === st).length})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#88907f', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
          Accessing production dispatch database...
        </p>
      ) : filtered.length === 0 ? (
        <div style={{
          backgroundColor: '#191C16',
          border: '1px solid rgba(244, 241, 233, 0.1)',
          borderRadius: '4px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>No Bookings for Filter: {filter}</h3>
          <p style={{ color: '#88907f', fontSize: '13px', margin: 0 }}>
            Convert leads from the Inquiries tab or create bookings directly.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((b) => (
            <div
              key={b.id}
              style={{
                backgroundColor: '#191C16',
                border: '1px solid rgba(244, 241, 233, 0.1)',
                borderRadius: '4px',
                padding: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '18px', color: '#F4F1E9' }}>{b.clientName}</strong>
                  <span style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '9px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: b.status === 'CONFIRMED' ? 'rgba(215, 255, 63, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                    color: b.status === 'CONFIRMED' ? '#D7FF3F' : '#dedad0',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}>
                    {b.status}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#dedad0', marginBottom: '6px' }}>
                  <strong>{b.serviceName}</strong> {b.packageName && `• ${b.packageName}`}
                </div>

                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontFamily: 'ui-monospace, monospace', color: '#88907f' }}>
                  <span>Email: {b.clientEmail}</span>
                  {b.clientPhone && <span>• Tel: {b.clientPhone}</span>}
                  <span>• Date: {b.eventDate || 'TBD'}</span>
                  <span>• Location: {b.location || 'London, ON'}</span>
                </div>
              </div>

              {/* Status Action Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f' }}>STATUS:</span>
                <select
                  value={b.status}
                  disabled={updating}
                  onChange={(e) => updateBookingStatus(b.id, e.target.value)}
                  style={{
                    backgroundColor: '#10110F',
                    border: '1px solid rgba(244, 241, 233, 0.2)',
                    color: '#F4F1E9',
                    borderRadius: '4px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontFamily: 'ui-monospace, monospace',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="INQUIRY">INQUIRY</option>
                  <option value="QUOTED">QUOTED</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
