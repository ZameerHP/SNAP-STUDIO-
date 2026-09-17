'use client'

import React, { useState, useEffect } from 'react'

interface Contract {
  id: string
  title: string
  content: string
  status: string
  signedAt: string | null
  createdAt: string
  user: {
    name: string | null
    email: string
  }
  signatures?: Array<{
    fullName: string
    signedAt: string
    ipAddress: string | null
  }>
}

export default function AdminContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [clients, setClients] = useState<Array<{ id: string; name: string | null; email: string }>>([])

  const [selectedUserId, setSelectedUserId] = useState('')
  const [contractTitle, setContractTitle] = useState('')
  const [contractContent, setContractContent] = useState('')

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

  async function loadClients() {
    try {
      const res = await fetch('/api/bookings')
      const data = await res.json()
      if (data.success) {
        const uniqueClients: Record<string, any> = {}
        data.bookings.forEach((b: any) => {
          if (b.user) uniqueClients[b.user.id || b.userId] = b.user
        })
        setClients(Object.values(uniqueClients))
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadContracts()
    loadClients()
  }, [])

  async function handleCreateContract(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUserId || !contractTitle || !contractContent) return

    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          title: contractTitle,
          content: contractContent,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowCreate(false)
        setContractTitle('')
        setContractContent('')
        loadContracts()
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#D7FF3F', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            LEGAL COMPLIANCE
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', margin: '4px 0 0 0' }}>
            Production Agreements & E-Signatures
          </h1>
          <p style={{ color: '#88907f', fontSize: '13px', margin: '6px 0 0 0' }}>
            Issue legal production contracts and inspect authenticated cryptographic signature audit trails.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            padding: '10px 18px',
            backgroundColor: '#D7FF3F',
            color: '#10110F',
            borderRadius: '4px',
            border: 'none',
            fontSize: '11px',
            fontFamily: 'ui-monospace, monospace',
            fontWeight: 700,
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {showCreate ? 'Cancel Agreement' : '+ Draft New Agreement'}
        </button>
      </div>

      {/* New Contract Form */}
      {showCreate && (
        <form
          onSubmit={handleCreateContract}
          style={{
            backgroundColor: '#191C16',
            border: '1px solid #D7FF3F',
            borderRadius: '4px',
            padding: '24px',
            marginBottom: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', marginBottom: '6px' }}>
                Client Account *
              </label>
              <select
                required
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{ width: '100%', height: '40px', backgroundColor: '#10110F', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 12px', fontSize: '13px' }}
              >
                <option value="">-- Choose Client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.email} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', marginBottom: '6px' }}>
                Contract Agreement Title *
              </label>
              <input
                required
                value={contractTitle}
                onChange={(e) => setContractTitle(e.target.value)}
                placeholder="e.g. Master Media Production & Model Release"
                style={{ width: '100%', height: '40px', backgroundColor: '#10110F', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', marginBottom: '6px' }}>
              Full Contract Legal Content & Terms *
            </label>
            <textarea
              required
              value={contractContent}
              onChange={(e) => setContractContent(e.target.value)}
              placeholder="Paste complete production terms, copyright license, and payment milestones..."
              style={{ width: '100%', minHeight: '140px', backgroundColor: '#10110F', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '12px', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            style={{ width: 'fit-content', padding: '10px 24px', backgroundColor: '#D7FF3F', color: '#10110F', border: 'none', borderRadius: '4px', fontFamily: 'ui-monospace, monospace', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Dispatch Contract for E-Signature ↗
          </button>
        </form>
      )}

      {/* Contracts List */}
      {loading ? (
        <p style={{ color: '#88907f', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
          Loading legal ledger records...
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {contracts.map((c) => {
            const isSigned = c.status === 'SIGNED'

            return (
              <div
                key={c.id}
                style={{
                  backgroundColor: '#191C16',
                  border: '1px solid rgba(244, 241, 233, 0.1)',
                  borderRadius: '4px',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '18px', color: '#F4F1E9' }}>{c.title}</strong>
                      <span style={{
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: '9px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor: isSigned ? 'rgba(215, 255, 63, 0.15)' : 'rgba(255, 80, 80, 0.15)',
                        color: isSigned ? '#D7FF3F' : '#ff8080',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                      }}>
                        {isSigned ? '✓ SIGNED' : 'PENDING CLIENT E-SIGN'}
                      </span>
                    </div>

                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#88907f' }}>
                      Client: {c.user?.name || c.user?.email} • Issued: {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {isSigned && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#D7FF3F', display: 'block' }}>
                        VERIFIED AUDIT LOG:
                      </span>
                      <span style={{ fontSize: '12px', color: '#F4F1E9' }}>
                        Signed by: <strong>{c.signatures?.[0]?.fullName}</strong>
                      </span>
                      <span style={{ fontSize: '10px', color: '#88907f', display: 'block' }}>
                        {new Date(c.signedAt || Date.now()).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{
                  backgroundColor: '#10110F',
                  borderRadius: '4px',
                  padding: '16px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  fontSize: '12px',
                  color: '#dedad0',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                }}>
                  {c.content}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
