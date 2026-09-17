'use client'

import React, { useState, useEffect } from 'react'

interface Package {
  id: string
  name: string
  description: string
  price: string
  duration: string | null
  features: string | null
}

interface Service {
  id: string
  name: string
  description: string
  category: string
  packages: Package[]
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingService, setCreatingService] = useState(false)
  const [newServiceName, setNewServiceName] = useState('')
  const [newServiceCategory, setNewServiceCategory] = useState('Photography')
  const [newServiceDesc, setNewServiceDesc] = useState('')

  // Package addition state
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null)
  const [pkgName, setPkgName] = useState('')
  const [pkgPrice, setPkgPrice] = useState('')
  const [pkgDuration, setPkgDuration] = useState('')
  const [pkgDesc, setPkgDesc] = useState('')

  async function loadServices() {
    try {
      const res = await fetch('/api/services')
      const data = await res.json()
      if (data.success) {
        setServices(data.services)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

  async function handleCreateService(e: React.FormEvent) {
    e.preventDefault()
    if (!newServiceName) return

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newServiceName,
          category: newServiceCategory,
          description: newServiceDesc,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setNewServiceName('')
        setNewServiceDesc('')
        setCreatingService(false)
        loadServices()
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function handleAddPackage(serviceId: string, e: React.FormEvent) {
    e.preventDefault()
    if (!pkgName || !pkgPrice) return

    try {
      const res = await fetch(`/api/services/${serviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pkgName,
          price: pkgPrice,
          duration: pkgDuration,
          description: pkgDesc,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setPkgName('')
        setPkgPrice('')
        setPkgDuration('')
        setPkgDesc('')
        setActiveServiceId(null)
        loadServices()
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function handleDeleteService(id: string) {
    if (!confirm('Are you sure you want to delete this service and all its packages?')) return
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== id))
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
            STUDIO RATE CARD MANAGER
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', margin: '4px 0 0 0' }}>
            Services, Packages & Pricing
          </h1>
          <p style={{ color: '#88907f', fontSize: '13px', margin: '6px 0 0 0' }}>
            Manage pricing tiers, package deliverables, and service categories displayed across the marketing site and booking console.
          </p>
        </div>

        <button
          onClick={() => setCreatingService(!creatingService)}
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
          {creatingService ? 'Cancel Service' : '+ Add New Service'}
        </button>
      </div>

      {/* New Service Form Drawer */}
      {creatingService && (
        <form
          onSubmit={handleCreateService}
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
              Service Name *
            </label>
            <input
              required
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              placeholder="e.g. Drone Aerial Cinema"
              style={{ width: '100%', height: '40px', backgroundColor: '#10110F', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', marginBottom: '6px' }}>
              Category
            </label>
            <select
              value={newServiceCategory}
              onChange={(e) => setNewServiceCategory(e.target.value)}
              style={{ width: '100%', height: '40px', backgroundColor: '#10110F', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box' }}
            >
              <option value="Photography">Photography</option>
              <option value="Videography">Videography</option>
              <option value="Live Broadcast">Live Broadcast</option>
              <option value="Biometric">Biometric</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="submit"
              style={{ width: '100%', height: '40px', backgroundColor: '#D7FF3F', color: '#10110F', border: 'none', borderRadius: '4px', fontFamily: 'ui-monospace, monospace', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Save Service ↗
            </button>
          </div>

          <div style={{ gridColumn: 'span 3' }}>
            <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              value={newServiceDesc}
              onChange={(e) => setNewServiceDesc(e.target.value)}
              placeholder="Detailed description of technical setup and deliverables..."
              style={{ width: '100%', minHeight: '60px', backgroundColor: '#10110F', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '10px 12px', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
        </form>
      )}

      {/* Services List */}
      {loading ? (
        <p style={{ color: '#88907f', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
          Loading rate card inventory...
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {services.map((srv) => (
            <div
              key={srv.id}
              style={{
                backgroundColor: '#191C16',
                border: '1px solid rgba(244, 241, 233, 0.1)',
                borderRadius: '4px',
                padding: '28px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{srv.name}</h2>
                    <span style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: '9px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(215, 255, 63, 0.12)',
                      color: '#D7FF3F',
                      textTransform: 'uppercase',
                    }}>
                      {srv.category}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#88907f', margin: 0, maxWidth: '650px' }}>
                    {srv.description}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setActiveServiceId(activeServiceId === srv.id ? null : srv.id)}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: 'rgba(215, 255, 63, 0.1)',
                      border: '1px solid rgba(215, 255, 63, 0.3)',
                      color: '#D7FF3F',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontFamily: 'ui-monospace, monospace',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    + Add Package
                  </button>
                  <button
                    onClick={() => handleDeleteService(srv.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255, 80, 80, 0.3)',
                      color: '#ff8080',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontFamily: 'ui-monospace, monospace',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Add Package Sub-Form */}
              {activeServiceId === srv.id && (
                <form
                  onSubmit={(e) => handleAddPackage(srv.id, e)}
                  style={{
                    backgroundColor: '#10110F',
                    border: '1px solid rgba(215, 255, 63, 0.3)',
                    borderRadius: '4px',
                    padding: '20px',
                    margin: '16px 0',
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1fr 1fr auto',
                    gap: '12px',
                    alignItems: 'flex-end',
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#88907f', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Package Name *
                    </label>
                    <input
                      required
                      value={pkgName}
                      onChange={(e) => setPkgName(e.target.value)}
                      placeholder="e.g. Full Day Commercial Shoot"
                      style={{ width: '100%', height: '36px', backgroundColor: '#191C16', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 10px', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#88907f', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Price *
                    </label>
                    <input
                      required
                      value={pkgPrice}
                      onChange={(e) => setPkgPrice(e.target.value)}
                      placeholder="e.g. $100 or Starting from $150"
                      style={{ width: '100%', height: '36px', backgroundColor: '#191C16', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 10px', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '9px', color: '#88907f', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Duration
                    </label>
                    <input
                      value={pkgDuration}
                      onChange={(e) => setPkgDuration(e.target.value)}
                      placeholder="e.g. 2 Hours"
                      style={{ width: '100%', height: '36px', backgroundColor: '#191C16', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 10px', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{ height: '36px', padding: '0 16px', backgroundColor: '#D7FF3F', color: '#10110F', border: 'none', borderRadius: '4px', fontFamily: 'ui-monospace, monospace', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    Save Package
                  </button>

                  <div style={{ gridColumn: 'span 4' }}>
                    <input
                      value={pkgDesc}
                      onChange={(e) => setPkgDesc(e.target.value)}
                      placeholder="Package deliverable details and inclusions..."
                      style={{ width: '100%', height: '36px', backgroundColor: '#191C16', border: '1px solid rgba(244, 241, 233, 0.15)', borderRadius: '4px', color: '#F4F1E9', padding: '0 10px', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>
                </form>
              )}

              {/* Packages Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
                {srv.packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    style={{
                      backgroundColor: '#10110F',
                      border: '1px solid rgba(244, 241, 233, 0.08)',
                      borderRadius: '4px',
                      padding: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '14px', color: '#F4F1E9' }}>{pkg.name}</strong>
                      <span style={{ fontSize: '18px', fontWeight: 900, color: '#D7FF3F' }}>{pkg.price}</span>
                    </div>
                    {pkg.duration && (
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', display: 'block', marginBottom: '6px' }}>
                        Session: {pkg.duration}
                      </span>
                    )}
                    <p style={{ fontSize: '12px', color: '#dedad0', margin: 0, lineHeight: '1.45' }}>
                      {pkg.description}
                    </p>
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
