'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const invoiceNumber = searchParams.get('invoiceNumber') || 'INV-2026'
  const amount = searchParams.get('amount') || ''
  const method = searchParams.get('method') || 'Square Checkout'

  return (
    <div style={{ maxWidth: '540px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
      {/* Success Badge */}
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: 'rgba(215, 255, 63, 0.15)',
        border: '2px solid #D7FF3F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        margin: '0 auto 24px auto',
        color: '#D7FF3F',
      }}>
        ✓
      </div>

      <span style={{
        fontFamily: 'ui-monospace, monospace',
        fontSize: '11px',
        color: '#D7FF3F',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}>
        TRANSACTION CONFIRMED
      </span>
      <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.04em', margin: '6px 0 12px 0', color: '#F4F1E9' }}>
        Payment Received
      </h1>
      <p style={{ color: '#88907f', fontSize: '14px', lineHeight: 1.6, margin: '0 auto 32px auto' }}>
        Your payment has been successfully processed through Square and credited to your studio account statement.
      </p>

      {/* Receipt Card */}
      <div style={{
        backgroundColor: '#191C16',
        border: '1px solid rgba(244, 241, 233, 0.12)',
        borderRadius: '6px',
        padding: '24px',
        textAlign: 'left',
        marginBottom: '32px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(244, 241, 233, 0.08)',
          paddingBottom: '14px',
          marginBottom: '14px',
        }}>
          <span style={{ fontSize: '12px', color: '#88907f', fontFamily: 'ui-monospace, monospace' }}>STATEMENT ID</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#F4F1E9' }}>{invoiceNumber}</span>
        </div>

        {amount && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(244, 241, 233, 0.08)',
            paddingBottom: '14px',
            marginBottom: '14px',
          }}>
            <span style={{ fontSize: '12px', color: '#88907f', fontFamily: 'ui-monospace, monospace' }}>TOTAL PAID</span>
            <strong style={{ fontSize: '18px', color: '#D7FF3F', fontWeight: 900 }}>
              ${Number(amount).toFixed(2)} CAD
            </strong>
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(244, 241, 233, 0.08)',
          paddingBottom: '14px',
          marginBottom: '14px',
        }}>
          <span style={{ fontSize: '12px', color: '#88907f', fontFamily: 'ui-monospace, monospace' }}>GATEWAY</span>
          <span style={{ fontSize: '13px', color: '#F4F1E9' }}>⬛ {method}</span>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '12px', color: '#88907f', fontFamily: 'ui-monospace, monospace' }}>STATUS</span>
          <span style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '11px',
            padding: '3px 10px',
            borderRadius: '999px',
            backgroundColor: 'rgba(215, 255, 63, 0.15)',
            color: '#D7FF3F',
            fontWeight: 700,
          }}>
            PAID IN FULL
          </span>
        </div>
      </div>

      {/* Action Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Link
          href="/portal/invoices"
          style={{
            display: 'block',
            padding: '14px',
            backgroundColor: '#D7FF3F',
            color: '#10110F',
            borderRadius: '4px',
            fontWeight: 800,
            fontSize: '12px',
            fontFamily: 'ui-monospace, monospace',
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}
        >
          View Updated Invoices Statement →
        </Link>

        <Link
          href="/portal"
          style={{
            display: 'block',
            padding: '14px',
            backgroundColor: 'transparent',
            border: '1px solid rgba(244, 241, 233, 0.2)',
            color: '#F4F1E9',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'ui-monospace, monospace',
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}
        >
          Return to Client Portal
        </Link>
      </div>

      <p style={{ marginTop: '32px', fontSize: '11px', color: '#88907f', fontFamily: 'ui-monospace, monospace' }}>
        SUPER SNAP STUDIO • REGISTERED COMPANY IN CANADA • LONDON, ONTARIO
      </p>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: '#88907f' }}>Loading receipt...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
