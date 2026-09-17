'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'

function PaymentCancelContent() {
  return (
    <div style={{ maxWidth: '500px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 180, 0, 0.1)',
        border: '2px solid #ffb400',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        margin: '0 auto 20px auto',
        color: '#ffb400',
      }}>
        ✕
      </div>

      <span style={{
        fontFamily: 'ui-monospace, monospace',
        fontSize: '11px',
        color: '#ffb400',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}>
        TRANSACTION INCOMPLETE
      </span>
      <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', margin: '6px 0 12px 0', color: '#F4F1E9' }}>
        Checkout Cancelled
      </h1>
      <p style={{ color: '#88907f', fontSize: '14px', lineHeight: 1.6, margin: '0 auto 28px auto' }}>
        No payment was captured. Your invoice remains active and can be paid at any time before your scheduled session date.
      </p>

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
          Return to Invoices & Retry ↗
        </Link>

        <Link
          href="/#contact"
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
          Contact Studio Coordinator
        </Link>
      </div>
    </div>
  )
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: '#88907f' }}>Loading...</div>}>
      <PaymentCancelContent />
    </Suspense>
  )
}
