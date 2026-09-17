'use client'

import React, { useState, useEffect } from 'react'

interface PortfolioItem {
  id: string
  title: string
  type: string
  category: string
  client: string | null
  year: string | null
  image: string
  camera: string | null
  lens: string | null
  lighting: string | null
  brief: string | null
  stats: string | null
  sortOrder: number
}

export default function AdminPortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  // Add Item State
  const [title, setTitle] = useState('')
  const [type, setType] = useState('Portrait & Studio')
  const [category, setCategory] = useState('Photography')
  const [image, setImage] = useState('')
  const [camera, setCamera] = useState('Sony 8K System')
  const [brief, setBrief] = useState('')

  async function loadPortfolio() {
    try {
      const res = await fetch('/api/portfolio')
      const data = await res.json()
      if (data.success) {
        setItems(data.items)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPortfolio()
  }, [])

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !image) return

    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type,
          category,
          image,
          camera,
          brief,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowAdd(false)
        setTitle('')
        setImage('')
        setBrief('')
        loadPortfolio()
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm('Are you sure you want to remove this project from the showcase?')) return

    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id))
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
            SHOWCASE CURATION
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', margin: '4px 0 0 0' }}>
            Selected Productions Portfolio Manager
          </h1>
          <p style={{ color: '#88907f', fontSize: '13px', margin: '6px 0 0 0' }}>
            Upload real shoot photographs and client project case studies to replace placeholders on the public website.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
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
          {showAdd ? 'Cancel Project' : '+ Add Showcase Project'}
        </button>
      </div>

      {/* Add Project Form */}
      {showAdd && (
        <form
          onSubmit={handleAddItem}
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
              Project Title *
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Editorial Fashion Spotlight"
              style={{ width: '100%', height: '40px', backgroundColor: '#10110F', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', marginBottom: '6px' }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', height: '40px', backgroundColor: '#10110F', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box' }}
            >
              <option value="Photography">Photography</option>
              <option value="Film">Film</option>
              <option value="Live Broadcast">Live Broadcast</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', marginBottom: '6px' }}>
              Image URL *
            </label>
            <input
              required
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              style={{ width: '100%', height: '40px', backgroundColor: '#10110F', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', marginBottom: '6px' }}>
              Genre / Subtitle
            </label>
            <input
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="e.g. Portrait & Studio"
              style={{ width: '100%', height: '40px', backgroundColor: '#10110F', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', marginBottom: '6px' }}>
              Camera & Glass Spec
            </label>
            <input
              value={camera}
              onChange={(e) => setCamera(e.target.value)}
              placeholder="e.g. Sony 8K Cinema Rig / 85mm f/1.4"
              style={{ width: '100%', height: '40px', backgroundColor: '#10110F', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="submit"
              style={{ width: '100%', height: '40px', backgroundColor: '#D7FF3F', color: '#10110F', border: 'none', borderRadius: '4px', fontFamily: 'ui-monospace, monospace', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Publish to Showcase ↗
            </button>
          </div>

          <div style={{ gridColumn: 'span 3' }}>
            <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', marginBottom: '6px' }}>
              Creative Brief / Production Notes
            </label>
            <input
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Brief description of aesthetic, lighting setup, and color grade..."
              style={{ width: '100%', height: '40px', backgroundColor: '#10110F', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
        </form>
      )}

      {/* Portfolio Grid */}
      {loading ? (
        <p style={{ color: '#88907f', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
          Querying public archive items...
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: '#191C16',
                border: '1px solid rgba(244, 241, 233, 0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ height: '220px', position: 'relative' }}>
                <img
                  src={item.image}
                  alt={item.title}
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
                  {item.category}
                </span>
              </div>

              <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>{item.title}</h3>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', display: 'block', marginBottom: '8px' }}>
                    {item.type} • {item.camera || '8K System'}
                  </span>
                  {item.brief && (
                    <p style={{ fontSize: '12px', color: '#dedad0', margin: 0, lineHeight: '1.45' }}>
                      {item.brief}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(244, 241, 233, 0.08)' }}>
                  <span style={{ fontSize: '10px', color: '#D7FF3F', fontFamily: 'ui-monospace, monospace' }}>
                    ● Active on Public Site
                  </span>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff6b6b',
                      fontSize: '11px',
                      fontFamily: 'ui-monospace, monospace',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
