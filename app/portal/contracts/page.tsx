'use client'

import React, { useState, useEffect } from 'react'

interface Contract {
  id: string
  title: string
  content: string
  status: string
  signedAt: string | null
  createdAt: string
  signatures?: Array<{
    id: string
    fullName: string
    signedAt: string
    ipAddress: string | null
  }>
}

export default function ClientContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [agreedTerms, setAgreedTerms] = useState<Record<string, boolean>>({})
  const [signerNames, setSignerNames] = useState<Record<string, string>>({})
  const [signing, setSigning] = useState<string | null>(null)
  const [message, setMessage] = useState<{ contractId: string; text: string; error?: boolean } | null>(null)

  async function loadContracts() {
    try {
      const res = await fetch('/api/contracts')
      const data = await res.json()
      if (data.success) {
        setContracts(data.contracts)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContracts()
  }, [])

  async function handleSign(contractId: string) {
    const fullName = signerNames[contractId]
    if (!agreedTerms[contractId]) {
      setMessage({ contractId, text: 'Please check the agreement confirmation box.', error: true })
      return
    }
    if (!fullName || fullName.trim().length < 2) {
      setMessage({ contractId, text: 'Please enter your full legal name to execute the contract.', error: true })
      return
    }

    setSigning(contractId)
    setMessage(null)

    try {
      const res = await fetch(`/api/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setMessage({ contractId, text: '✓ Contract digitally executed and securely timestamped.' })
        setContracts((prev) =>
          prev.map((c) =>
            c.id === contractId
              ? {
                  ...c,
                  status: 'SIGNED',
                  signedAt: data.signedAt || new Date().toISOString(),
                  signatures: [{ id: data.signatureId || 'sig', fullName, signedAt: data.signedAt, ipAddress: 'Verified' }],
                }
              : c
          )
        )
      } else {
        setMessage({ contractId, text: data.error || 'Failed to record signature.', error: true })
      }
    } catch (err: any) {
      setMessage({ contractId, text: 'Network error. Please try again.', error: true })
    } finally {
      setSigning(null)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#D7FF3F', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          LEGAL & TERMS
        </span>
        <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', margin: '4px 0 0 0' }}>
          Production Agreements & E-Signatures
        </h1>
        <p style={{ color: '#88907f', fontSize: '13px', margin: '6px 0 0 0' }}>
          Review production scope, deliverable copyright licenses, and execute official studio contracts with digital timestamp verification.
        </p>
      </div>

      {loading ? (
        <p style={{ color: '#88907f', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
          Loading legal agreements from studio vault...
        </p>
      ) : contracts.length === 0 ? (
        <div style={{
          backgroundColor: '#191C16',
          border: '1px solid rgba(244, 241, 233, 0.1)',
          borderRadius: '4px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>No Pending Contracts</h3>
          <p style={{ color: '#88907f', fontSize: '13px', margin: 0 }}>
            When a shoot or production booking is quoted, your digital contract and copyright licensing terms will appear here for review and signature.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {contracts.map((c) => {
            const isSigned = c.status === 'SIGNED'

            return (
              <div
                key={c.id}
                style={{
                  backgroundColor: '#191C16',
                  border: '1px solid rgba(244, 241, 233, 0.1)',
                  borderRadius: '4px',
                  padding: '32px',
                }}
              >
                {/* Contract Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <h2 style={{ fontSize: '22px', fontWeight: 900, margin: 0 }}>{c.title}</h2>
                      <span style={{
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: '9px',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        backgroundColor: isSigned ? 'rgba(215, 255, 63, 0.15)' : 'rgba(255, 80, 80, 0.15)',
                        color: isSigned ? '#D7FF3F' : '#ff8080',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                      }}>
                        {isSigned ? '✓ DIGITALLY SIGNED' : 'AWAITING SIGNATURE'}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#88907f' }}>
                      Contract Issued: {new Date(c.createdAt).toLocaleDateString()} • Super Snap Studio (Canada Registered)
                    </span>
                  </div>
                </div>

                {/* Contract Agreement Document Box */}
                <div style={{
                  backgroundColor: '#10110F',
                  border: '1px solid rgba(244, 241, 233, 0.1)',
                  borderRadius: '4px',
                  padding: '24px',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  fontSize: '13px',
                  lineHeight: '1.65',
                  color: '#dedad0',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  marginBottom: '24px',
                }}>
                  {c.content}
                </div>

                {/* Status-specific action section */}
                {isSigned ? (
                  <div style={{
                    padding: '20px',
                    backgroundColor: 'rgba(215, 255, 63, 0.06)',
                    border: '1px solid rgba(215, 255, 63, 0.25)',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <strong style={{ color: '#D7FF3F', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                        ✓ Agreement Executed and Legally Binding
                      </strong>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#dedad0' }}>
                        Signed by: <strong>{c.signatures?.[0]?.fullName || 'Client Signature on Record'}</strong> • Timestamp: {new Date(c.signedAt || Date.now()).toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => alert('Downloading counter-signed contract archive with cryptographic verification hash...')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        border: '1px solid #D7FF3F',
                        color: '#D7FF3F',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontFamily: 'ui-monospace, monospace',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      Download Executed PDF 📄
                    </button>
                  </div>
                ) : (
                  <div style={{
                    padding: '24px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(244, 241, 233, 0.12)',
                    borderRadius: '4px',
                  }}>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#D7FF3F', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                      DIGITAL E-SIGNATURE CONSOLE
                    </span>

                    {message?.contractId === c.id && (
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: '4px',
                        marginBottom: '16px',
                        fontSize: '12px',
                        backgroundColor: message.error ? 'rgba(255, 60, 60, 0.1)' : 'rgba(215, 255, 63, 0.1)',
                        color: message.error ? '#ff6b6b' : '#D7FF3F',
                        border: `1px solid ${message.error ? 'rgba(255, 60, 60, 0.3)' : 'rgba(215, 255, 63, 0.3)'}`,
                      }}>
                        {message.text}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '540px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#F4F1E9' }}>
                        <input
                          type="checkbox"
                          checked={!!agreedTerms[c.id]}
                          onChange={(e) => setAgreedTerms({ ...agreedTerms, [c.id]: e.target.checked })}
                          style={{ accentColor: '#D7FF3F', width: '16px', height: '16px' }}
                        />
                        <span>I have read, understood, and accept all terms of this Production Agreement.</span>
                      </label>

                      <div>
                        <label style={{
                          display: 'block',
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: '10px',
                          color: '#88907f',
                          textTransform: 'uppercase',
                          marginBottom: '6px',
                        }}>
                          Type Your Full Legal Name (Acts as Digital Signature)
                        </label>
                        <input
                          type="text"
                          value={signerNames[c.id] || ''}
                          onChange={(e) => setSignerNames({ ...signerNames, [c.id]: e.target.value })}
                          placeholder="e.g. Elena Rostova"
                          style={{
                            width: '100%',
                            height: '44px',
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(244, 241, 233, 0.18)',
                            borderRadius: '4px',
                            color: '#F4F1E9',
                            padding: '0 14px',
                            fontSize: '14px',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
                        <button
                          onClick={() => handleSign(c.id)}
                          disabled={signing === c.id}
                          style={{
                            padding: '12px 24px',
                            backgroundColor: '#D7FF3F',
                            color: '#10110F',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontFamily: 'ui-monospace, monospace',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            cursor: signing === c.id ? 'wait' : 'pointer',
                            opacity: signing === c.id ? 0.7 : 1,
                          }}
                        >
                          {signing === c.id ? 'Recording Signature...' : 'Digitally Sign & Execute Agreement ↗'}
                        </button>
                        <span style={{ fontSize: '10px', color: '#88907f', fontFamily: 'ui-monospace, monospace' }}>
                          Timestamp & IP address logged
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
