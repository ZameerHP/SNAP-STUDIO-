'use client'

import React, { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/portal'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      })

      if (res?.error) {
        setError('Invalid credentials. Please verify your email and password.')
        setLoading(false)
      } else {
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()

        if (session?.user?.role === 'ADMIN') {
          router.push(callbackUrl.startsWith('/admin') ? callbackUrl : '/admin')
        } else {
          router.push(callbackUrl.startsWith('/portal') ? callbackUrl : '/portal')
        }
        router.refresh()
      }
    } catch (err: any) {
      setError('An error occurred during authentication. Please try again.')
      setLoading(false)
    }
  }

  function fillAdminDemo() {
    setEmail('supersnapstudio@gmail.com')
    setPassword('AdminPassword2026!')
    setError(null)
  }

  function fillClientDemo() {
    setEmail('client@example.com')
    setPassword('ClientPassword2026!')
    setError(null)
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '460px',
      background: '#191C16',
      border: '1px solid rgba(244, 241, 233, 0.12)',
      borderRadius: '4px',
      padding: '40px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
      zIndex: 10,
    }}>
      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <span style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: '#D7FF3F',
          display: 'inline-block',
          marginBottom: '8px',
        }}>
          AUTHENTICATED VAULT ACCESS
        </span>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 900,
          letterSpacing: '-0.05em',
          margin: '0 0 8px 0',
          lineHeight: 1.1,
        }}>
          SUPER SNAP <span style={{ color: '#D7FF3F' }}>PORTAL</span>
        </h1>
        <p style={{
          fontSize: '13px',
          color: '#88907f',
          margin: 0,
          lineHeight: 1.5,
        }}>
          Access private client proofing sheets, contracts, invoices, and studio operations console.
        </p>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(255, 60, 60, 0.1)',
          border: '1px solid rgba(255, 60, 60, 0.3)',
          borderRadius: '4px',
          color: '#ff6b6b',
          fontSize: '12px',
          marginBottom: '20px',
          lineHeight: 1.4,
        }}>
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. client@example.com"
            style={{
              width: '100%',
              height: '46px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(244, 241, 233, 0.15)',
              borderRadius: '4px',
              color: '#F4F1E9',
              padding: '0 14px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
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
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            style={{
              width: '100%',
              height: '46px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(244, 241, 233, 0.15)',
              borderRadius: '4px',
              color: '#F4F1E9',
              padding: '0 14px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            height: '48px',
            background: '#D7FF3F',
            color: '#10110F',
            border: 'none',
            borderRadius: '4px',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
            marginTop: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          {loading ? 'Authenticating...' : 'Enter Studio Vault ↗'}
        </button>
      </form>

      {/* Demo Credentials Helper */}
      <div style={{
        marginTop: '28px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(244, 241, 233, 0.1)',
      }}>
        <span style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: '9px',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: '#88907f',
          display: 'block',
          marginBottom: '10px',
          textAlign: 'center',
        }}>
          Quick Fill Demo Profiles:
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            onClick={fillAdminDemo}
            style={{
              padding: '8px 10px',
              background: 'rgba(215, 255, 63, 0.08)',
              border: '1px solid rgba(215, 255, 63, 0.25)',
              borderRadius: '4px',
              color: '#D7FF3F',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '10px',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Studio Admin
          </button>
          <button
            type="button"
            onClick={fillClientDemo}
            style={{
              padding: '8px 10px',
              background: 'rgba(244, 241, 233, 0.05)',
              border: '1px solid rgba(244, 241, 233, 0.15)',
              borderRadius: '4px',
              color: '#F4F1E9',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '10px',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Client Demo
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#10110F',
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
      <div style={{ position: 'absolute', top: '32px', left: '32px', zIndex: 20 }}>
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
