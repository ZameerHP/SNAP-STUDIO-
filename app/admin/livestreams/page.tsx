'use client'

import React, { useState, useEffect } from 'react'

interface Livestream {
  id: string
  title: string
  streamUrl: string | null
  status: string
  createdAt: string
  user: {
    name: string | null
    email: string
  }
  booking?: {
    serviceName: string
    eventDate: string | null
  } | null
}

export default function AdminLivestreamsPage() {
  const [streams, setStreams] = useState<Livestream[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [updating, setUpdating] = useState(false)

  async function loadStreams() {
    try {
      const res = await fetch('/api/livestreams')
      const data = await res.json()
      if (data.success) {
        setStreams(data.livestreams)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStreams()
  }, [])

  async function toggleStatus(id: string, currentStatus: string) {
    const nextStatus = currentStatus === 'LIVE' ? 'OFFLINE' : 'LIVE'
    setUpdating(true)
    try {
      const res = await fetch(`/api/livestreams/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setStreams((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: nextStatus } : s))
        )
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  async function saveUrl(id: string) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/livestreams/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamUrl: urlInput }),
      })
      const data = await res.json()
      if (data.success) {
        setStreams((prev) =>
          prev.map((s) => (s.id === id ? { ...s, streamUrl: urlInput } : s))
        )
        setEditingId(null)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#D7FF3F', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          BROADCAST CONTROL ROOM
        </span>
        <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', margin: '4px 0 0 0' }}>
          Livestream Broadcast Links
        </h1>
        <p style={{ color: '#88907f', fontSize: '13px', margin: '6px 0 0 0' }}>
          Paste external stream links per client event and toggle live transmission status in real-time.
        </p>
      </div>

      {loading ? (
        <p style={{ color: '#88907f', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
          Loading studio broadcast routing table...
        </p>
      ) : streams.length === 0 ? (
        <div style={{
          backgroundColor: '#191C16',
          border: '1px solid rgba(244, 241, 233, 0.1)',
          borderRadius: '4px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>No Stream Feeds Configured</h3>
          <p style={{ color: '#88907f', fontSize: '13px', margin: 0 }}>
            Live stream links assigned to client bookings will appear here for instant broadcast toggle.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {streams.map((st) => {
            const isLive = st.status === 'LIVE'
            const isEditing = editingId === st.id

            return (
              <div
                key={st.id}
                style={{
                  backgroundColor: '#191C16',
                  border: isLive ? '1px solid #ff4d4d' : '1px solid rgba(244, 241, 233, 0.1)',
                  borderRadius: '4px',
                  padding: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '16px', color: '#F4F1E9' }}>{st.title}</strong>
                    <span style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: '9px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      backgroundColor: isLive ? 'rgba(255, 60, 60, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                      color: isLive ? '#ff6b6b' : '#88907f',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}>
                      {isLive ? '● ON AIR' : '○ OFFLINE'}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#88907f', marginBottom: '8px', fontFamily: 'ui-monospace, monospace' }}>
                    <span>Client: <strong style={{ color: '#F4F1E9' }}>{st.user.name || st.user.email}</strong></span>
                    {st.booking && <span> • Event: {st.booking.serviceName} ({st.booking.eventDate || 'Scheduled'})</span>}
                  </div>

                  {/* URL Display / Edit */}
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <input
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://youtube.com/live/... or https://vimeo.com/..."
                        style={{
                          width: '380px',
                          height: '34px',
                          backgroundColor: '#10110F',
                          border: '1px solid rgba(244, 241, 233, 0.2)',
                          borderRadius: '4px',
                          color: '#F4F1E9',
                          padding: '0 10px',
                          fontSize: '12px',
                        }}
                      />
                      <button
                        onClick={() => saveUrl(st.id)}
                        style={{
                          padding: '0 14px',
                          backgroundColor: '#D7FF3F',
                          color: '#10110F',
                          border: 'none',
                          borderRadius: '4px',
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          padding: '0 10px',
                          backgroundColor: 'transparent',
                          border: '1px solid rgba(244, 241, 233, 0.2)',
                          color: '#88907f',
                          borderRadius: '4px',
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#D7FF3F', fontFamily: 'ui-monospace, monospace' }}>
                        Stream URL: {st.streamUrl || 'Not configured yet'}
                      </span>
                      <button
                        onClick={() => {
                          setEditingId(st.id)
                          setUrlInput(st.streamUrl || '')
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#88907f',
                          fontSize: '10px',
                          fontFamily: 'ui-monospace, monospace',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        Edit URL
                      </button>
                    </div>
                  )}
                </div>

                {/* 1-Click Broadcast State Toggle */}
                <div>
                  <button
                    onClick={() => toggleStatus(st.id, st.status)}
                    disabled={updating}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: isLive ? 'rgba(255, 60, 60, 0.2)' : '#D7FF3F',
                      border: isLive ? '1px solid #ff4d4d' : 'none',
                      color: isLive ? '#ff6b6b' : '#10110F',
                      borderRadius: '4px',
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      cursor: updating ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>{isLive ? '■ Take Feed Offline' : '● ENGAGE TRANSMISSION (GO LIVE)'}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
