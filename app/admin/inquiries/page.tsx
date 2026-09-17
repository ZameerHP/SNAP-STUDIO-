'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

interface Inquiry {
  id: string
  name: string
  email: string
  phone: string | null
  serviceType?: string | null
  service?: string | null
  budget: string | null
  location: string | null
  date: string | null
  message: string
  status: string
  adminNotes: string | null
  createdAt: string
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [adminNoteInput, setAdminNoteInput] = useState('')
  const [updating, setUpdating] = useState(false)

  async function loadInquiries() {
    try {
      const res = await fetch('/api/inquiries')
      const data = await res.json()
      if (data.success) {
        setInquiries(data.inquiries)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInquiries()
  }, [])

  useEffect(() => {
    if (selectedInquiry) {
      setAdminNoteInput(selectedInquiry.adminNotes || '')
    }
  }, [selectedInquiry])

  async function updateStatus(id: string, newStatus: string) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setInquiries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        )
        if (selectedInquiry?.id === id) {
          setSelectedInquiry((prev) => prev ? { ...prev, status: newStatus } : null)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  async function saveNotes(id: string) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: adminNoteInput }),
      })
      const data = await res.json()
      if (data.success) {
        setInquiries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, adminNotes: adminNoteInput } : item))
        )
        if (selectedInquiry?.id === id) {
          setSelectedInquiry((prev) => prev ? { ...prev, adminNotes: adminNoteInput } : null)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  async function deleteInquiry(id: string) {
    if (!confirm('Are you sure you want to delete this inquiry?')) return
    try {
      const res = await fetch(`/api/inquiries/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setInquiries((prev) => prev.filter((item) => item.id !== id))
        if (selectedInquiry?.id === id) setSelectedInquiry(null)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const filtered = inquiries.filter((inq) => {
    if (filter === 'ALL') return true
    return inq.status?.toUpperCase() === filter.toUpperCase()
  })

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#D7FF3F', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            SUPER SNAP OPS — INCOMING LEADS
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', margin: '4px 0 0 0' }}>
            Inquiries & Leads
          </h1>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'NEW', 'CONTACTED', 'BOOKED', 'CLOSED'].map((st) => (
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
              {st} ({inquiries.filter((i) => st === 'ALL' || i.status === st).length})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#88907f', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
          Accessing studio inquiry records...
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedInquiry ? '1.2fr 1fr' : '1fr', gap: '24px' }}>
          {/* Table / List */}
          <div style={{
            backgroundColor: '#191C16',
            border: '1px solid rgba(244, 241, 233, 0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#88907f', fontSize: '13px' }}>
                No inquiries matching filter: {filter}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filtered.map((inq) => {
                  const isSelected = selectedInquiry?.id === inq.id
                  return (
                    <div
                      key={inq.id}
                      onClick={() => setSelectedInquiry(inq)}
                      style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid rgba(244, 241, 233, 0.06)',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'rgba(215, 255, 63, 0.05)' : 'transparent',
                        borderLeft: isSelected ? '3px solid #D7FF3F' : '3px solid transparent',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div>
                          <strong style={{ fontSize: '14px', color: '#F4F1E9', marginRight: '10px' }}>{inq.name}</strong>
                          <span style={{
                            fontFamily: 'ui-monospace, monospace',
                            fontSize: '9px',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: inq.status === 'NEW' ? 'rgba(215, 255, 63, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                            color: inq.status === 'NEW' ? '#D7FF3F' : '#88907f',
                            textTransform: 'uppercase',
                          }}>
                            {inq.status}
                          </span>
                        </div>
                        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f' }}>
                          {new Date(inq.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#D7FF3F', marginBottom: '6px', fontFamily: 'ui-monospace, monospace' }}>
                        <span>Service: {inq.serviceType || inq.service || 'Commercial Shoot'}</span>
                        {inq.budget && <span>• {inq.budget}</span>}
                      </div>

                      <p style={{
                        fontSize: '12px',
                        color: '#88907f',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {inq.message}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Inquiry Detail Drawer */}
          {selectedInquiry && (
            <div style={{
              backgroundColor: '#191C16',
              border: '1px solid rgba(244, 241, 233, 0.1)',
              borderRadius: '4px',
              padding: '24px',
              height: 'fit-content',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#D7FF3F', textTransform: 'uppercase' }}>
                    INQUIRY SPECIFICATIONS
                  </span>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0 0 0' }}>
                    {selectedInquiry.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedInquiry(null)}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(244, 241, 233, 0.15)',
                    borderRadius: '4px',
                    color: '#88907f',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontSize: '11px',
                  }}
                >
                  ✕ Close
                </button>
              </div>

              {/* Status Update Actions */}
              <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(244, 241, 233, 0.08)' }}>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', display: 'block', marginBottom: '8px' }}>
                  UPDATE STATUS:
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['new', 'contacted', 'booked', 'closed'].map((st) => (
                    <button
                      key={st}
                      disabled={updating}
                      onClick={() => updateStatus(selectedInquiry.id, st)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: '1px solid',
                        borderColor: selectedInquiry.status?.toLowerCase() === st.toLowerCase() ? '#D7FF3F' : 'rgba(244, 241, 233, 0.1)',
                        backgroundColor: selectedInquiry.status?.toLowerCase() === st.toLowerCase() ? '#D7FF3F' : 'transparent',
                        color: selectedInquiry.status?.toLowerCase() === st.toLowerCase() ? '#10110F' : '#F4F1E9',
                        fontSize: '9px',
                        fontFamily: 'ui-monospace, monospace',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Information */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#88907f', display: 'block' }}>
                    EMAIL ADDRESS
                  </span>
                  <a href={`mailto:${selectedInquiry.email}`} style={{ color: '#D7FF3F', fontSize: '13px', textDecoration: 'none' }}>
                    {selectedInquiry.email} ↗
                  </a>
                </div>

                {selectedInquiry.phone && (
                  <div>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#88907f', display: 'block' }}>
                      PHONE / MOBILE
                    </span>
                    <a href={`tel:${selectedInquiry.phone}`} style={{ color: '#D7FF3F', fontSize: '13px', textDecoration: 'none' }}>
                      {selectedInquiry.phone} ↗
                    </a>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#88907f', display: 'block' }}>
                      SERVICE CATEGORY
                    </span>
                    <strong style={{ fontSize: '12px', color: '#F4F1E9' }}>{selectedInquiry.service}</strong>
                  </div>
                  <div>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#88907f', display: 'block' }}>
                      ESTIMATED BUDGET
                    </span>
                    <strong style={{ fontSize: '12px', color: '#F4F1E9' }}>{selectedInquiry.budget || 'Unspecified'}</strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#88907f', display: 'block' }}>
                      LOCATION
                    </span>
                    <span style={{ fontSize: '12px', color: '#F4F1E9' }}>{selectedInquiry.location || 'London / General'}</span>
                  </div>
                  <div>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#88907f', display: 'block' }}>
                      PREFERRED DATE
                    </span>
                    <span style={{ fontSize: '12px', color: '#F4F1E9' }}>{selectedInquiry.date || 'Flexible'}</span>
                  </div>
                </div>
              </div>

              {/* Creative Brief Message */}
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#88907f', display: 'block', marginBottom: '6px' }}>
                  CREATIVE BRIEF / MESSAGE:
                </span>
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(244, 241, 233, 0.08)',
                  borderRadius: '4px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: '#F4F1E9',
                  whiteSpace: 'pre-wrap',
                }}>
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Internal Admin Notes */}
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#88907f', display: 'block', marginBottom: '6px' }}>
                  INTERNAL STUDIO NOTES:
                </span>
                <textarea
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="Add coordinator notes, quote details, or call logs..."
                  style={{
                    width: '100%',
                    minHeight: '70px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(244, 241, 233, 0.12)',
                    borderRadius: '4px',
                    color: '#F4F1E9',
                    padding: '10px',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    marginBottom: '8px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => saveNotes(selectedInquiry.id)}
                  disabled={updating}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#D7FF3F',
                    color: '#10110F',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontFamily: 'ui-monospace, monospace',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {updating ? 'Saving...' : 'Save Notes'}
                </button>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(244, 241, 233, 0.08)' }}>
                <a
                  href={`mailto:${selectedInquiry.email}?subject=Super%20Snap%20Studio%20—%20Your%20Production%20Inquiry`}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: 'rgba(215, 255, 63, 0.1)',
                    border: '1px solid #D7FF3F',
                    color: '#D7FF3F',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    fontSize: '11px',
                    fontFamily: 'ui-monospace, monospace',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  Reply via Email ↗
                </a>

                <button
                  onClick={() => deleteInquiry(selectedInquiry.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff6b6b',
                    fontSize: '11px',
                    fontFamily: 'ui-monospace, monospace',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  Delete Lead
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
