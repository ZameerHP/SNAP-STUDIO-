import React from 'react'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function ClientLivestreamPage() {
  const session = await auth()
  const userId = session?.user?.id

  let livestreams: any[] = []
  if (userId) {
    livestreams = await db.livestream.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  const stream = livestreams[0]
  const isLive = stream?.status === 'LIVE'

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#D7FF3F', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          MULTI-CAMERA BROADCAST SUITE
        </span>
        <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', margin: '4px 0 0 0' }}>
          Live Event Broadcast Link
        </h1>
        <p style={{ color: '#88907f', fontSize: '13px', margin: '6px 0 0 0' }}>
          Low-latency encrypted multi-camera live stream feed with hardware broadcast switcher uplink.
        </p>
      </div>

      <div style={{
        backgroundColor: '#191C16',
        border: '1px solid rgba(244, 241, 233, 0.1)',
        borderRadius: '4px',
        padding: '36px',
        maxWidth: '850px',
      }}>
        {/* Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <span style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '11px',
            padding: '4px 12px',
            borderRadius: '999px',
            backgroundColor: isLive ? 'rgba(255, 60, 60, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${isLive ? 'rgba(255, 60, 60, 0.5)' : 'rgba(244, 241, 233, 0.1)'}`,
            color: isLive ? '#ff6b6b' : '#88907f',
            fontWeight: 700,
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isLive ? '#ff4d4d' : '#88907f',
              display: 'inline-block',
            }} />
            {isLive ? 'BROADCAST IS LIVE NOW' : 'BROADCAST IS CURRENTLY OFFLINE'}
          </span>

          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#88907f' }}>
            Multi-Camera ISO Pipeline • Up to 4K
          </span>
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 12px 0' }}>
          {stream?.title || 'Private Studio Broadcast Feed'}
        </h2>

        <p style={{ fontSize: '14px', color: '#dedad0', lineHeight: '1.6', margin: '0 0 28px 0' }}>
          {isLive
            ? 'The studio production rig has engaged transmission. Click the button below to connect to your private live stream.'
            : 'The studio production team activates this transmission link immediately when multi-camera broadcast coverage begins on event day. Check back at your scheduled production call time.'}
        </p>

        {/* Action button */}
        {stream?.streamUrl ? (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <a
              href={stream.streamUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '14px 28px',
                backgroundColor: isLive ? '#D7FF3F' : 'rgba(255, 255, 255, 0.08)',
                border: '1px solid',
                borderColor: isLive ? '#D7FF3F' : 'rgba(244, 241, 233, 0.2)',
                color: isLive ? '#10110F' : '#F4F1E9',
                borderRadius: '4px',
                textDecoration: 'none',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isLive ? 'Connect to Live Stream Feed ↗' : 'Open Configured Stream URL ↗'}
            </a>

            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f' }}>
              Target: {stream.streamUrl.slice(0, 45)}...
            </span>
          </div>
        ) : (
          <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '4px', border: '1px solid rgba(244, 241, 233, 0.08)' }}>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#88907f' }}>
              No custom stream link posted by the studio administrator yet. When transmission begins, the live link will automatically populate.
            </span>
          </div>
        )}

        {/* Technical Broadcast Specs */}
        <div style={{
          marginTop: '36px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(244, 241, 233, 0.08)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
        }}>
          <div>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#88907f', display: 'block', textTransform: 'uppercase' }}>
              VIDEO RESOLUTION
            </span>
            <strong style={{ fontSize: '13px', color: '#F4F1E9' }}>4K UHD / 1080p60</strong>
          </div>
          <div>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#88907f', display: 'block', textTransform: 'uppercase' }}>
              AUDIO PIPELINE
            </span>
            <strong style={{ fontSize: '13px', color: '#F4F1E9' }}>Direct Soundboard + Wireless</strong>
          </div>
          <div>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#88907f', display: 'block', textTransform: 'uppercase' }}>
              CELLULAR BONDING
            </span>
            <strong style={{ fontSize: '13px', color: '#D7FF3F' }}>Redundant Uplink Active</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
