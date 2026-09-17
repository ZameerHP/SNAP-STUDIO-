'use client'

import React, { useState, useEffect } from 'react'

interface MediaItem {
  id: string
  title: string | null
  url: string
  type: string
  isDownloadable: boolean
}

interface Gallery {
  id: string
  title: string
  description: string | null
  accessCode: string | null
  createdAt: string
  user: {
    name: string | null
    email: string
  }
  media: MediaItem[]
}

export default function AdminGalleriesPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [clients, setClients] = useState<Array<{ id: string; name: string | null; email: string }>>([])

  // Form states
  const [selectedUserId, setSelectedUserId] = useState('')
  const [galleryTitle, setGalleryTitle] = useState('')
  const [galleryDesc, setGalleryDesc] = useState('')
  const [accessCode, setAccessCode] = useState('')

  // Add media state
  const [activeGalleryId, setActiveGalleryId] = useState<string | null>(null)
  const [mediaTitle, setMediaTitle] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaType, setMediaType] = useState('PHOTO')
  const [isDownloadable, setIsDownloadable] = useState(true)

  async function loadGalleries() {
    try {
      const res = await fetch('/api/galleries')
      const data = await res.json()
      if (data.success) {
        setGalleries(data.galleries)
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
    loadGalleries()
    loadClients()
  }, [])

  async function handleCreateGallery(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUserId || !galleryTitle) return

    try {
      const res = await fetch('/api/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          title: galleryTitle,
          description: galleryDesc,
          accessCode: accessCode || 'SNAP2026',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowCreate(false)
        setGalleryTitle('')
        setGalleryDesc('')
        setAccessCode('')
        loadGalleries()
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function handleAddMedia(galleryId: string, e: React.FormEvent) {
    e.preventDefault()
    if (!mediaUrl) return

    try {
      const res = await fetch(`/api/galleries/${galleryId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: mediaTitle,
          url: mediaUrl,
          type: mediaType,
          isDownloadable,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMediaTitle('')
        setMediaUrl('')
        setActiveGalleryId(null)
        loadGalleries()
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
            PRIVATE ASSET PIPELINE
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', margin: '4px 0 0 0' }}>
            Client Proofing Vaults & Media Deliveries
          </h1>
          <p style={{ color: '#88907f', fontSize: '13px', margin: '6px 0 0 0' }}>
            Organize client proof sheets, upload high-resolution plates, and manage download authorization.
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
          {showCreate ? 'Cancel Vault' : '+ Create Client Vault'}
        </button>
      </div>

      {/* New Gallery Form */}
      {showCreate && (
        <form
          onSubmit={handleCreateGallery}
          style={{
            backgroundColor: '#191C16',
            border: '1px solid #D7FF3F',
            borderRadius: '4px',
            padding: '24px',
            marginBottom: '32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}
        >
          <div>
            <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', marginBottom: '6px' }}>
              Select Client *
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
              Vault Title *
            </label>
            <input
              required
              value={galleryTitle}
              onChange={(e) => setGalleryTitle(e.target.value)}
              placeholder="e.g. Master Portrait Proof Sheet"
              style={{ width: '100%', height: '40px', backgroundColor: '#10110F', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', marginBottom: '6px' }}>
              Access Code
            </label>
            <input
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="e.g. SNAP2026"
              style={{ width: '100%', height: '40px', backgroundColor: '#10110F', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', marginBottom: '6px' }}>
              Description
            </label>
            <input
              value={galleryDesc}
              onChange={(e) => setGalleryDesc(e.target.value)}
              placeholder="Shoot location, lighting specs, or retouching notes..."
              style={{ width: '100%', height: '40px', backgroundColor: '#10110F', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="submit"
              style={{ width: '100%', height: '40px', backgroundColor: '#D7FF3F', color: '#10110F', border: 'none', borderRadius: '4px', fontFamily: 'ui-monospace, monospace', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Launch Vault ↗
            </button>
          </div>
        </form>
      )}

      {/* Galleries List */}
      {loading ? (
        <p style={{ color: '#88907f', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
          Querying encrypted media vaults...
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {galleries.map((gal) => (
            <div
              key={gal.id}
              style={{
                backgroundColor: '#191C16',
                border: '1px solid rgba(244, 241, 233, 0.1)',
                borderRadius: '4px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{gal.title}</h2>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#D7FF3F', backgroundColor: 'rgba(215, 255, 63, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                      CODE: {gal.accessCode || 'UNLOCKED'}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#88907f' }}>
                    Client: {gal.user?.name || gal.user?.email} • Created: {new Date(gal.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <button
                  onClick={() => setActiveGalleryId(activeGalleryId === gal.id ? null : gal.id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'rgba(215, 255, 63, 0.1)',
                    border: '1px solid rgba(215, 255, 63, 0.3)',
                    color: '#D7FF3F',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'ui-monospace, monospace',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  + Add Media Deliverable
                </button>
              </div>

              {/* Add Media Sub-Form */}
              {activeGalleryId === gal.id && (
                <form
                  onSubmit={(e) => handleAddMedia(gal.id, e)}
                  style={{
                    backgroundColor: '#10110F',
                    border: '1px solid rgba(215, 255, 63, 0.3)',
                    borderRadius: '4px',
                    padding: '20px',
                    margin: '16px 0',
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 2fr 1fr auto',
                    gap: '12px',
                    alignItems: 'flex-end',
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#88907f', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Frame Title
                    </label>
                    <input
                      value={mediaTitle}
                      onChange={(e) => setMediaTitle(e.target.value)}
                      placeholder="e.g. Master Frame 01 (Retouched)"
                      style={{ width: '100%', height: '36px', backgroundColor: '#191C16', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 10px', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#88907f', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Image / Video URL *
                    </label>
                    <input
                      required
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://... (Cloud storage / Unsplash / S3 link)"
                      style={{ width: '100%', height: '36px', backgroundColor: '#191C16', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 10px', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#88907f', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Type
                    </label>
                    <select
                      value={mediaType}
                      onChange={(e) => setMediaType(e.target.value)}
                      style={{ width: '100%', height: '36px', backgroundColor: '#191C16', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 8px', fontSize: '12px' }}
                    >
                      <option value="PHOTO">PHOTO</option>
                      <option value="VIDEO">VIDEO</option>
                      <option value="DOCUMENT">DOCUMENT</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    style={{ height: '36px', padding: '0 16px', backgroundColor: '#D7FF3F', color: '#10110F', border: 'none', borderRadius: '4px', fontFamily: 'ui-monospace, monospace', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    Upload ↗
                  </button>
                </form>
              )}

              {/* Media Thumbnails */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginTop: '12px' }}>
                {gal.media.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: '#10110F',
                      border: '1px solid rgba(244, 241, 233, 0.08)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={item.url}
                      alt={item.title || 'Deliverable'}
                      style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                    />
                    <div style={{ padding: '8px', fontSize: '11px' }}>
                      <span style={{ color: '#F4F1E9', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title || 'Frame'}
                      </span>
                      <span style={{ color: '#88907f', fontSize: '9px', fontFamily: 'ui-monospace, monospace' }}>
                        {item.type} • {item.isDownloadable ? 'Downloadable' : 'View Only'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
