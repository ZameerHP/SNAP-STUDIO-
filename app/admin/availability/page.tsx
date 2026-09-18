'use client'

import React, { useState, useEffect } from 'react'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function AdminAvailabilityPage() {
  const [operatingHours, setOperatingHours] = useState<any[]>([])
  const [closures, setClosures] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [daysOff, setDaysOff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Forms
  const [newClosureDate, setNewClosureDate] = useState('')
  const [newClosureReason, setNewClosureReason] = useState('')
  const [newInstName, setNewInstName] = useState('')
  const [newInstEmail, setNewInstEmail] = useState('')
  const [newDayOffInstId, setNewDayOffInstId] = useState('')
  const [newDayOffDate, setNewDayOffDate] = useState('')
  const [newDayOffReason, setNewDayOffReason] = useState('')
  const [actionStatus, setActionStatus] = useState<string | null>(null)

  async function loadData() {
    try {
      const res = await fetch('/api/admin/availability')
      const data = await res.json()
      if (data.success) {
        setOperatingHours(data.operatingHours || [])
        setClosures(data.closures || [])
        setInstructors(data.instructors || [])
        setDaysOff(data.daysOff || [])
        if (data.instructors?.length > 0 && !newDayOffInstId) {
          setNewDayOffInstId(data.instructors[0].id)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleUpdateOpHours(dayOfWeek: number, isOpen: boolean, openTime: string, closeTime: string) {
    setActionStatus(`Saving hours for ${DAY_NAMES[dayOfWeek]}...`)
    try {
      const res = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_operating_hours',
          payload: { dayOfWeek, isOpen, openTime, closeTime },
        }),
      })
      const data = await res.json()
      if (data.success) {
        setActionStatus(`Updated ${DAY_NAMES[dayOfWeek]}`)
        loadData()
      }
    } catch (e: any) {
      setActionStatus(`Error: ${e.message}`)
    }
  }

  async function handleAddClosure(e: React.FormEvent) {
    e.preventDefault()
    if (!newClosureDate) return
    setActionStatus('Adding studio closure...')
    try {
      const res = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_studio_closure',
          payload: { date: newClosureDate, reason: newClosureReason },
        }),
      })
      const data = await res.json()
      if (data.success) {
        setNewClosureDate('')
        setNewClosureReason('')
        setActionStatus('Studio closure added.')
        loadData()
      }
    } catch (e: any) {
      setActionStatus(`Error: ${e.message}`)
    }
  }

  async function handleDeleteClosure(id: string) {
    try {
      await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_studio_closure',
          payload: { id },
        }),
      })
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  async function handleAddInstructor(e: React.FormEvent) {
    e.preventDefault()
    if (!newInstName || !newInstEmail) return
    try {
      const res = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_instructor',
          payload: { name: newInstName, email: newInstEmail },
        }),
      })
      const data = await res.json()
      if (data.success) {
        setNewInstName('')
        setNewInstEmail('')
        loadData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function handleAddDayOff(e: React.FormEvent) {
    e.preventDefault()
    if (!newDayOffInstId || !newDayOffDate) return
    try {
      const res = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_instructor_day_off',
          payload: { instructorId: newDayOffInstId, date: newDayOffDate, reason: newDayOffReason },
        }),
      })
      const data = await res.json()
      if (data.success) {
        setNewDayOffDate('')
        setNewDayOffReason('')
        loadData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function handleDeleteDayOff(id: string) {
    try {
      await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_instructor_day_off',
          payload: { id },
        }),
      })
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#D7FF3F', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          SCHEDULE & CALENDAR ENGINE
        </span>
        <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', margin: '4px 0 0 0', color: '#F4F1E9' }}>
          Operating Hours & Availability
        </h1>
        <p style={{ color: '#88907f', fontSize: '13px', margin: '6px 0 0 0' }}>
          Configure live studio operating hours, date-specific studio closures, and individual photographer days off. Synchronized across the entire platform.
        </p>
        {actionStatus && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#D7FF3F', fontFamily: 'ui-monospace, monospace' }}>
            ● {actionStatus}
          </div>
        )}
      </div>

      {loading ? (
        <p style={{ color: '#88907f', fontSize: '13px' }}>Loading schedule settings...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* 1. Operating Hours Table */}
          <div style={{ backgroundColor: '#191C16', borderRadius: '4px', border: '1px solid rgba(244, 241, 233, 0.1)', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: '#F4F1E9' }}>
              Studio Weekly Operating Hours
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {DAY_NAMES.map((dayName, idx) => {
                const dayConfig = operatingHours.find((h) => h.dayOfWeek === idx) || {
                  dayOfWeek: idx,
                  isOpen: idx !== 0,
                  openTime: '09:00',
                  closeTime: '18:00',
                }

                return (
                  <div
                    key={dayName}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: '#10110F',
                      borderRadius: '4px',
                      border: '1px solid rgba(244, 241, 233, 0.06)',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ width: '130px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#F4F1E9' }}>{dayName}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#dedad0', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={dayConfig.isOpen}
                          onChange={(e) =>
                            handleUpdateOpHours(idx, e.target.checked, dayConfig.openTime, dayConfig.closeTime)
                          }
                        />
                        {dayConfig.isOpen ? 'Open' : 'Closed'}
                      </label>

                      {dayConfig.isOpen && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="time"
                            defaultValue={dayConfig.openTime}
                            onBlur={(e) =>
                              handleUpdateOpHours(idx, dayConfig.isOpen, e.target.value, dayConfig.closeTime)
                            }
                            style={{
                              backgroundColor: '#191C16',
                              border: '1px solid rgba(244, 241, 233, 0.2)',
                              color: '#F4F1E9',
                              padding: '4px 8px',
                              borderRadius: '3px',
                              fontSize: '12px',
                            }}
                          />
                          <span style={{ color: '#88907f', fontSize: '12px' }}>to</span>
                          <input
                            type="time"
                            defaultValue={dayConfig.closeTime}
                            onBlur={(e) =>
                              handleUpdateOpHours(idx, dayConfig.isOpen, dayConfig.openTime, e.target.value)
                            }
                            style={{
                              backgroundColor: '#191C16',
                              border: '1px solid rgba(244, 241, 233, 0.2)',
                              color: '#F4F1E9',
                              padding: '4px 8px',
                              borderRadius: '3px',
                              fontSize: '12px',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 2. Studio-Wide Closures */}
          <div style={{ backgroundColor: '#191C16', borderRadius: '4px', border: '1px solid rgba(244, 241, 233, 0.1)', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#F4F1E9' }}>
              Studio-Wide Closures (Holidays & Maintenance)
            </h2>
            <p style={{ color: '#88907f', fontSize: '12px', margin: '0 0 16px 0' }}>
              When a studio closure date is entered, no bookings are permitted studio-wide on that date.
            </p>

            <form onSubmit={handleAddClosure} style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <input
                type="date"
                required
                value={newClosureDate}
                onChange={(e) => setNewClosureDate(e.target.value)}
                style={{
                  backgroundColor: '#10110F',
                  border: '1px solid rgba(244, 241, 233, 0.2)',
                  color: '#F4F1E9',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              />
              <input
                type="text"
                placeholder="Reason (e.g. Christmas Day, Equipment Maintenance)"
                value={newClosureReason}
                onChange={(e) => setNewClosureReason(e.target.value)}
                style={{
                  backgroundColor: '#10110F',
                  border: '1px solid rgba(244, 241, 233, 0.2)',
                  color: '#F4F1E9',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  flex: 1,
                  minWidth: '200px',
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: '#D7FF3F',
                  color: '#10110F',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                + Add Closure
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {closures.length === 0 ? (
                <span style={{ color: '#88907f', fontSize: '12px' }}>No scheduled studio closures on file.</span>
              ) : (
                closures.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: '#10110F',
                      borderRadius: '4px',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#D7FF3F', fontSize: '13px', fontFamily: 'monospace' }}>{c.date}</strong>
                      <span style={{ color: '#dedad0', fontSize: '13px', marginLeft: '12px' }}>{c.reason}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteClosure(c.id)}
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(255, 60, 60, 0.3)',
                        color: '#ff6b6b',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. Photographers / Instructors & Days Off */}
          <div style={{ backgroundColor: '#191C16', borderRadius: '4px', border: '1px solid rgba(244, 241, 233, 0.1)', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#F4F1E9' }}>
              Photographers & Individual Days Off
            </h2>
            <p style={{ color: '#88907f', fontSize: '12px', margin: '0 0 16px 0' }}>
              Individual days off apply only to the specified photographer on that exact date, without blocking other available studio staff.
            </p>

            {/* Add Instructor Form */}
            <form onSubmit={handleAddInstructor} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Photographer Name"
                required
                value={newInstName}
                onChange={(e) => setNewInstName(e.target.value)}
                style={{
                  backgroundColor: '#10110F',
                  border: '1px solid rgba(244, 241, 233, 0.2)',
                  color: '#F4F1E9',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={newInstEmail}
                onChange={(e) => setNewInstEmail(e.target.value)}
                style={{
                  backgroundColor: '#10110F',
                  border: '1px solid rgba(244, 241, 233, 0.2)',
                  color: '#F4F1E9',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: '#D7FF3F',
                  color: '#10110F',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                + Register Staff
              </button>
            </form>

            {/* Add Day Off Form */}
            {instructors.length > 0 && (
              <form onSubmit={handleAddDayOff} style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <select
                  value={newDayOffInstId}
                  onChange={(e) => setNewDayOffInstId(e.target.value)}
                  style={{
                    backgroundColor: '#10110F',
                    border: '1px solid rgba(244, 241, 233, 0.2)',
                    color: '#F4F1E9',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  {instructors.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.email})
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  required
                  value={newDayOffDate}
                  onChange={(e) => setNewDayOffDate(e.target.value)}
                  style={{
                    backgroundColor: '#10110F',
                    border: '1px solid rgba(244, 241, 233, 0.2)',
                    color: '#F4F1E9',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                />
                <input
                  type="text"
                  placeholder="Reason (e.g. Travel, Personal Leave)"
                  value={newDayOffReason}
                  onChange={(e) => setNewDayOffReason(e.target.value)}
                  style={{
                    backgroundColor: '#10110F',
                    border: '1px solid rgba(244, 241, 233, 0.2)',
                    color: '#F4F1E9',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    flex: 1,
                    minWidth: '150px',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#D7FF3F',
                    color: '#10110F',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  + Add Day Off
                </button>
              </form>
            )}

            {/* List of Days Off */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {daysOff.length === 0 ? (
                <span style={{ color: '#88907f', fontSize: '12px' }}>No staff days off scheduled.</span>
              ) : (
                daysOff.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: '#10110F',
                      borderRadius: '4px',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#F4F1E9', fontSize: '13px' }}>{d.instructor?.name || 'Photographer'}</strong>
                      <span style={{ color: '#D7FF3F', fontSize: '12px', fontFamily: 'monospace', marginLeft: '12px' }}>
                        {d.date}
                      </span>
                      <span style={{ color: '#88907f', fontSize: '12px', marginLeft: '12px' }}>{d.reason}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteDayOff(d.id)}
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(255, 60, 60, 0.3)',
                        color: '#ff6b6b',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
