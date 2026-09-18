'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [adminEmail, setAdminEmail] = React.useState('supersnapstudio@gmail.com')

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('super_snap_auth_email')
      if (stored) {
        setAdminEmail(stored)
      }
    } catch {}

    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.email) {
          setAdminEmail(data.user.email)
          try {
            localStorage.setItem('super_snap_auth_email', data.user.email)
          } catch {}
        }
      })
      .catch(() => {})
  }, [])

  const navItems = [
    { label: 'Studio Overview', href: '/admin', icon: '◈' },
    { label: 'Inquiries & Leads', href: '/admin/inquiries', icon: '✉' },
    { label: 'Services & Pricing', href: '/admin/services', icon: '🏷' },
    { label: 'Bookings & Shoots', href: '/admin/bookings', icon: '📅' },
    { label: 'Availability & Hours', href: '/admin/availability', icon: '⏰' },
    { label: 'Invoices & Billing', href: '/admin/invoices', icon: '📄' },
    { label: 'Contracts & E-Sign', href: '/admin/contracts', icon: '✒' },
    { label: 'Client Proofing Vaults', href: '/admin/galleries', icon: '🖼' },
    { label: 'Livestream Broadcast Links', href: '/admin/livestreams', icon: '🔴' },
    { label: 'Portfolio Showcase', href: '/admin/portfolio', icon: '★' },
    { label: 'Passport Photo Utility', href: '/admin/passport-tool', icon: '✂' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#0B0C0A', color: '#F4F1E9' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        backgroundColor: '#10110F',
        borderRight: '1px solid rgba(244, 241, 233, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        flexShrink: 0,
      }}>
        <div>
          {/* Brand Header */}
          <div style={{ padding: '0 8px 24px 8px', borderBottom: '1px solid rgba(244, 241, 233, 0.08)' }}>
            <Link href="/" style={{ textDecoration: 'none', color: '#F4F1E9' }}>
              <span style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '-0.05em', display: 'block' }}>
                SUPER SNAP <span style={{ color: '#D7FF3F' }}>OPS</span>
              </span>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#88907f', letterSpacing: '0.1em' }}>
                LONDON, ON • ADMIN PLATFORM
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '20px' }}>
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: active ? 700 : 500,
                    textDecoration: 'none',
                    color: active ? '#10110F' : '#F4F1E9',
                    backgroundColor: active ? '#D7FF3F' : 'transparent',
                    fontFamily: 'ui-monospace, monospace',
                    letterSpacing: '0.04em',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User Badge & Signout */}
        <div style={{
          padding: '16px 12px',
          borderTop: '1px solid rgba(244, 241, 233, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#D7FF3F', display: 'block' }}>
              ● STUDIO DIRECTOR (ADMIN)
            </span>
            <span style={{ fontSize: '12px', color: '#F4F1E9', fontWeight: 600 }}>
              {adminEmail}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" style={{
              fontSize: '10px',
              fontFamily: 'ui-monospace, monospace',
              color: '#88907f',
              textDecoration: 'none',
            }}>
              View Public Site ↗
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              style={{
                background: 'none',
                border: 'none',
                color: '#ff6b6b',
                fontSize: '10px',
                fontFamily: 'ui-monospace, monospace',
                cursor: 'pointer',
                padding: 0,
                textTransform: 'uppercase',
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main style={{ flex: 1, padding: '36px 40px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
