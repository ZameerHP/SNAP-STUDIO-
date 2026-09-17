import React from 'react'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { InvoiceActions } from './invoice-actions'

export const dynamic = 'force-dynamic'

export default async function ClientInvoicesPage() {
  const session = await auth()
  const userId = session?.user?.id

  let invoices: any[] = []
  if (userId) {
    invoices = await db.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { payments: true },
    })
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#D7FF3F', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          BILLING & STATEMENTS
        </span>
        <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', margin: '4px 0 0 0' }}>
          Invoices & Production Retainers
        </h1>
        <p style={{ color: '#88907f', fontSize: '13px', margin: '6px 0 0 0' }}>
          Official billing statements, deposit receipts, and payment transactions for your studio bookings.
        </p>
      </div>

      {invoices.length === 0 ? (
        <div style={{
          backgroundColor: '#191C16',
          border: '1px solid rgba(244, 241, 233, 0.1)',
          borderRadius: '4px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>No Invoices on Record</h3>
          <p style={{ color: '#88907f', fontSize: '13px', margin: '0 0 20px 0' }}>
            When a shoot or production package is confirmed by the studio coordinator, your invoice statement and payment portal will appear here.
          </p>
          <Link
            href="/#contact"
            style={{
              display: 'inline-block',
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
            Reserve a Shoot Session ↗
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {invoices.map((inv) => {
            let lineItems: any[] = []
            try {
              lineItems = JSON.parse(inv.lineItems)
            } catch (e) {
              lineItems = []
            }

            const balanceDue = Math.max(0, inv.total - inv.amountPaid)

            return (
              <div
                key={inv.id}
                style={{
                  backgroundColor: '#191C16',
                  border: '1px solid rgba(244, 241, 233, 0.1)',
                  borderRadius: '4px',
                  padding: '28px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>
                        {inv.invoiceNumber}
                      </h2>
                      <span style={{
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: '10px',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        backgroundColor: inv.status === 'PAID' ? 'rgba(215, 255, 63, 0.15)' : 'rgba(255, 180, 0, 0.15)',
                        color: inv.status === 'PAID' ? '#D7FF3F' : '#ffb400',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                      }}>
                        {inv.status}
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', color: '#F4F1E9' }}>{inv.title}</span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', display: 'block' }}>
                      TOTAL AMOUNT:
                    </span>
                    <strong style={{ fontSize: '26px', color: '#D7FF3F', fontWeight: 900 }}>
                      ${inv.total.toFixed(2)} CAD
                    </strong>
                  </div>
                </div>

                {/* Line Items Table */}
                <div style={{
                  borderTop: '1px solid rgba(244, 241, 233, 0.08)',
                  borderBottom: '1px solid rgba(244, 241, 233, 0.08)',
                  padding: '16px 0',
                  marginBottom: '20px',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr', gap: '16px', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', marginBottom: '8px' }}>
                    <span>Deliverable Description</span>
                    <span style={{ textAlign: 'center' }}>Qty</span>
                    <span style={{ textAlign: 'right' }}>Amount</span>
                  </div>

                  {lineItems.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '3fr 1fr 1fr',
                        gap: '16px',
                        fontSize: '13px',
                        color: '#F4F1E9',
                        padding: '6px 0',
                      }}
                    >
                      <span>{item.description}</span>
                      <span style={{ textAlign: 'center', color: '#88907f' }}>{item.quantity || 1}</span>
                      <span style={{ textAlign: 'right' }}>${Number(item.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Summary & Checkout Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '24px', fontSize: '12px', fontFamily: 'ui-monospace, monospace' }}>
                    <div>
                      <span style={{ color: '#88907f', display: 'block' }}>DEPOSIT PAID:</span>
                      <strong style={{ color: '#F4F1E9' }}>${inv.depositPaid.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#88907f', display: 'block' }}>REMAINING BALANCE:</span>
                      <strong style={{ color: balanceDue > 0 ? '#ffb400' : '#D7FF3F' }}>
                        ${balanceDue.toFixed(2)} CAD
                      </strong>
                    </div>
                  </div>

                  <InvoiceActions
                    invoiceId={inv.id}
                    invoiceNumber={inv.invoiceNumber}
                    balanceDue={balanceDue}
                    total={inv.total}
                    title={inv.title}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
