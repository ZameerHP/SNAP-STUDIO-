'use client'

import React, { useState, useEffect } from 'react'

interface MediaItem {
  id: string
  title: string | null
  url: string
  thumbnailUrl: string | null
  type: string
  isDownloadable: boolean
}

interface Gallery {
  id: string
  title: string
  description: string | null
  accessCode: string | null
  media: MediaItem[]
}

export default function ClientGalleryPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [favoriteFrames, setFavoriteFrames] = useState<string[]>([])
  const [activePreview, setActivePreview] = useState<MediaItem | null>(null)

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

  useEffect(() => {
    loadGalleries()
  }, [])

  function toggleFavorite(id: string) {
    setFavoriteFrames((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#D7FF3F', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            VAULT ASSET DELIVERY
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', margin: '4px 0 0 0' }}>
            Private Proofing & Deliverables Vault
          </h1>
          <p style={{ color: '#88907f', fontSize: '13px', margin: '6px 0 0 0' }}>
            Full-resolution master plates, color-graded stills, and proof contact sheets scoped exclusively to your account.
          </p>
        </div>

        <div style={{
          backgroundColor: '#191C16',
          border: '1px solid rgba(215, 255, 63, 0.3)',
          borderRadius: '4px',
          padding: '8px 16px',
          fontFamily: 'ui-monospace, monospace',
          fontSize: '11px',
          color: '#D7FF3F',
          textAlign: 'right',
        }}>
          <span>★ {favoriteFrames.length} Frames Selected for Retouch</span>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#88907f', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
          Decrypting personal media vault...
        </p>
      ) : galleries.length === 0 ? (
        <div style={{
          backgroundColor: '#191C16',
          border: '1px solid rgba(244, 241, 233, 0.1)',
          borderRadius: '4px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>No Media Uploaded Yet</h3>
          <p style={{ color: '#88907f', fontSize: '13px', margin: 0 }}>
            Following your production shoot, raw contact sheets and master retouched assets will be uploaded directly to this private space.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
          {galleries.map((gal) => (
            <div
              key={gal.id}
              style={{
                backgroundColor: '#191C16',
                border: '1px solid rgba(244, 241, 233, 0.1)',
                borderRadius: '4px',
                padding: '28px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 4px 0' }}>{gal.title}</h2>
                  {gal.description && <p style={{ fontSize: '13px', color: '#88907f', margin: 0 }}>{gal.description}</p>}
                </div>
                {gal.accessCode && (
                  <span style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '10px',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(244, 241, 233, 0.15)',
                    color: '#dedad0',
                  }}>
                    VAULT CODE: {gal.accessCode}
                  </span>
                )}
              </div>

              {/* Media Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {gal.media.map((item) => {
                  const isFav = favoriteFrames.includes(item.id)
                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: '#10110F',
                        border: isFav ? '1px solid #D7FF3F' : '1px solid rgba(244, 241, 233, 0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'border-color 0.2s ease',
                      }}
                    >
                      <div
                        onClick={() => setActivePreview(item)}
                        style={{ height: '220px', position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
                      >
                        <img
                          src={item.url}
                          alt={item.title || 'Studio Deliverable'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <span style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: '9px',
                          backgroundColor: 'rgba(16, 17, 15, 0.85)',
                          border: '1px solid rgba(244, 241, 233, 0.2)',
                          color: '#D7FF3F',
                          padding: '2px 8px',
                          borderRadius: '999px',
                        }}>
                          {item.type}
                        </span>
                      </div>

                      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#F4F1E9' }}>
                          {item.title || 'Master Production Frame'}
                        </span>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <button
                            onClick={() => toggleFavorite(item.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              border: isFav ? '1px solid #D7FF3F' : '1px solid rgba(244, 241, 233, 0.15)',
                              backgroundColor: isFav ? 'rgba(215, 255, 63, 0.15)' : 'transparent',
                              color: isFav ? '#D7FF3F' : '#dedad0',
                              fontFamily: 'ui-monospace, monospace',
                              fontSize: '10px',
                              cursor: 'pointer',
                            }}
                          >
                            {isFav ? '★ Favorited' : '☆ Select Frame'}
                          </button>

                          {item.isDownloadable && (
                            <a
                              href={item.url}
                              download
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontFamily: 'ui-monospace, monospace',
                                fontSize: '10px',
                                color: '#D7FF3F',
                                textDecoration: 'none',
                                textTransform: 'uppercase',
                              }}
                            >
                              Download ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {activePreview && (
        <div
          onClick={() => setActivePreview(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 11, 9, 0.94)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px',
          }}
        >
          <img
            src={activePreview.url}
            alt={activePreview.title || 'Preview'}
            style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: '4px' }}
          />
          <div style={{ marginTop: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ color: '#F4F1E9', fontSize: '14px', fontWeight: 600 }}>
              {activePreview.title || 'Studio Master'}
            </span>
            <a
              href={activePreview.url}
              download
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '6px 14px',
                backgroundColor: '#D7FF3F',
                color: '#10110F',
                borderRadius: '4px',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '11px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Download Full Res ↗
            </a>
            <button
              onClick={() => setActivePreview(null)}
              style={{
                padding: '6px 14px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(244, 241, 233, 0.2)',
                color: '#F4F1E9',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
