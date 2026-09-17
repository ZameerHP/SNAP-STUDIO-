'use client'

import React, { useState } from 'react'

interface InvoiceActionsProps {
  invoiceId: string
  invoiceNumber: string
  balanceDue: number
  total: number
  title: string
}

export function InvoiceActions({
  invoiceId,
  invoiceNumber,
  balanceDue,
  total,
  title,
}: InvoiceActionsProps) {
  const [loading, setLoading] = useState(false)

  const handlePaySquare = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/payments/square/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      })

      const data = await res.json()
      if (res.ok && data.checkoutUrl) {
        // Redirect directly to Square Checkout
        window.location.href = data.checkoutUrl
      } else {
        alert(data.error || 'Unable to initiate Square checkout')
        setLoading(false)
      }
    } catch (err: any) {
      alert(err.message || 'Payment initiation failed')
      setLoading(false)
    }
  }

  const handlePrintStatement = () => {
    window.print()
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
      {balanceDue > 0 ? (
        <button
          type="button"
          onClick={handlePaySquare}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: '#D7FF3F',
            color: '#10110F',
            borderRadius: '4px',
            border: 'none',
            fontSize: '11px',
            fontFamily: 'ui-monospace, monospace',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.15s ease',
          }}
        >
          <span>⬛ PAY WITH SQUARE</span>
          <span style={{ opacity: 0.6 }}>•</span>
          <span>${balanceDue.toFixed(2)} CAD</span>
          {loading ? ' ⏳' : ' ↗'}
        </button>
      ) : (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          backgroundColor: 'rgba(215, 255, 63, 0.1)',
          border: '1px solid rgba(215, 255, 63, 0.25)',
          borderRadius: '999px',
          color: '#D7FF3F',
          fontSize: '11px',
          fontFamily: 'ui-monospace, monospace',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}>
          <span>✓ PAID IN FULL</span>
        </div>
      )}

      <button
        type="button"
        onClick={handlePrintStatement}
        style={{
          padding: '10px 18px',
          backgroundColor: 'transparent',
          border: '1px solid rgba(244, 241, 233, 0.2)',
          color: '#F4F1E9',
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: 'ui-monospace, monospace',
          cursor: 'pointer',
          textTransform: 'uppercase',
          fontWeight: 600,
          transition: 'border-color 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#D7FF3F')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(244, 241, 233, 0.2)')}
      >
        Export / Print PDF 📄
      </button>
    </div>
  )
}
