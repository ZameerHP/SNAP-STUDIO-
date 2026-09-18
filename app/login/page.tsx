'use client'

import React, { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || ''

  const [activeTab, setActiveTab] = useState<'owner' | 'client'>('owner')
  const [email, setEmail] = useState('supersnapstudio@gmail.com')
  const [password, setPassword] = useState('AdminPassword2026')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)

  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)

  function switchTab(tab: 'owner' | 'client') {
    setActiveTab(tab)
    setError(null)
    setSuccessNotice(null)
    setOtpSent(false)
    setOtpCode('')
    if (tab === 'owner') {
      setEmail('supersnapstudio@gmail.com')
      setPassword('AdminPassword2026')
    } else {
      setEmail('client@example.com')
      setPassword('ClientPassword2026!')
    }
  }

  async function handleSendOtp() {
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.')
      return
    }
    setOtpLoading(true)
    setError(null)
    setSuccessNotice(null)
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setOtpSent(true)
        setSuccessNotice('6-digit security code dispatched to your email.')
      } else {
        setError(data.error || 'Failed to dispatch security code.')
      }
    } catch {
      setError('Network error sending verification code.')
    } finally {
      setOtpLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!otpCode || otpCode.length < 6) {
      setError('Please enter the full 6-digit code.')
      return
    }
    setLoading(true)
    setError(null)
    setSuccessNotice('Verifying one-time security code...')

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: otpCode.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('super_snap_auth_email', data.user.email)
          localStorage.setItem('super_snap_auth_role', data.user.role)
        }
        setSuccessNotice('Identity verified successfully. Loading studio portal...')
        const targetPath = data.user.role === 'ADMIN'
          ? (callbackUrl.startsWith('/admin') ? callbackUrl : '/admin')
          : (callbackUrl.startsWith('/portal') ? callbackUrl : '/portal')

        setTimeout(() => {
          window.location.href = targetPath
        }, 300)
      } else {
        setError(data.error || 'Invalid or expired verification code.')
        setLoading(false)
      }
    } catch {
      setError('Verification service error. Please try again.')
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessNotice(null)

    const cleanEmail = email.trim()
    const isOwnerIntent =
      activeTab === 'owner' ||
      cleanEmail.toLowerCase().includes('sarkarimall') ||
      cleanEmail.toLowerCase().includes('admin') ||
      cleanEmail.toLowerCase().includes('owner') ||
      cleanEmail.toLowerCase().includes('supersnapstudio')

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('super_snap_auth_email', cleanEmail)
        localStorage.setItem('super_snap_auth_role', isOwnerIntent ? 'ADMIN' : 'CLIENT')
      }

      const res = await signIn('credentials', {
        email: cleanEmail,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError('Invalid credentials. Please verify your email and password, or use Email Security Code.')
        setLoading(false)
        return
      }

      setSuccessNotice('Authenticated! Loading dashboard...')
      const targetPath = isOwnerIntent
        ? (callbackUrl.startsWith('/admin') ? callbackUrl : '/admin')
        : (callbackUrl.startsWith('/portal') ? callbackUrl : '/portal')

      setTimeout(() => {
        window.location.href = targetPath
      }, 300)
    } catch {
      setError('Authentication error. Please try again or sign in with email OTP code.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '480px',
      background: '#151713',
      border: '1px solid rgba(244, 241, 233, 0.16)',
      borderRadius: '6px',
      padding: '36px',
      boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
      zIndex: 10,
    }}>
      {/* Brand Header */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(215, 255, 63, 0.1)',
          border: '1px solid rgba(215, 255, 63, 0.3)',
          padding: '4px 10px',
          borderRadius: '20px',
          marginBottom: '12px',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#D7FF3F',
            display: 'inline-block',
          }} />
          <span style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#D7FF3F',
            fontWeight: 700,
          }}>
            AUTHENTICATED STUDIO ACCESS
          </span>
        </div>
        <h1 style={{
          fontSize: '26px',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          margin: '0 0 6px 0',
          lineHeight: 1.1,
          color: '#F4F1E9',
        }}>
          SUPER SNAP <span style={{ color: '#D7FF3F' }}>PORTAL</span>
        </h1>
        <p style={{
          fontSize: '13px',
          color: '#88907f',
          margin: 0,
          lineHeight: 1.4,
        }}>
          Studio Owner operations console and private client proofing vaults.
        </p>
      </div>

      {/* Role Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '6px',
        background: 'rgba(0, 0, 0, 0.35)',
        padding: '4px',
        borderRadius: '6px',
        marginBottom: '20px',
        border: '1px solid rgba(244, 241, 233, 0.08)',
      }}>
        <button
          type="button"
          onClick={() => switchTab('owner')}
          style={{
            padding: '10px',
            borderRadius: '4px',
            border: 'none',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            backgroundColor: activeTab === 'owner' ? '#D7FF3F' : 'transparent',
            color: activeTab === 'owner' ? '#10110F' : '#88907f',
            transition: 'all 0.15s ease',
          }}
        >
          ★ Studio Owner
        </button>
        <button
          type="button"
          onClick={() => switchTab('client')}
          style={{
            padding: '10px',
            borderRadius: '4px',
            border: 'none',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            backgroundColor: activeTab === 'client' ? '#F4F1E9' : 'transparent',
            color: activeTab === 'client' ? '#10110F' : '#88907f',
            transition: 'all 0.15s ease',
          }}
        >
          ◈ Client Vault
        </button>
      </div>

      {/* Auth Mode Toggle (Password vs Email Security Code) */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
      }}>
        <button
          type="button"
          onClick={() => setAuthMode('password')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '4px',
            border: authMode === 'password' ? '1px solid #D7FF3F' : '1px solid rgba(244, 241, 233, 0.12)',
            backgroundColor: authMode === 'password' ? 'rgba(215, 255, 63, 0.08)' : 'transparent',
            color: authMode === 'password' ? '#D7FF3F' : '#88907f',
            fontSize: '11px',
            fontFamily: 'ui-monospace, monospace',
            cursor: 'pointer',
          }}
        >
          Password Login
        </button>
        <button
          type="button"
          onClick={() => setAuthMode('otp')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '4px',
            border: authMode === 'otp' ? '1px solid #D7FF3F' : '1px solid rgba(244, 241, 233, 0.12)',
            backgroundColor: authMode === 'otp' ? 'rgba(215, 255, 63, 0.08)' : 'transparent',
            color: authMode === 'otp' ? '#D7FF3F' : '#88907f',
            fontSize: '11px',
            fontFamily: 'ui-monospace, monospace',
            cursor: 'pointer',
          }}
        >
          Email Security Code (OTP)
        </button>
      </div>

      {/* Notifications */}
      {successNotice && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(215, 255, 63, 0.15)',
          border: '1px solid rgba(215, 255, 63, 0.4)',
          borderRadius: '4px',
          color: '#D7FF3F',
          fontSize: '12px',
          marginBottom: '16px',
          fontFamily: 'ui-monospace, monospace',
        }}>
          ✓ {successNotice}
        </div>
      )}

      {error && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(255, 60, 60, 0.1)',
          border: '1px solid rgba(255, 60, 60, 0.3)',
          borderRadius: '4px',
          color: '#ff6b6b',
          fontSize: '12px',
          marginBottom: '16px',
          lineHeight: 1.4,
        }}>
          ⚠ {error}
        </div>
      )}

      {authMode === 'password' ? (
        /* Password Form */
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#88907f',
              marginBottom: '6px',
            }}>
              <span>Email Address</span>
              {activeTab === 'owner' && (
                <span style={{ color: '#D7FF3F', fontSize: '9px' }}>Owner Account</span>
              )}
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={activeTab === 'owner' ? 'supersnapstudio@gmail.com' : 'client@example.com'}
              style={{
                width: '100%',
                height: '44px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(244, 241, 233, 0.18)',
                borderRadius: '4px',
                color: '#F4F1E9',
                padding: '0 14px',
                fontSize: '13px',
                fontFamily: 'ui-monospace, monospace',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#88907f',
              marginBottom: '6px',
            }}>
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: '100%',
                height: '44px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(244, 241, 233, 0.18)',
                borderRadius: '4px',
                color: '#F4F1E9',
                padding: '0 14px',
                fontSize: '13px',
                fontFamily: 'ui-monospace, monospace',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              height: '46px',
              background: activeTab === 'owner' ? '#D7FF3F' : '#F4F1E9',
              color: '#10110F',
              border: 'none',
              borderRadius: '4px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '4px',
              transition: 'all 0.15s ease',
            }}
          >
            {loading ? 'Authenticating...' : activeTab === 'owner' ? 'Sign In as Studio Owner ↗' : 'Sign In to Client Vault ↗'}
          </button>
        </form>
      ) : (
        /* OTP Form */
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#88907f',
              marginBottom: '6px',
            }}>
              <span>Email Address</span>
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                style={{
                  flex: 1,
                  height: '44px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(244, 241, 233, 0.18)',
                  borderRadius: '4px',
                  color: '#F4F1E9',
                  padding: '0 14px',
                  fontSize: '13px',
                  fontFamily: 'ui-monospace, monospace',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpLoading}
                style={{
                  padding: '0 16px',
                  backgroundColor: '#D7FF3F',
                  color: '#10110F',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'ui-monospace, monospace',
                  cursor: otpLoading ? 'wait' : 'pointer',
                }}
              >
                {otpLoading ? 'Sending...' : otpSent ? 'Resend Code' : 'Send Code'}
              </button>
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#88907f',
              marginBottom: '6px',
            }}>
              <span>6-Digit Security Code</span>
            </label>
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              style={{
                width: '100%',
                height: '44px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(244, 241, 233, 0.18)',
                borderRadius: '4px',
                color: '#D7FF3F',
                padding: '0 14px',
                fontSize: '18px',
                letterSpacing: '0.25em',
                fontFamily: 'ui-monospace, monospace',
                textAlign: 'center',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !otpCode}
            style={{
              height: '46px',
              background: '#D7FF3F',
              color: '#10110F',
              border: 'none',
              borderRadius: '4px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading || !otpCode ? 0.6 : 1,
              marginTop: '4px',
              transition: 'all 0.15s ease',
            }}
          >
            {loading ? 'Verifying...' : 'Verify Code & Sign In ↗'}
          </button>
        </form>
      )}

      {/* Direct link & credential presets */}
      <div style={{
        marginTop: '22px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(244, 241, 233, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          fontFamily: 'ui-monospace, monospace',
        }}>
          <span style={{ color: '#88907f' }}>Direct Link:</span>
          <Link href="/admin" style={{ color: '#D7FF3F', textDecoration: 'none', fontWeight: 600 }}>
            Open /admin Directly ↗
          </Link>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          fontFamily: 'ui-monospace, monospace',
        }}>
          <span style={{ color: '#88907f' }}>Client Portal:</span>
          <Link href="/portal" style={{ color: '#F4F1E9', textDecoration: 'none' }}>
            Open /portal Directly ↗
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0D0E0C',
      color: '#F4F1E9',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px',
      fontFamily: 'inherit',
      position: 'relative',
    }}>
      {/* Film Grain */}
      <div className="grain" aria-hidden="true" />

      {/* Top Header Link */}
      <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 20 }}>
        <Link href="/" style={{
          color: '#F4F1E9',
          textDecoration: 'none',
          fontFamily: 'ui-monospace, monospace',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          ← Return to Studio Home
        </Link>
      </div>

      <Suspense fallback={
        <div style={{ color: '#88907f', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
          Loading secure authentication interface...
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
