import React from 'react'
import Link from 'next/link'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  // Live database queries matching the exact Super Snap Ops spec — zero dummy data
  const [
    inquiryCount,
    newInquiriesCount,
    activeProductionsCount,
    invoicesIssuedCount,
    registeredClientsCount,
    recentInquiries,
  ] = await Promise.all([
    db.inquiry.count(),
    db.inquiry.count({ where: { status: 'new' } }),
    db.booking.count({ where: { status: { in: ['scheduled', 'in_progress'] } } }),
    db.invoice.count(),
    db.client.count(),
    db.inquiry.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#D7FF3F',
            display: 'block',
            marginBottom: '4px',
          }}>
            SUPER SNAP OPS — LIVE STUDIO CONSOLE
          </span>
          <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>
            Studio Overview
          </h1>
          <p style={{ color: '#88907f', fontSize: '13px', margin: '6px 0 0 0' }}>
            London, Ontario headquarters • Live queries against PostgreSQL/SQLite data layer.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            href="/admin/inquiries"
            style={{
              padding: '10px 18px',
              backgroundColor: '#D7FF3F',
              color: '#10110F',
              borderRadius: '4px',
              textDecoration: 'none',
              fontSize: '11px',
              fontFamily: 'ui-monospace, monospace',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Review Inquiries ({newInquiriesCount}) ↗
          </Link>
        </div>
      </div>

      {/* Metrics Row — Live count(*) queries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '36px' }}>
        <div style={{
          backgroundColor: '#191C16',
          border: '1px solid rgba(244, 241, 233, 0.1)',
          borderRadius: '4px',
          padding: '20px',
        }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase' }}>
            New Inquiries
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '32px', color: newInquiriesCount > 0 ? '#D7FF3F' : '#F4F1E9' }}>
              {newInquiriesCount}
            </strong>
            <span style={{ fontSize: '11px', color: '#88907f' }}>/ {inquiryCount} Total Leads</span>
          </div>
        </div>

        <div style={{
          backgroundColor: '#191C16',
          border: '1px solid rgba(244, 241, 233, 0.1)',
          borderRadius: '4px',
          padding: '20px',
        }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase' }}>
            Active Productions
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '32px', color: '#D7FF3F' }}>
              {activeProductionsCount}
            </strong>
            <span style={{ fontSize: '11px', color: '#88907f' }}>Scheduled / In Progress</span>
          </div>
        </div>

        <div style={{
          backgroundColor: '#191C16',
          border: '1px solid rgba(244, 241, 233, 0.1)',
          borderRadius: '4px',
          padding: '20px',
        }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase' }}>
            Invoices Issued
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '32px', color: '#D7FF3F' }}>
              {invoicesIssuedCount}
            </strong>
            <span style={{ fontSize: '11px', color: '#88907f' }}>Square Statements</span>
          </div>
        </div>

        <div style={{
          backgroundColor: '#191C16',
          border: '1px solid rgba(244, 241, 233, 0.1)',
          borderRadius: '4px',
          padding: '20px',
        }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase' }}>
            Registered Clients
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '32px', color: '#D7FF3F' }}>
              {registeredClientsCount}
            </strong>
            <span style={{ fontSize: '11px', color: '#88907f' }}>Client Accounts</span>
          </div>
        </div>
      </div>

      {/* Quick Ops Tools */}
      <div style={{
        backgroundColor: '#131512',
        border: '1px solid rgba(244, 241, 233, 0.1)',
        borderRadius: '4px',
        padding: '20px 24px',
        marginBottom: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
            Biometric Passport Photo Maker (Studio Tool)
          </h3>
          <p style={{ fontSize: '12px', color: '#88907f', margin: '4px 0 0 0' }}>
            Precision shadowless cropping and printable 4-up 4x6" sheet generator with official Canadian corporate certification.
          </p>
        </div>
        <Link
          href="/admin/passport-tool"
          style={{
            padding: '10px 18px',
            backgroundColor: 'transparent',
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
          Open Passport Tool ↗
        </Link>
      </div>

      {/* Recent Inquiries Block */}
      <div style={{
        backgroundColor: '#191C16',
        border: '1px solid rgba(244, 241, 233, 0.1)',
        borderRadius: '4px',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
            Recent Inquiries & Leads
          </h2>
          <Link
            href="/admin/inquiries"
            style={{
              fontSize: '11px',
              fontFamily: 'ui-monospace, monospace',
              color: '#D7FF3F',
              textDecoration: 'none',
            }}
          >
            View All ({inquiryCount}) →
          </Link>
        </div>

        {recentInquiries.length === 0 ? (
          <p style={{ color: '#88907f', fontSize: '13px' }}>
            No client inquiries received yet. Inquiries submitted via the website contact form will appear here in real-time.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentInquiries.map((inq) => (
              <div
                key={inq.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(244, 241, 233, 0.06)',
                  borderRadius: '4px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '14px', color: '#F4F1E9' }}>{inq.name}</strong>
                    <span style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: '9px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      backgroundColor: inq.status === 'new' ? 'rgba(215, 255, 63, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      color: inq.status === 'new' ? '#D7FF3F' : '#88907f',
                      textTransform: 'uppercase',
                    }}>
                      {inq.status}
                    </span>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f' }}>
                      {inq.serviceType || 'General Inbound'}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#88907f', margin: 0, maxWidth: '600px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {inq.message}
                  </p>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#D7FF3F', fontFamily: 'ui-monospace, monospace' }}>
                    {inq.email}
                  </span>
                  <span style={{ fontSize: '10px', color: '#88907f', fontFamily: 'ui-monospace, monospace' }}>
                    {new Date(inq.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
