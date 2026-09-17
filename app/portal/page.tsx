import React from 'react'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function ClientPortalDashboard() {
  const session = await auth()
  const userId = session?.user?.id

  // If user is found, query their private bookings, invoices, contracts, galleries, livestreams
  let clientBookings: any[] = []
  let clientInvoices: any[] = []
  let clientContracts: any[] = []
  let clientGalleries: any[] = []
  let clientLivestreams: any[] = []

  if (userId) {
    ;[clientBookings, clientInvoices, clientContracts, clientGalleries, clientLivestreams] = await Promise.all([
      db.booking.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      db.invoice.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      db.contract.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      db.gallery.findMany({ where: { userId }, include: { media: true }, orderBy: { createdAt: 'desc' } }),
      db.livestream.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    ])
  }

  // Fallback to demo client data if user logged in without seeded records
  const latestBooking = clientBookings[0]
  const latestInvoice = clientInvoices[0]
  const latestContract = clientContracts[0]
  const latestGallery = clientGalleries[0]
  const activeStream = clientLivestreams.find((s) => s.status === 'LIVE') || clientLivestreams[0]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <span style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: '#D7FF3F',
          display: 'block',
          marginBottom: '4px',
        }}>
          PRIVATE CLIENT OPERATIONS SUITE
        </span>
        <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>
          Welcome, {session?.user?.name || 'Valued Client'}
        </h1>
        <p style={{ color: '#88907f', fontSize: '13px', margin: '6px 0 0 0' }}>
          Your production deliverables, live broadcast links, proofing sheets, and billing console.
        </p>
      </div>

      {/* Primary Status Banner */}
      <div style={{
        backgroundColor: '#191C16',
        border: '1px solid rgba(244, 241, 233, 0.1)',
        borderRadius: '4px',
        padding: '28px',
        marginBottom: '32px',
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '32px',
        alignItems: 'center',
      }}>
        <div>
          <span style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '10px',
            color: '#D7FF3F',
            backgroundColor: 'rgba(215, 255, 63, 0.12)',
            padding: '4px 10px',
            borderRadius: '999px',
            display: 'inline-block',
            marginBottom: '12px',
          }}>
            CURRENT PRODUCTION STATUS
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 8px 0' }}>
            {latestBooking ? latestBooking.serviceName : 'No Active Booking Scheduled'}
          </h2>
          <p style={{ fontSize: '13px', color: '#88907f', margin: 0, lineHeight: 1.5 }}>
            {latestBooking ? (
              <>Package: <strong>{latestBooking.packageName}</strong> • Date: {latestBooking.eventDate} • Location: {latestBooking.location}</>
            ) : (
              'Submit a production reservation to schedule your shoot or request custom studio coverage.'
            )}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f' }}>
            PRODUCTION STAGE:
          </span>
          <strong style={{ fontSize: '16px', color: '#D7FF3F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {latestBooking ? latestBooking.status : 'AVAILABLE FOR BOOKING'}
          </strong>
          <Link
            href="/#contact"
            style={{
              fontSize: '11px',
              fontFamily: 'ui-monospace, monospace',
              color: '#F4F1E9',
              textDecoration: 'underline',
              marginTop: '4px',
            }}
          >
            Inquire about additional dates / revisions ↗
          </Link>
        </div>
      </div>

      {/* Grid of 4 Client Modules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {/* Module 1: Billing & Invoice */}
        <div style={{
          backgroundColor: '#191C16',
          border: '1px solid rgba(244, 241, 233, 0.1)',
          borderRadius: '4px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase' }}>
                INVOICE & PAYMENTS
              </span>
              {latestInvoice && (
                <span style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: '9px',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: latestInvoice.status === 'PAID' ? 'rgba(215, 255, 63, 0.15)' : 'rgba(255, 180, 0, 0.15)',
                  color: latestInvoice.status === 'PAID' ? '#D7FF3F' : '#ffb400',
                  textTransform: 'uppercase',
                }}>
                  {latestInvoice.status}
                </span>
              )}
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0' }}>
              {latestInvoice ? latestInvoice.invoiceNumber : 'No Outstanding Invoices'}
            </h3>
            <p style={{ fontSize: '13px', color: '#88907f', margin: '0 0 16px 0' }}>
              {latestInvoice ? (
                <>Total: <strong>${latestInvoice.total.toFixed(2)}</strong> • Paid: ${latestInvoice.amountPaid.toFixed(2)}</>
              ) : (
                'All accounts settled. New invoice statements appear here upon shoot confirmation.'
              )}
            </p>
          </div>

          <Link
            href="/portal/invoices"
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(244, 241, 233, 0.15)',
              borderRadius: '4px',
              color: '#F4F1E9',
              fontSize: '11px',
              fontFamily: 'ui-monospace, monospace',
              textDecoration: 'none',
              textAlign: 'center',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Review Invoice & Payment ↗
          </Link>
        </div>

        {/* Module 2: Contracts & E-Sign */}
        <div style={{
          backgroundColor: '#191C16',
          border: '1px solid rgba(244, 241, 233, 0.1)',
          borderRadius: '4px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase' }}>
                LEGAL AGREEMENT & E-SIGN
              </span>
              {latestContract && (
                <span style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: '9px',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: latestContract.status === 'SIGNED' ? 'rgba(215, 255, 63, 0.15)' : 'rgba(255, 80, 80, 0.15)',
                  color: latestContract.status === 'SIGNED' ? '#D7FF3F' : '#ff8080',
                  textTransform: 'uppercase',
                }}>
                  {latestContract.status}
                </span>
              )}
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0' }}>
              {latestContract ? latestContract.title : 'Production Agreement'}
            </h3>
            <p style={{ fontSize: '13px', color: '#88907f', margin: '0 0 16px 0' }}>
              {latestContract ? (
                latestContract.status === 'SIGNED'
                  ? `Signed digitally on ${new Date(latestContract.updatedAt).toLocaleDateString()}`
                  : 'Awaiting your digital e-signature to formalize studio session.'
              ) : (
                'Standard production agreements are generated when bookings are quoted.'
              )}
            </p>
          </div>

          <Link
            href="/portal/contracts"
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(244, 241, 233, 0.15)',
              borderRadius: '4px',
              color: '#F4F1E9',
              fontSize: '11px',
              fontFamily: 'ui-monospace, monospace',
              textDecoration: 'none',
              textAlign: 'center',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Inspect Agreement & E-Sign ↗
          </Link>
        </div>

        {/* Module 3: Private Photo Proofing Vault */}
        <div style={{
          backgroundColor: '#191C16',
          border: '1px solid rgba(244, 241, 233, 0.1)',
          borderRadius: '4px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
              PRIVATE PROOFING GALLERY
            </span>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0' }}>
              {latestGallery ? latestGallery.title : 'Master Proof Sheets'}
            </h3>
            <p style={{ fontSize: '13px', color: '#88907f', margin: '0 0 16px 0' }}>
              {latestGallery ? (
                <>{latestGallery.media?.length || 1} Deliverable Frame(s) available for online favoriting and download.</>
              ) : (
                'Your private encrypted proof sheet will appear here following the production session.'
              )}
            </p>
          </div>

          <Link
            href="/portal/gallery"
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(215, 255, 63, 0.1)',
              border: '1px solid #D7FF3F',
              borderRadius: '4px',
              color: '#D7FF3F',
              fontSize: '11px',
              fontFamily: 'ui-monospace, monospace',
              textDecoration: 'none',
              textAlign: 'center',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Access Secure Photo Vault ↗
          </Link>
        </div>

        {/* Module 4: Live Broadcast Feed */}
        <div style={{
          backgroundColor: '#191C16',
          border: '1px solid rgba(244, 241, 233, 0.1)',
          borderRadius: '4px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase' }}>
                LIVESTREAM BROADCAST
              </span>
              <span style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: '9px',
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: activeStream?.status === 'LIVE' ? 'rgba(255, 60, 60, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: activeStream?.status === 'LIVE' ? '#ff6b6b' : '#88907f',
                textTransform: 'uppercase',
              }}>
                {activeStream?.status === 'LIVE' ? '● ON AIR' : '○ OFFLINE'}
              </span>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0' }}>
              {activeStream ? activeStream.title : 'Live Event Stream'}
            </h3>
            <p style={{ fontSize: '13px', color: '#88907f', margin: '0 0 16px 0' }}>
              {activeStream?.status === 'LIVE'
                ? 'Broadcast is live right now. Click below to watch the encrypted studio feed.'
                : 'Studio broadcast links will activate here when your multi-camera stream goes live.'}
            </p>
          </div>

          <Link
            href="/portal/livestream"
            style={{
              padding: '10px 14px',
              backgroundColor: activeStream?.status === 'LIVE' ? '#D7FF3F' : 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(244, 241, 233, 0.15)',
              borderRadius: '4px',
              color: activeStream?.status === 'LIVE' ? '#10110F' : '#F4F1E9',
              fontSize: '11px',
              fontFamily: 'ui-monospace, monospace',
              textDecoration: 'none',
              textAlign: 'center',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {activeStream?.status === 'LIVE' ? 'Watch Stream Live Now ↗' : 'Check Stream Status ↗'}
          </Link>
        </div>
      </div>
    </div>
  )
}
