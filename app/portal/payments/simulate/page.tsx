'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SimulatePaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const invoiceId = searchParams.get('invoiceId') || ''
  const invoiceNumber = searchParams.get('invoiceNumber') || 'INV-2026'
  const title = searchParams.get('title') || 'Studio Production Retainer'
  const amount = searchParams.get('amount') || '100.00'
  const errorParam = searchParams.get('error')

  const [loading, setLoading] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'square_pay' | 'cash_app' | 'apple_pay'>('square_pay')
  const [showDevGuide, setShowDevGuide] = useState(false)

  const handleSimulatePayment = async () => {
    if (!invoiceId) return
    setLoading(true)

    try {
      const res = await fetch('/api/payments/square/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          method: selectedMethod === 'cash_app' ? 'Cash App Pay (Square)' : selectedMethod === 'apple_pay' ? 'Apple Pay (Square)' : 'Square Pay',
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        router.push(`/portal/payments/success?invoiceId=${encodeURIComponent(invoiceId)}&invoiceNumber=${encodeURIComponent(invoiceNumber)}&amount=${amount}&method=${encodeURIComponent(data.method)}`)
      } else {
        alert(data.error || 'Failed to simulate payment')
      }
    } catch (err: any) {
      alert(err.message || 'Payment simulation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '580px', margin: '40px auto', padding: '0 20px' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '999px',
          backgroundColor: 'rgba(215, 255, 63, 0.1)',
          border: '1px solid rgba(215, 255, 63, 0.25)',
          color: '#D7FF3F',
          fontSize: '11px',
          fontFamily: 'ui-monospace, monospace',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}>
          <span>⬛ SQUARE CHECKOUT</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>SANDBOX / TEST MODE</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 6px 0', color: '#F4F1E9' }}>
          Secure Checkout
        </h1>
        <p style={{ color: '#88907f', fontSize: '13px', margin: 0 }}>
          Super Snap Studio • London, ON, Canada
        </p>
      </div>

      {errorParam && (
        <div style={{
          backgroundColor: 'rgba(255, 180, 0, 0.1)',
          border: '1px solid rgba(255, 180, 0, 0.3)',
          padding: '14px 18px',
          borderRadius: '6px',
          marginBottom: '20px',
          fontSize: '12px',
          color: '#ffb400',
        }}>
          <strong>Square Notice:</strong> {errorParam}. Showing Sandbox simulation checkout.
        </div>
      )}

      {/* Invoice Summary Box */}
      <div style={{
        backgroundColor: '#191C16',
        border: '1px solid rgba(244, 241, 233, 0.12)',
        borderRadius: '6px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase' }}>
              STATEMENT REFERENCE
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#F4F1E9' }}>{invoiceNumber}</div>
            <div style={{ fontSize: '13px', color: '#88907f', marginTop: '2px' }}>{title}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase' }}>
              AMOUNT DUE
            </span>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#D7FF3F' }}>
              ${Number(amount).toFixed(2)} <span style={{ fontSize: '14px', fontWeight: 600 }}>CAD</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(244, 241, 233, 0.08)', paddingTop: '16px' }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
            SELECT SQUARE PAYMENT METHOD
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setSelectedMethod('square_pay')}
              style={{
                padding: '14px',
                borderRadius: '4px',
                border: selectedMethod === 'square_pay' ? '2px solid #D7FF3F' : '1px solid rgba(244, 241, 233, 0.1)',
                backgroundColor: selectedMethod === 'square_pay' ? 'rgba(215, 255, 63, 0.08)' : '#10110F',
                color: '#F4F1E9',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '13px', color: '#D7FF3F' }}>⬛ Square Pay</div>
              <div style={{ fontSize: '10px', color: '#88907f', marginTop: '4px' }}>Fast 1-click checkout</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('card')}
              style={{
                padding: '14px',
                borderRadius: '4px',
                border: selectedMethod === 'card' ? '2px solid #D7FF3F' : '1px solid rgba(244, 241, 233, 0.1)',
                backgroundColor: selectedMethod === 'card' ? 'rgba(215, 255, 63, 0.08)' : '#10110F',
                color: '#F4F1E9',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '13px' }}>💳 Credit / Debit</div>
              <div style={{ fontSize: '10px', color: '#88907f', marginTop: '4px' }}>Visa, Mastercard, Amex</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('cash_app')}
              style={{
                padding: '14px',
                borderRadius: '4px',
                border: selectedMethod === 'cash_app' ? '2px solid #D7FF3F' : '1px solid rgba(244, 241, 233, 0.1)',
                backgroundColor: selectedMethod === 'cash_app' ? 'rgba(215, 255, 63, 0.08)' : '#10110F',
                color: '#F4F1E9',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '13px', color: '#00D632' }}>🟩 Cash App Pay</div>
              <div style={{ fontSize: '10px', color: '#88907f', marginTop: '4px' }}>Square mobile app scan</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('apple_pay')}
              style={{
                padding: '14px',
                borderRadius: '4px',
                border: selectedMethod === 'apple_pay' ? '2px solid #D7FF3F' : '1px solid rgba(244, 241, 233, 0.1)',
                backgroundColor: selectedMethod === 'apple_pay' ? 'rgba(215, 255, 63, 0.08)' : '#10110F',
                color: '#F4F1E9',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '13px' }}> Apple / G-Pay</div>
              <div style={{ fontSize: '10px', color: '#88907f', marginTop: '4px' }}>Native device wallet</div>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: '24px' }}>
          <button
            type="button"
            onClick={handleSimulatePayment}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#D7FF3F',
              color: '#10110F',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 800,
              fontSize: '13px',
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'Processing Payment...' : `Complete Payment of $${Number(amount).toFixed(2)} CAD`}
          </button>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <Link
            href="/portal/payments/cancel"
            style={{
              fontSize: '11px',
              color: '#88907f',
              textDecoration: 'none',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            ← Cancel and return to portal
          </Link>
        </div>
      </div>

      {/* Developer Square Credentials Instructions */}
      <div style={{
        backgroundColor: '#10110F',
        border: '1px solid rgba(244, 241, 233, 0.08)',
        borderRadius: '6px',
        padding: '18px 20px',
      }}>
        <button
          type="button"
          onClick={() => setShowDevGuide(!showDevGuide)}
          style={{
            background: 'none',
            border: 'none',
            color: '#88907f',
            cursor: 'pointer',
            fontSize: '11px',
            fontFamily: 'ui-monospace, monospace',
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            padding: 0,
            textAlign: 'left',
          }}
        >
          <span>⚙️ HOW TO CONNECT LIVE SQUARE APP ACCOUNT</span>
          <span>{showDevGuide ? '▲ HIDE' : '▼ SHOW'}</span>
        </button>

        {showDevGuide && (
          <div style={{ marginTop: '14px', fontSize: '12px', color: '#b0b6aa', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 8px 0' }}>
              To connect your real Square account for Canadian Dollar payments:
            </p>
            <ol style={{ paddingLeft: '18px', margin: '0 0 12px 0' }}>
              <li>Log in to the <a href="https://developer.squareup.com/apps" target="_blank" rel="noopener noreferrer" style={{ color: '#D7FF3F' }}>Square Developer Dashboard</a>.</li>
              <li>Create or select your App (e.g. <em>Super Snap Studio</em>).</li>
              <li>Copy your <strong>Access Token</strong> and <strong>Location ID</strong>.</li>
              <li>Open your project's <code>.env</code> file and update:
                <pre style={{ backgroundColor: '#191C16', padding: '10px', borderRadius: '4px', fontSize: '11px', margin: '8px 0', color: '#D7FF3F' }}>
{`SQUARE_ENVIRONMENT="production" # or "sandbox"
SQUARE_ACCESS_TOKEN="EAAA..."
SQUARE_LOCATION_ID="L..."`}
                </pre>
              </li>
            </ol>
            <p style={{ margin: 0, fontSize: '11px', color: '#88907f' }}>
              Once configured, the button above redirects directly to Square's hosted checkout page (<code>square.link</code>).
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SimulatePaymentPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: '#88907f' }}>Loading checkout gateway...</div>}>
      <SimulatePaymentContent />
    </Suspense>
  )
}
