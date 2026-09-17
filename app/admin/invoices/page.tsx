'use client'

import React, { useState, useEffect } from 'react'

interface Invoice {
  id: string
  invoiceNumber: string
  title: string
  total: number
  depositRequired: number
  depositPaid: number
  amountPaid: number
  status: string
  createdAt: string
  user: {
    name: string | null
    email: string
  }
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [clients, setClients] = useState<Array<{ id: string; name: string | null; email: string }>>([])

  // New Invoice Form state
  const [selectedUserId, setSelectedUserId] = useState('')
  const [invoiceTitle, setInvoiceTitle] = useState('')
  const [itemDesc, setItemDesc] = useState('')
  const [itemAmount, setItemAmount] = useState('')
  const [depositAmount, setDepositAmount] = useState('')

  async function loadInvoices() {
    try {
      const res = await fetch('/api/invoices')
      const data = await res.json()
      if (data.success) {
        setInvoices(data.invoices)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function loadClients() {
    try {
      const res = await fetch('/api/bookings')
      const data = await res.json()
      if (data.success) {
        const uniqueClients: Record<string, any> = {}
        data.bookings.forEach((b: any) => {
          if (b.user) uniqueClients[b.user.id || b.userId] = b.user
        })
        setClients(Object.values(uniqueClients))
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadInvoices()
    loadClients()
  }, [])

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUserId || !invoiceTitle || !itemAmount) return

    const total = parseFloat(itemAmount)
    const lineItems = [{ description: itemDesc || invoiceTitle, amount: total, quantity: 1 }]

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          title: invoiceTitle,
          lineItems,
          total,
          depositRequired: depositAmount ? parseFloat(depositAmount) : 0,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowCreate(false)
        setInvoiceTitle('')
        setItemDesc('')
        setItemAmount('')
        setDepositAmount('')
        loadInvoices()
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function markPaid(id: string, total: number) {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID', amountPaid: total }),
      })
      const data = await res.json()
      if (data.success) {
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === id ? { ...inv, status: 'PAID', amountPaid: total } : inv))
        )
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function handleGetSquareLink(invoiceId: string) {
    try {
      const res = await fetch('/api/payments/square/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        const fullUrl = data.checkoutUrl.startsWith('http')
          ? data.checkoutUrl
          : `${window.location.origin}${data.checkoutUrl}`
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(fullUrl)
          alert(`Square Payment Link generated and copied to clipboard!\n\n${fullUrl}`)
        } else {
          prompt('Copy Square Payment Link:', fullUrl)
        }
      } else {
        alert(data.error || 'Failed to generate Square payment link')
      }
    } catch (e: any) {
      alert(e.message || 'Error generating link')
    }
  }

  const totalBilled = invoices.reduce((acc, i) => acc + i.total, 0)
  const totalCollected = invoices.reduce((acc, i) => acc + i.amountPaid, 0)
  const balanceOutstanding = Math.max(0, totalBilled - totalCollected)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#D7FF3F', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            ACCOUNTS & REVENUE
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', margin: '4px 0 0 0' }}>
            Invoices & Billing Console
          </h1>
          <p style={{ color: '#88907f', fontSize: '13px', margin: '6px 0 0 0' }}>
            Generate client invoices, track deposit payments, and manage studio receivable accounts.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            padding: '10px 18px',
            backgroundColor: '#D7FF3F',
            color: '#10110F',
            borderRadius: '4px',
            border: 'none',
            fontSize: '11px',
            fontFamily: 'ui-monospace, monospace',
            fontWeight: 700,
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {showCreate ? 'Cancel Invoice' : '+ Generate Invoice'}
        </button>
      </div>

      {/* Square Payment Integration Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 18px',
        backgroundColor: '#191C16',
        border: '1px solid rgba(215, 255, 63, 0.25)',
        borderRadius: '4px',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px' }}>⬛</span>
          <div>
            <strong style={{ fontSize: '12px', color: '#F4F1E9', display: 'block' }}>
              Square App & Online Payments Active
            </strong>
            <span style={{ fontSize: '11px', color: '#88907f' }}>
              Accepting Square Pay, Cash App Pay, Apple Pay, Google Pay & Credit/Debit Cards in CAD.
            </span>
          </div>
        </div>

        <span style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: '10px',
          padding: '3px 10px',
          borderRadius: '999px',
          backgroundColor: 'rgba(215, 255, 63, 0.15)',
          color: '#D7FF3F',
          fontWeight: 700,
        }}>
          ● GATEWAY READY
        </span>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#191C16', border: '1px solid rgba(244, 241, 233, 0.1)', borderRadius: '4px', padding: '18px' }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase' }}>
            Total Value Billed
          </span>
          <strong style={{ fontSize: '24px', color: '#F4F1E9', display: 'block', marginTop: '4px' }}>
            ${totalBilled.toFixed(2)} CAD
          </strong>
        </div>

        <div style={{ backgroundColor: '#191C16', border: '1px solid rgba(244, 241, 233, 0.1)', borderRadius: '4px', padding: '18px' }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase' }}>
            Revenue Collected
          </span>
          <strong style={{ fontSize: '24px', color: '#D7FF3F', display: 'block', marginTop: '4px' }}>
            ${totalCollected.toFixed(2)} CAD
          </strong>
        </div>

        <div style={{ backgroundColor: '#191C16', border: '1px solid rgba(244, 241, 233, 0.1)', borderRadius: '4px', padding: '18px' }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase' }}>
            Outstanding Balance Due
          </span>
          <strong style={{ fontSize: '24px', color: balanceOutstanding > 0 ? '#ffb400' : '#D7FF3F', display: 'block', marginTop: '4px' }}>
            ${balanceOutstanding.toFixed(2)} CAD
          </strong>
        </div>
      </div>

      {/* New Invoice Form */}
      {showCreate && (
        <form
          onSubmit={handleCreateInvoice}
          style={{
            backgroundColor: '#191C16',
            border: '1px solid #D7FF3F',
            borderRadius: '4px',
            padding: '24px',
            marginBottom: '32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}
        >
          <div>
            <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', marginBottom: '6px' }}>
              Select Client *
            </label>
            <select
              required
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{ width: '100%', height: '40px', backgroundColor: '#10110F', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 12px', fontSize: '13px' }}
            >
              <option value="">-- Choose Client Account --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.email} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', marginBottom: '6px' }}>
              Invoice Statement Title *
            </label>
            <input
              required
              value={invoiceTitle}
              onChange={(e) => setInvoiceTitle(e.target.value)}
              placeholder="e.g. Commercial Shoot Session Retainer"
              style={{ width: '100%', height: '40px', backgroundColor: '#10110F', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', marginBottom: '6px' }}>
              Total Amount ($ CAD) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={itemAmount}
              onChange={(e) => setItemAmount(e.target.value)}
              placeholder="e.g. 150.00"
              style={{ width: '100%', height: '40px', backgroundColor: '#10110F', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', marginBottom: '6px' }}>
              Item Deliverable Breakdown
            </label>
            <input
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              placeholder="e.g. 2 Hours on-location shoot + 10 retouched master plates"
              style={{ width: '100%', height: '40px', backgroundColor: '#10110F', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="submit"
              style={{ width: '100%', height: '40px', backgroundColor: '#D7FF3F', color: '#10110F', border: 'none', borderRadius: '4px', fontFamily: 'ui-monospace, monospace', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Issue Invoice ↗
            </button>
          </div>
        </form>
      )}

      {/* Invoice List */}
      {loading ? (
        <p style={{ color: '#88907f', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
          Querying ledger accounts...
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {invoices.map((inv) => {
            const balance = Math.max(0, inv.total - inv.amountPaid)
            const isPaid = inv.status === 'PAID'

            return (
              <div
                key={inv.id}
                style={{
                  backgroundColor: '#191C16',
                  border: '1px solid rgba(244, 241, 233, 0.1)',
                  borderRadius: '4px',
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '16px', color: '#F4F1E9' }}>{inv.invoiceNumber}</strong>
                    <span style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: '9px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      backgroundColor: isPaid ? 'rgba(215, 255, 63, 0.15)' : 'rgba(255, 180, 0, 0.15)',
                      color: isPaid ? '#D7FF3F' : '#ffb400',
                      textTransform: 'uppercase',
                    }}>
                      {inv.status}
                    </span>
                    <span style={{ fontSize: '13px', color: '#dedad0' }}>{inv.title}</span>
                  </div>

                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#88907f' }}>
                    Client: {inv.user?.name || inv.user?.email} • Date: {new Date(inv.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', display: 'block' }}>
                      TOTAL / BALANCE:
                    </span>
                    <strong style={{ fontSize: '16px', color: '#F4F1E9' }}>
                      ${inv.total.toFixed(2)} CAD
                    </strong>
                    {balance > 0 && (
                      <span style={{ fontSize: '11px', color: '#ffb400', display: 'block' }}>
                        Due: ${balance.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {!isPaid ? (
                      <>
                        <button
                          onClick={() => handleGetSquareLink(inv.id)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: 'transparent',
                            border: '1px solid rgba(215, 255, 63, 0.4)',
                            color: '#D7FF3F',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontFamily: 'ui-monospace, monospace',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                          }}
                          title="Generate Square payment link to send to client"
                        >
                          ⬛ Square Link ↗
                        </button>

                        <button
                          onClick={() => markPaid(inv.id, inv.total)}
                          style={{
                            padding: '8px 14px',
                            backgroundColor: '#D7FF3F',
                            color: '#10110F',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '10px',
                            fontFamily: 'ui-monospace, monospace',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                          }}
                        >
                          ✓ Mark as Paid
                        </button>
                      </>
                    ) : (
                      <span style={{ color: '#D7FF3F', fontSize: '12px', fontFamily: 'ui-monospace, monospace' }}>
                        ✓ Fully Settled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
