'use client'

import React, { FormEvent, useState, useRef, useEffect } from 'react'
import { useAnimations } from '@/hooks/use-animations'
import { useSmoothScroll } from '@/components/smooth-scroll-provider'

interface ProjectCaseStudy {
  id: string
  title: string
  type: string
  category: 'Photography' | 'Film' | 'Live Broadcast' | 'Commercial'
  client: string
  year: string
  image: string
  camera: string
  lens: string
  lighting: string
  brief: string
  deliverables: string[]
  stats: string
}

/* PLACEHOLDER — replace with real shoot photos and client data when available */
const projects: ProjectCaseStudy[] = [
  {
    id: 'maternity-session',
    title: 'Maternity Session',
    type: 'Portrait & Family',
    category: 'Photography',
    client: 'Family Portrait Session',
    year: '2025',
    /* PLACEHOLDER — replace with real shoot photo */
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=85',
    camera: 'Sony Full-Frame System (up to 8K)',
    lens: 'Prime Portrait Glass 50mm / 85mm',
    lighting: 'Soft Studio Octa & Ambient Natural Fill',
    brief: 'High-end maternity portraiture focusing on soft natural lighting, elegant silhouettes, and timeless composition.',
    deliverables: ['High-Resolution Master Retouched Plates', 'Print-Ready Archival Files', 'Private Online Client Proofing'],
    stats: 'Full-Resolution Master Gallery'
  },
  {
    id: 'real-estate-showcase',
    title: 'Real Estate & Architecture',
    type: 'Business & Real Estate',
    category: 'Commercial',
    client: 'Architectural Feature',
    year: '2025',
    /* PLACEHOLDER — replace with real shoot photo */
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=85',
    camera: 'Ultra-Wide High-Dynamic Range System',
    lens: '16-35mm Architectural Cine & Still Glass',
    lighting: 'Balanced Interior Strobe & Natural Exposure Bracketing',
    brief: 'Interior and exterior architectural capture highlighting spatial depth, ambient natural textures, and structural lines.',
    deliverables: ['Wide-Angle HDR Interior Frames', 'MLS & Print-Optimized Deliveries', 'Virtual Walkthrough Media'],
    stats: 'Ultra-Wide HDR Architecture'
  },
  {
    id: 'corporate-event',
    title: 'Corporate Event Coverage',
    type: 'Events & Celebrations',
    category: 'Commercial',
    client: 'Corporate Gathering',
    year: '2025',
    /* PLACEHOLDER — replace with real shoot photo */
    image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1400&q=85',
    camera: 'Dual Full-Frame Cinema & Still Rigs',
    lens: '24-70mm & 70-200mm Fast Zoom Suite',
    lighting: 'Low-Profile Bounce Flash & Natural Staging',
    brief: 'Comprehensive on-location documentation of keynote speakers, executive panels, and attendee engagements.',
    deliverables: ['Same-Day Press Selects', 'Full High-Resolution Event Archive', 'Social Media Delivery Cuts'],
    stats: 'Multi-Perspective Coverage'
  },
  {
    id: 'cinema-brand-spot',
    title: 'Brand & Commercial Film',
    type: 'Cinema Videography',
    category: 'Film',
    client: 'Brand Story',
    year: '2025',
    /* PLACEHOLDER — replace with real shoot photo */
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=85',
    camera: 'Cinema Camera Rig (Shoots up to 8K)',
    lens: 'Anamorphic & Fast Cine Primes',
    lighting: 'Continuous Studio Key & Edge Separation Rig',
    brief: 'Short-form commercial narrative combining dynamic camera movement with tailored DaVinci Resolve color grading.',
    deliverables: ['4K/8K Master Cinema Export', 'ProRes HQ Master Video Files', 'Vertical 9:16 Social Cutdowns'],
    stats: '8K Master Cinema Pipeline'
  },
  {
    id: 'live-stream-broadcast',
    title: 'Live Multi-Cam Broadcast',
    type: 'Multi-Camera Stream',
    category: 'Live Broadcast',
    client: 'Event Live Stream',
    year: '2025',
    /* PLACEHOLDER — replace with real shoot photo */
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=85',
    camera: 'Multi-Camera Switcher Setup with Tally Feeds',
    lens: 'Broadcast Cine Zoom Suite',
    lighting: 'Studio Stage Flood & Key Lighting',
    brief: 'Real-time multi-angle 4K/HD live stream broadcast with integrated motion graphics and redundant network uplinks.',
    deliverables: ['Live Ultra-Low Latency Broadcast Feed', 'Individual Camera ISO Master Recordings', 'Post-Event Master Archive'],
    stats: 'Zero-Drop Broadcast Setup'
  },
  {
    id: 'studio-headshots',
    title: 'Professional Headshots',
    type: 'Portrait & Corporate',
    category: 'Photography',
    client: 'Executive Portraiture',
    year: '2025',
    /* PLACEHOLDER — replace with real shoot photo */
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1400&q=85',
    camera: 'High-Resolution Sensor System',
    lens: '85mm f/1.4 Portrait Prime Glass',
    lighting: 'Three-Point Studio Beauty Dish & Reflector',
    brief: 'Sharp, confident personal branding and executive headshots with precision frequency-separation skin retouching.',
    deliverables: ['High-Res Retouched Commercial Plates', 'LinkedIn & Press-Optimized Croppings', 'Black & White Studio Variations'],
    stats: 'Precision Retouched Finishes'
  },
]

/* Starting From Rates — Entry-Level Pricing */
const startingRates = [
  {
    service: 'Photography',
    price: 'Starting from $100',
    details: 'Basic session coverage & initial high-resolution retouched master selects.',
    placeholderNote: '(EDITABLE PLACEHOLDER — customize package details)',
    targetService: 'Commercial Photography'
  },
  {
    service: 'Live Streaming',
    price: 'Starting from $120',
    details: 'Multi-camera broadcast setup with real-time switching & stream uplink.',
    placeholderNote: '(EDITABLE PLACEHOLDER — customize package details)',
    targetService: '4K Live Streaming'
  },
  {
    service: 'Videography',
    price: 'Starting from $150',
    details: 'High-definition video recording, dedicated audio & foundational master cut.',
    placeholderNote: '(EDITABLE PLACEHOLDER — customize package details)',
    targetService: 'Cinema Videography'
  },
]

/* Categorized Full Shoot-Type Directory */
const shootCategories = [
  {
    category: 'Portrait & Family',
    items: [
      'Maternity shoots',
      'Baby shower',
      'Newborn baby photoshoot',
      'Pre-wedding shoots',
      'Headshots / professional portraits',
    ],
  },
  {
    category: 'Business & Real Estate',
    items: [
      'Real estate photography',
      'Corporate events',
      'Headshots / professional portraits',
    ],
  },
  {
    category: 'Events & Celebrations',
    items: [
      'Birthday parties',
      'Corporate events',
    ],
  },
  {
    category: 'Documents & ID',
    items: [
      'Passport-size photos',
    ],
    highlight: 'Registered Company in Canada — Official Legal Eligibility'
  },
  {
    category: 'Custom / Any Occasion',
    items: [
      'Any type of photography, videography, or live streaming — open call-to-action for custom inquiries',
    ],
  },
]

const servicesData = [
  {
    number: '01',
    title: 'Commercial & Portrait Photography',
    subtitle: 'Maternity, newborn, family, headshots, real estate & corporate events.',
    deliverables: [
      'Tethered live review on calibrated reference displays',
      'Full in-house professional camera & lighting setup',
      'High-resolution magazine-grade retouching',
      'Private encrypted client gallery for fast image selection',
      'Fast turnaround options available for time-sensitive shoots',
    ],
    packages: [
      { name: 'Introductory Session', duration: 'Flexible Duration', price: 'Starting from $100', desc: 'Entry-level session coverage & initial retouched selects.' },
      { name: 'Comprehensive Production', duration: 'Half / Full Day', price: 'Custom Quote', desc: 'Complete multi-setup shoot with dedicated lighting director.' },
    ],
  },
  {
    number: '02',
    title: 'Cinema & Commercial Videography',
    subtitle: 'Brand films, corporate events, celebrations & cinematic highlights.',
    deliverables: [
      'Camera systems capturing up to 8K resolution',
      'Dedicated cinema microphones & 32-bit float audio',
      'DaVinci Resolve professional color science & grading',
      'Licensed soundtrack scoring & clean audio mastering',
      'Multi-aspect exports: 16:9 widescreen & 9:16 vertical reels',
    ],
    packages: [
      { name: 'Core Video Coverage', duration: 'Select Coverage', price: 'Starting from $150', desc: 'Single-setup high-definition capture & primary master edit.' },
      { name: 'Full Video Production', duration: 'Multi-Scene / Day', price: 'Custom Quote', desc: 'Cinematic video production with storyboard & sound design.' },
    ],
  },
  {
    number: '03',
    title: 'Multi-Camera 4K Live Streaming',
    subtitle: 'Low-latency live stream broadcasts for corporate events, keynotes & ceremonies.',
    deliverables: [
      'Multi-camera video switching with dedicated operator feeds',
      'Hardware broadcast switcher with backup recordings',
      'Simultaneous streaming to YouTube, Vimeo, Zoom, or private link',
      'Branded lower-thirds, title cards & live slide integration',
      'Full master archive delivered immediately post-broadcast',
    ],
    packages: [
      { name: 'Broadcast Setup', duration: 'Event Session', price: 'Starting from $120', desc: 'Multi-feed live stream broadcast setup & stream transmission.' },
      { name: 'Full Event Broadcast', duration: 'Full Event', price: 'Custom Quote', desc: 'Multi-camera switched broadcast with ISO master recordings.' },
    ],
  },
  {
    number: '04',
    title: 'Official Biometric Passport Photos',
    subtitle: 'Registered Canadian company providing 100% government compliant passport photos.',
    deliverables: [
      'Official registered company studio stamp & validation',
      'Adherence to Passport Canada, US, UK, Schengen & global standards',
      'Calibrated shadow-free biometric lighting setup',
      'Instant digital copy and archival physical photo prints',
      'Guaranteed consular acceptance or complimentary re-shoot',
    ],
    packages: [
      { name: 'Standard Biometric Set', duration: 'Express Session', price: '$35', desc: 'Official printed archival pair + digital copy.' },
      { name: 'Dual Country Combo', duration: 'Express Session', price: '$50', desc: 'Two distinct country specifications & international codes.' },
    ],
  },
]

const gearVault = [
  { category: 'Camera Systems & Video Bodies', items: ['Shoots up to 8K Cinema & Stills', 'Full-Frame 8K / 4K Sensor Bodies', 'High-Speed Cinema Rigs', 'Multi-Camera Live Video Nodes'] },
  { category: 'Prime & Cine Optical Suite', items: ['Ultra-Fast f/1.2 & f/1.4 Prime Glass', 'Ultra-Wide 16-35mm Architectural Glass', 'Standard 24-70mm f/2.8 Workhorses', 'Telephoto 70-200mm f/2.8 Zoom Glass'] },
  { category: 'Studio Lighting & Soft Diffusion', items: ['Full In-House Strobe Inventory', 'Continuous High-CRI Studio Video Lights', 'Deep Parabolic Softboxes & Octas', 'Reflector Panels & Negative Fill Control'] },
  { category: 'Live Broadcast, Audio & Switching', items: ['Multi-Channel Hardware Broadcast Switcher', '32-Bit Float Wireless Audio Systems', 'Precision Directional Boom Microphones', 'Calibrated Color Reference Monitors'] },
]

const faqs = [
  {
    q: 'What is your base location and service coverage area?',
    a: 'Our main office is based in London, Ontario. We provide photography, videography, and live streaming services across London, the GTA, throughout Ontario, and across all of Canada. On-location shoots and travel arrangements are accommodated with full mobile production capabilities.',
  },
  {
    q: 'Why does company registration matter for passport photos?',
    a: 'Passport Canada and international consular authorities require official passport-size photos to be provided by a registered commercial enterprise with an official studio stamp. Because Super Snap Studio is a registered company in Canada, our biometric photos meet official government standards — an eligibility requirement that informal or unregistered photographers cannot fulfill.',
  },
  {
    q: 'What camera capabilities and resolutions do you shoot in?',
    a: 'Our in-house cinema and still camera systems shoot up to 8K resolution. This enables incredible detail, large-format fine art printing, precision cropping in post-production, and pristine 4K downsampled cinema master videos.',
  },
  {
    q: 'What are your entry-level starting rates?',
    a: 'Our transparent entry-level rates start from $100 for Photography, from $120 for Live Streaming, and from $150 for Videography. Specific pricing depends on session duration, shoot location, and deliverable scope — contact our coordinator for a tailored quote.',
  },
  {
    q: 'Do you provide full in-house equipment for shoots?',
    a: 'Yes. We maintain complete in-house equipment for all photography, videography, and multi-camera live streaming projects. We arrive self-sufficient with cinema camera bodies, prime glass, wireless audio, studio lighting, and broadcast switching hardware.',
  },
  {
    q: 'Can we book custom shoot types not explicitly listed?',
    a: 'Absolutely. Whether you need an intimate family gathering, commercial product photography, maternity milestone, real estate catalog, or full-day multi-camera stream, our studio handles custom production treatments across Ontario and Canada.',
  },
]

export function SuperSnapHome() {
  const containerRef = useRef<HTMLElement>(null)
  const { lenis } = useSmoothScroll()
  useAnimations(containerRef)

  const [menuOpen, setMenuOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All work')
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<ProjectCaseStudy | null>(null)
  const [activeFaq, setActiveFaq] = useState<number | null>(0)
  const [clientSpaceSelects, setClientSpaceSelects] = useState<number[]>([1, 2])
  const [bookingSent, setBookingSent] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

  // Booking Form State
  const [selectedService, setSelectedService] = useState('Commercial Photography')
  const [selectedBudget, setSelectedBudget] = useState('Starting from $100')
  const [sessionLocation, setSessionLocation] = useState('London, ON (Studio / Local)')

  // Dynamic Services & Starting Rates from SQLite
  const [liveStartingRates, setLiveStartingRates] = useState(startingRates)

  useEffect(() => {
    async function loadDynamicServices() {
      try {
        const res = await fetch('/api/services')
        const data = await res.json()
        if (data.success && Array.isArray(data.services) && data.services.length > 0) {
          const updated = [...startingRates]
          data.services.forEach((s: any) => {
            const lowestPkg = s.packages?.reduce((min: any, p: any) => {
              const pNum = parseFloat(p.price.replace(/[^0-9.]/g, ''))
              const minNum = min ? parseFloat(min.price.replace(/[^0-9.]/g, '')) : Infinity
              return pNum < minNum ? p : min
            }, null)

            if (lowestPkg) {
              const matched = updated.find((r) =>
                r.service.toLowerCase().includes(s.name.toLowerCase()) ||
                s.name.toLowerCase().includes(r.service.toLowerCase())
              )
              if (matched) {
                matched.price = lowestPkg.price.startsWith('$') ? `Starting from ${lowestPkg.price}` : lowestPkg.price
              }
            }
          })
          setLiveStartingRates(updated)
        }
      } catch (err) {
        // Fallback to static defaults
      }
    }
    loadDynamicServices()
  }, [])

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBookingLoading(true)
    setBookingError(null)

    const form = event.currentTarget
    const formData = new FormData(form)
    const payload = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: (formData.get('phone') as string) || '',
      service: selectedService,
      budget: selectedBudget,
      location: sessionLocation,
      date: (formData.get('date') as string) || '',
      message: formData.get('message') as string,
    }

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setBookingSent(true)
        form.reset()
      } else {
        setBookingError(data.error || 'Failed to submit inquiry. Please try again.')
      }
    } catch (err: any) {
      setBookingError('Network error. Please try again or reach the studio directly.')
    } finally {
      setBookingLoading(false)
    }
  }

  function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (href.startsWith('#')) {
      e.preventDefault()
      if (lenis) {
        lenis.scrollTo(href, { offset: 0, duration: 1.8 })
      } else {
        const target = document.querySelector(href)
        target?.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  // Handle ESC key for modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && selectedCaseStudy) {
        setSelectedCaseStudy(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCaseStudy])

  const filteredProjects = projects.filter((item) => {
    if (activeFilter === 'All work') return true
    if (activeFilter === 'Photography') return item.category === 'Photography'
    if (activeFilter === 'Film') return item.category === 'Film'
    if (activeFilter === 'Live Broadcast') return item.category === 'Live Broadcast'
    if (activeFilter === 'Commercial') return item.category === 'Commercial'
    return true
  })

  function toggleClientFavorite(index: number) {
    setClientSpaceSelects((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  return (
    <main ref={containerRef} className="studio-page">
      <div className="scroll-progress-bar" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      {/* Primary Site Header */}
      <header className="site-header">
        <div className="site-container header-container">
          <a href="#hero-title" onClick={(e) => handleAnchorClick(e, '#hero-title')} className="brand" aria-label="Super Snap Studio home">
            <span>SUPER SNAP</span>
            <small>STUDIO / LONDON, ON • SERVING ALL CANADA</small>
          </a>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="#work" onClick={(e) => handleAnchorClick(e, '#work')}>Work</a>
            <a href="#services" onClick={(e) => handleAnchorClick(e, '#services')}>Rates & Services</a>
            <a href="#gear" onClick={(e) => handleAnchorClick(e, '#gear')}>Studio & Gear</a>
            <a href="#studio" onClick={(e) => handleAnchorClick(e, '#studio')}>Process</a>
            <a href="#reviews" onClick={(e) => handleAnchorClick(e, '#reviews')}>Standards</a>
            <a href="#faq" onClick={(e) => handleAnchorClick(e, '#faq')}>FAQ</a>
            <a href="/portal" style={{ color: 'var(--lime)' }}>Client Portal</a>
            <a href="/admin" style={{ color: 'var(--lime)', border: '1px solid rgba(215, 255, 63, 0.4)', padding: '4px 10px', borderRadius: '4px' }}>Owner Portal ⚡</a>
            <a href="#contact" onClick={(e) => handleAnchorClick(e, '#contact')} className="nav-highlight">Book Session ↗</a>
          </nav>
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="mobile-menu">
            {menuOpen ? 'Close' : 'Menu'} <i />
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile navigation">
          <a href="#work" onClick={(e) => { handleAnchorClick(e, '#work'); setMenuOpen(false) }}>Work Archive</a>
          <a href="#services" onClick={(e) => { handleAnchorClick(e, '#services'); setMenuOpen(false) }}>Rates & Services</a>
          <a href="#gear" onClick={(e) => { handleAnchorClick(e, '#gear'); setMenuOpen(false) }}>Studio & Gear Vault</a>
          <a href="#studio" onClick={(e) => { handleAnchorClick(e, '#studio'); setMenuOpen(false) }}>Production Process</a>
          <a href="#reviews" onClick={(e) => { handleAnchorClick(e, '#reviews'); setMenuOpen(false) }}>Studio Standards</a>
          <a href="#faq" onClick={(e) => { handleAnchorClick(e, '#faq'); setMenuOpen(false) }}>Studio FAQ</a>
          <a href="/portal" style={{ color: 'var(--lime)' }} onClick={() => setMenuOpen(false)}>Client Portal ↗</a>
          <a href="/admin" style={{ color: 'var(--lime)', fontWeight: 700 }} onClick={() => setMenuOpen(false)}>Owner Dashboard (Studio Ops) ⚡</a>
          <a href="#contact" onClick={(e) => { handleAnchorClick(e, '#contact'); setMenuOpen(false) }}>Book Session ↗</a>
        </nav>
      )}

      {/* Hero Section */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="site-container hero-container">
          <div className="hero-meta">
            <span>LONDON, ON / CANADA</span>
            <span>SERVING ACROSS ONTARIO & ALL OF CANADA</span>
            <span className="hero-counter">001 — 008</span>
          </div>

          <div className="hero-grid">
            <div className="hero-copy">
              <div className="hero-badge-row">
                <span className="eyebrow lime">Photography • Videography • Live Streaming</span>
                <span className="badge-pill pill-chip">Registered in Canada</span>
              </div>

              <h1 id="hero-title">
                <span className="word-line">SUPER</span><br />
                <span className="word-line"><em>SNAP</em></span>
              </h1>

              <p className="hero-note">
                Every frame, alive. Visual stories with pulse.<br />
                Based in London, Ontario — serving clients across Ontario and all of Canada with full in-house equipment, shooting up to 8K resolution.
              </p>

              {/* Live Studio Capabilities Strip */}
              <div className="hero-metrics-strip">
                <div className="metric-item">
                  <strong>Up to 8K</strong>
                  <span>Camera Resolution</span>
                </div>
                <div className="metric-item">
                  <strong>Reg. Canada</strong>
                  <span>Official Passport Certified</span>
                </div>
                <div className="metric-item">
                  <strong>Full In-House</strong>
                  <span>Photo, Video & Stream Gear</span>
                </div>
                <div className="metric-item">
                  <strong>All Canada</strong>
                  <span>London Base & Travel Shoots</span>
                </div>
              </div>
            </div>

            <div className="hero-photo-stack">
              {/* PLACEHOLDER — replace with real shoot photo */}
              <div className="hero-photo photo-one">
                <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=85" alt="Studio portrait session placeholder" />
              </div>
              {/* PLACEHOLDER — replace with real shoot photo */}
              <div className="hero-photo photo-two">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=85" alt="Studio close-up portrait placeholder" />
              </div>
              <div className="viewfinder" aria-hidden="true">
                <span /><span /><span /><span />
              </div>
            </div>
          </div>

          <a href="#intro" onClick={(e) => handleAnchorClick(e, '#intro')} className="scroll-cue">
            Scroll to explore <b>↓</b>
          </a>
        </div>
      </section>

      {/* 02 / The Approach (Deep Manifesto & Pillars) */}
      <section id="intro" className="intro-section section-ivory">
        <div className="site-container">
          <div className="section-index">02 / THE PHILOSOPHY</div>
          <div className="intro-grid">
            <h2>
              <span className="word-line">THE</span><br />
              <span className="word-line"><span>IMAGE</span></span><br />
              <span className="word-line">IS THE</span><br />
              <span className="word-line"><span>MESSAGE.</span></span>
            </h2>
            <div className="intro-text">
              <p className="lead">
                We make photographs and films that hold weight. Honest light, intentional composition, and an electric pulse in every frame.
              </p>
              <p>
                Super Snap Studio is a high-concept production collective headquartered in London, Ontario. From family milestones, newborn portraits, and commercial real estate to corporate event videography, multi-camera live streaming, and official Canadian passport certification, we deliver craft-first execution without compromise.
              </p>

              <div className="pillars-grid">
                <div className="pillar-card studio-card-box">
                  <span className="pillar-num">01</span>
                  <h4>Up to 8K Resolution</h4>
                  <p>In-house cinema and still camera systems capturing up to 8K, ensuring extraordinary clarity, dynamic range, and future-proof masters.</p>
                </div>
                <div className="pillar-card studio-card-box">
                  <span className="pillar-num">02</span>
                  <h4>Full In-House Equipment</h4>
                  <p>Equipped with complete in-house photography, videography, and multi-cam live broadcast gear for studio or on-location productions.</p>
                </div>
                <div className="pillar-card studio-card-box">
                  <span className="pillar-num">03</span>
                  <h4>Registered & Certified</h4>
                  <p>A registered company in Canada, fully accredited to produce official government-compliant passport photos with zero rejection risk.</p>
                </div>
              </div>

              <a className="text-link" href="#gear" onClick={(e) => handleAnchorClick(e, '#gear')}>
                Inspect our studio space & gear <b>↗</b>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 03 / Selected Work Archive (Rich Case Studies + Modal) */}
      <section id="work" className="work-section">
        <div className="site-container">
          <div className="section-top">
            <div>
              <span className="eyebrow lime">03 / CURATED ARCHIVE</span>
              <h2>
                <span className="word-line">SELECTED</span><br />
                <span className="word-line"><span>PRODUCTIONS</span></span>
              </h2>
              <p className="section-subtext">Click any production to view camera specifications, creative brief details, and master deliverable formats.</p>
            </div>
            <div className="filter-list" role="group" aria-label="Filter work">
              {['All work', 'Photography', 'Film', 'Live Broadcast', 'Commercial'].map((filter) => (
                <button
                  key={filter}
                  className={`pill-chip ${activeFilter === filter ? 'active' : ''}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="work-grid">
            {filteredProjects.map((item, index) => (
              <article
                className="work-card"
                key={item.id}
                onClick={() => setSelectedCaseStudy(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedCaseStudy(item)}
              >
                <div className="work-image">
                  {/* PLACEHOLDER — replace with real shoot photo */}
                  <img src={item.image} alt={`${item.title} ${item.type} project placeholder`} />
                  <div className="work-overlay-info">
                    <span className="badge-lens">{item.camera.split('(')[0]}</span>
                    <p className="overlay-desc">{item.brief.slice(0, 80)}...</p>
                  </div>
                </div>
                <div className="card-caption">
                  <div className="caption-meta">
                    <span className="meta-tag">0{index + 1} / {item.type}</span>
                    <span className="meta-client">{item.year}</span>
                  </div>
                  <div className="caption-title-row">
                    <h3>{item.title}</h3>
                    <b className="inspect-link">Inspect ↗</b>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="work-footer-cta">
            <p>Looking for custom production treatments, private shoots, or event coverage?</p>
            <a className="outline-button btn-secondary" href="#contact" onClick={(e) => handleAnchorClick(e, '#contact')}>
              Request Custom Quote & Rates <span>↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* Case Study Detail Modal */}
      {selectedCaseStudy && (
        <div className="case-study-modal-backdrop" onClick={() => setSelectedCaseStudy(null)}>
          <div className="case-study-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedCaseStudy(null)} aria-label="Close modal">
              ✕
            </button>
            <div className="modal-header">
              <span className="eyebrow lime">PROJECT SCOPE / {selectedCaseStudy.type}</span>
              <h2>{selectedCaseStudy.title}</h2>
              <span className="modal-client-tag">Focus: <strong>{selectedCaseStudy.client}</strong></span>
            </div>

            <div className="modal-body-grid">
              <div className="modal-image-col">
                {/* PLACEHOLDER — replace with real shoot photo */}
                <img src={selectedCaseStudy.image} alt={selectedCaseStudy.title} />
                <div className="modal-stat-pill">
                  <span>SPECIFICATION</span>
                  <strong>{selectedCaseStudy.stats}</strong>
                </div>
              </div>

              <div className="modal-specs-col">
                <div className="spec-group">
                  <h4>Production Overview</h4>
                  <p>{selectedCaseStudy.brief}</p>
                </div>

                <div className="spec-group">
                  <h4>Hardware & Lighting Rig</h4>
                  <ul className="spec-list">
                    <li><strong>Camera System:</strong> {selectedCaseStudy.camera}</li>
                    <li><strong>Optical Suite:</strong> {selectedCaseStudy.lens}</li>
                    <li><strong>Lighting & Grip:</strong> {selectedCaseStudy.lighting}</li>
                  </ul>
                </div>

                <div className="spec-group">
                  <h4>Standard Deliverables</h4>
                  <ul className="deliverables-checklist">
                    {selectedCaseStudy.deliverables.map((del) => (
                      <li key={del}>✓ {del}</li>
                    ))}
                  </ul>
                </div>

                <div className="modal-cta-box">
                  <p>Ready to reserve a session with our studio team?</p>
                  <a
                    className="lime-button btn-primary"
                    href="#contact"
                    onClick={(e) => {
                      setSelectedCaseStudy(null)
                      handleAnchorClick(e, '#contact')
                    }}
                  >
                    Discuss Your Session Scope ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 04 / Services & Starting Rates */}
      <section id="services" className="services-section section-ivory">
        <div className="site-container">
          <div className="section-index">04 / RATES & FULL SERVICES</div>
          <div className="services-heading">
            <h2>
              <span className="word-line">PRACTICE</span><br />
              <span className="word-line"><span>& PACKAGES.</span></span>
            </h2>
            <p>
              Transparent starting rates, comprehensive shoot capabilities, and official biometric passport verification.
              Based in London, Ontario — serving clients across Ontario and all of Canada.
            </p>
          </div>

          {/* 3-Tier Starting From Rates Grid */}
          <div className="starting-rates-container">
            <div className="rates-header-row">
              <span className="eyebrow">TRANSPARENT ENTRY-LEVEL PRICING</span>
              <p className="rates-intro-note">Accessible entry rates for individual sessions, corporate events, and broadcasts.</p>
            </div>
            <div className="starting-rates-grid">
              {liveStartingRates.map((tier) => (
                <div className="starting-rate-card studio-card-box" key={tier.service}>
                  <div className="rate-service-title">{tier.service}</div>
                  <strong className="rate-price-tag">{tier.price}</strong>
                  <p className="rate-description">{tier.details}</p>
                  <span className="rate-placeholder-tag">{tier.placeholderNote}</span>
                  <a
                    href="#contact"
                    onClick={(e) => {
                      setSelectedService(tier.targetService)
                      handleAnchorClick(e, '#contact')
                    }}
                    className="rate-card-cta"
                  >
                    Inquire {tier.service} ↗
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Standalone Passport Registration Trust Banner */}
          <div className="passport-trust-banner studio-card-box">
            <div className="passport-trust-badge">
              <span className="passport-shield-icon">🛡</span>
              <span className="eyebrow lime">OFFICIAL ACCREDITATION IN CANADA</span>
            </div>
            <div className="passport-trust-content">
              <h3>Registered Company in Canada — Passport Photo Eligibility</h3>
              <p>
                This studio is a <strong>registered company in Canada</strong>, which makes it eligible to provide official passport-size photos — a requirement that unregistered or informal photographers cannot meet. We provide official stamps and guarantee 100% consular acceptance.
              </p>
            </div>
            <a
              href="#contact"
              onClick={(e) => {
                setSelectedService('Biometric Passport')
                handleAnchorClick(e, '#contact')
              }}
              className="passport-trust-btn"
            >
              Book Passport Photo ($35) ↗
            </a>
          </div>

          {/* Categorized Full Shoot-Type Directory */}
          <div className="capabilities-directory-block">
            <div className="directory-header">
              <span className="eyebrow">FULL-SERVICE CAPABILITY DIRECTORY</span>
              <h3>What We Shoot</h3>
              <p>Explore our complete range of specialized photography, videography, and live streaming services.</p>
            </div>

            <div className="categories-grid">
              {shootCategories.map((cat) => (
                <div className="category-card studio-card-box" key={cat.category}>
                  <div className="category-card-head">
                    <h4>{cat.category}</h4>
                    {cat.highlight && (
                      <span className="category-highlight-badge">{cat.highlight}</span>
                    )}
                  </div>
                  <ul className="category-items-list">
                    {cat.items.map((item) => (
                      <li key={item}>
                        <span className="cat-bullet">/</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#contact"
                    onClick={(e) => {
                      setSelectedService(cat.category.includes('Passport') ? 'Biometric Passport' : 'Commercial Photography')
                      handleAnchorClick(e, '#contact')
                    }}
                    className="category-inquire-link"
                  >
                    Book {cat.category.split('&')[0].trim()} ↗
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Service Packages */}
          <div className="service-packages-container">
            {servicesData.map((service) => (
              <div className="service-package-card" key={service.number}>
                <div className="card-top-header">
                  <span className="service-num">{service.number}</span>
                  <div className="service-titles">
                    <h3>{service.title}</h3>
                    <p className="service-sub">{service.subtitle}</p>
                  </div>
                </div>

                <div className="service-deliverables">
                  <h5>Standard Inclusions & Deliverables</h5>
                  <ul>
                    {service.deliverables.map((item, idx) => (
                      <li key={idx}>
                        <span className="check-icon">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pricing-tiers-row">
                  {service.packages.map((pkg) => (
                    <div className="package-tier" key={pkg.name}>
                      <div className="tier-header">
                        <span className="tier-name">{pkg.name}</span>
                        <strong className="tier-price">{pkg.price}</strong>
                      </div>
                      <span className="tier-duration">{pkg.duration}</span>
                      <p className="tier-desc">{pkg.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="service-card-action">
                  <a
                    href="#contact"
                    onClick={(e) => {
                      setSelectedService(service.title)
                      handleAnchorClick(e, '#contact')
                    }}
                    className="book-service-link"
                  >
                    Book {service.title} ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 05 / Studio Facility & Gear Vault */}
      <section id="gear" className="gear-section">
        <div className="site-container">
          <div className="section-index">05 / HARDWARE & IN-HOUSE GEAR</div>

          <div className="facility-hero-grid">
            <div className="facility-info">
              <span className="eyebrow lime">PROFESSIONAL PRODUCTION RIG</span>
              <h2>THE GLASS.<br /><span>UP TO 8K.</span><br />THE RIG.</h2>
              <p className="lead">
                Full in-house equipment for photography, videography, and multi-camera live streaming. We shoot up to 8K resolution, delivering pristine clarity and dynamic range for every production.
              </p>
              <div className="facility-features-grid">
                <div className="facility-pill studio-card-box">
                  <strong>Shoots Up to 8K</strong>
                  <span>Headline Sensor Resolution</span>
                </div>
                <div className="facility-pill studio-card-box">
                  <strong>Full In-House Gear</strong>
                  <span>Photo, Video & Live Streaming</span>
                </div>
                <div className="facility-pill studio-card-box">
                  <strong>London, ON Base</strong>
                  <span>Local Studio & Field Rigs</span>
                </div>
                <div className="facility-pill studio-card-box">
                  <strong>Canada-Wide Travel</strong>
                  <span>Mobile On-Location Setup</span>
                </div>
              </div>
            </div>

            <div className="gear-vault-card studio-card-box">
              <div className="gear-vault-header">
                <span className="eyebrow lime">COMMERCIAL HARDWARE INVENTORY</span>
                <h3>Calibrated Precision Gear</h3>
              </div>
              <div className="gear-categories-list">
                {gearVault.map((cat) => (
                  <div className="gear-cat-item" key={cat.category}>
                    <h4>{cat.category}</h4>
                    <div className="gear-pills">
                      {cat.items.map((item) => (
                        <span className="gear-tag pill-chip" key={item}>{item}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-Bleed Statement Section */}
      <section className="statement-section">
        <div className="statement-image">
          {/* PLACEHOLDER — replace with real shoot photo */}
          <img src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1800&q=85" alt="Creative studio table placeholder" />
        </div>
        <div className="site-container statement-content-wrap">
          <div className="statement-overlay">
            <span className="eyebrow lime">A GOOD IMAGE MOVES</span>
            <h2>
              <span className="word-line">FEEL</span><br />
              <span className="word-line">FIRST.</span>
            </h2>
          </div>
        </div>
      </section>

      {/* 06 / The 4-Step Production Process */}
      <section id="studio" className="process-section">
        <div className="site-container">
          <div className="section-index">06 / THE PRODUCTION JOURNEY</div>
          <div className="process-header">
            <h2>
              <span className="word-line">FROM CONCEPT</span><br />
              <span className="word-line"><span>TO MASTER.</span></span>
            </h2>
            <p>
              No guesswork or creative surprises. Every production moves through an intentional four-stage pipeline designed for client certainty.
            </p>
          </div>
          <div className="process-grid">
            <div className="process-connecting-line" aria-hidden="true" />
            {[
              {
                step: '01',
                title: 'Discovery & Creative Treatment',
                text: 'We dissect your session goals, establish preferred mood and lighting style, and design a customized shot list for your shoot.',
              },
              {
                step: '02',
                title: 'Pre-Production & Logistics',
                text: 'Shoot scheduling, call sheets, location planning across London or throughout Ontario, and gear preparation handled cleanly.',
              },
              {
                step: '03',
                title: 'The Production Session',
                text: 'Tethered live review on calibrated screens. Direct, collaborative direction to ensure confident posing and precise framing.',
              },
              {
                step: '04',
                title: 'Master Retouching & Delivery',
                text: 'High-end retouching, 8K/4K cinema color grading, audio mastering, and instant private cloud delivery with full-resolution files.',
              },
            ].map((item) => (
              <div className="process-step studio-card-box" key={item.step}>
                <span className="process-num">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 07 / Client Portal Space (Interactive Demo) */}
      <section className="portal-section section-ivory">
        <div className="site-container portal-container">
          <div className="portal-left-col">
            <span className="eyebrow">PRIVATE CLIENT SUITE</span>
            <h2>
              <span className="word-line">YOUR ASSETS.</span><br />
              <span className="word-line"><span>SELECTION LIVE.</span></span>
            </h2>
            <p>
              Project details, raw contact sheets, client favoriting, retoucher notes, and final uncompressed master delivery — your private studio portal is always one click away.
            </p>
            <div className="portal-action-row">
              <a className="lime-button btn-primary" href="#contact" onClick={(e) => handleAnchorClick(e, '#contact')}>
                Request Client Portal Access ↗
              </a>
              <span className="portal-note">Encrypted 256-Bit SSL Cloud Storage</span>
            </div>
          </div>

          {/* Interactive Client Proofing Demo Card */}
          <div className="portal-card">
            <div className="portal-bar">
              <span>SUPER SNAP / CLIENT PROOFING SUITE</span>
              <span className="live-pill">● SECURE LIVE</span>
            </div>

            <div className="portal-thumb">
              {/* PLACEHOLDER — replace with real shoot photo */}
              <img src={projects[0].image} alt="Client project preview placeholder" />
              <div className="portal-thumb-badge">SAMPLE PROOF SHEET</div>
            </div>

            <div className="portal-interactive-selects">
              <span className="selects-label">Interactive Proofing Demo (Click to favorite selects):</span>
              <div className="demo-selects-row">
                {['Frame 01 / Studio Soft Key', 'Frame 02 / Natural Edge Fill', 'Frame 03 / High-Contrast Master'].map((look, idx) => {
                  const isFav = clientSpaceSelects.includes(idx)
                  return (
                    <button
                      key={look}
                      type="button"
                      className={`select-chip ${isFav ? 'fav-active' : ''}`}
                      onClick={() => toggleClientFavorite(idx)}
                    >
                      <span>{isFav ? '★ Favorited' : '☆ Select'}</span>
                      <small>{look}</small>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="portal-info">
              <div>
                <span>SELECT STATUS:</span>
                <strong>{clientSpaceSelects.length} Approved Frames Selected</strong>
              </div>
              <a href="#contact" onClick={(e) => handleAnchorClick(e, '#contact')} className="portal-download-btn">
                Export Proofs <b>↗</b>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 08 / Studio Standards & Accreditation (No Fabricated Reviews) */}
      <section id="reviews" className="reviews-section">
        <div className="site-container">
          <div className="section-index">08 / ACCREDITATION & PRODUCTION STANDARDS</div>
          <div className="section-top">
            <div>
              <span className="eyebrow lime">CRAFT & VERIFIED TRUST</span>
              <h2>
                <span className="word-line">SELECTIVE.</span><br />
                <span className="word-line"><span>DETAIL-DRIVEN.</span></span>
              </h2>
            </div>
            <div className="rating-badge-block">
              <span className="standards-badge-tag">OFFICIALLY REGISTERED IN CANADA</span>
              <span>Full In-House Hardware • Shoots up to 8K • Canada-Wide Coverage</span>
            </div>
          </div>

          <div className="reviews-grid">
            <div className="review-card studio-card-box">
              <span className="pillar-num">TRUST 01</span>
              <h4>Registered Company in Canada</h4>
              <p className="review-quote">
                This studio is a registered company in Canada, which makes it eligible to provide official passport-size photos — a requirement that unregistered or informal photographers cannot meet.
              </p>
              <div className="review-author">
                <strong>Government Biometric Standard</strong>
                <span>Passport Canada & Global Consular Compliance</span>
              </div>
            </div>

            <div className="review-card studio-card-box">
              <span className="pillar-num">TRUST 02</span>
              <h4>Shoots Up to 8K Resolution</h4>
              <p className="review-quote">
                Equipped with complete in-house equipment for photography, videography, and live streaming. We capture up to 8K resolution for large-scale commercial prints and broadcast-standard footage.
              </p>
              <div className="review-author">
                <strong>Cinema & Broadcast Grade</strong>
                <span>Full-Frame High-Resolution Hardware Rigs</span>
              </div>
            </div>

            <div className="review-card studio-card-box">
              <span className="pillar-num">TRUST 03</span>
              <h4>London Base & All-Canada Reach</h4>
              <p className="review-quote">
                Based in London, Ontario — serving clients across London, the GTA, throughout Ontario, and across all of Canada. Full mobile field production kits available for any destination.
              </p>
              <div className="review-author">
                <strong>London, Ontario & Canada-Wide</strong>
                <span>Studio Sessions & Travel Deployments</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 09 / Studio FAQs */}
      <section id="faq" className="faq-section section-ivory">
        <div className="site-container">
          <div className="section-index">09 / STUDIO KNOWLEDGE & FAQ</div>
          <div className="faq-layout">
            <div className="faq-heading-col">
              <h2>
                <span className="word-line">EVERYTHING</span><br />
                <span className="word-line"><span>ANSWERED.</span></span>
              </h2>
              <p>
                Clear terms, exact timelines, and transparent studio etiquette. Have a custom inquiry? Reach our studio coordinator directly.
              </p>
              <a className="text-link" href="#contact" onClick={(e) => handleAnchorClick(e, '#contact')}>
                Direct Studio Line: (647) 720-0423 <b>↗</b>
              </a>
            </div>

            <div className="faq-accordion-col">
              {faqs.map((faq, index) => {
                const isOpen = activeFaq === index
                return (
                  <div className={`faq-item ${isOpen ? 'faq-open' : ''}`} key={index}>
                    <button
                      className="faq-question"
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <span className="faq-icon">{isOpen ? '—' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="faq-answer">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 10 / Studio Booking & Inquiry Console */}
      <section id="contact" className="contact-section">
        <div className="site-container contact-container">
          <div className="contact-copy">
            <span className="eyebrow lime">10 / RESERVE PRODUCTION</span>
            <h2>
              <span className="word-line">START YOUR</span><br />
              <span className="word-line"><em>SESSION.</em></span>
            </h2>
            <p>
              Tell us about your maternity shoot, family portrait, corporate event, real estate showcase, live stream broadcast, or official passport appointment.
              Our studio coordinator responds within 4 business hours.
            </p>

            <div className="studio-address-block">
              <h4>Headquarters & Service Area</h4>
              <address>
                Super Snap Studio<br />
                Main Office: London, Ontario, Canada<br />
                Serving London, throughout Ontario & all of Canada
              </address>
              <div className="studio-hours">
                <strong>Studio Hours:</strong>
                <span>Mon — Fri: 8:30 AM — 7:30 PM</span>
                <span>Saturday: 9:00 AM — 6:00 PM</span>
                <span>Sunday: By Production Appointment</span>
              </div>
            </div>

            <div className="contact-links">
              <a href="mailto:supersnapstudio@gmail.com">supersnapstudio@gmail.com ↗</a>
              <a href="tel:+16477200423">(647) 720-0423 ↗</a>
              <div className="social-pills">
                <a href="https://www.instagram.com/super_snap_studio?utm_source=qr&igsi=aG02YW84aXpkZ21u" target="_blank" rel="noreferrer" className="pill-chip">Instagram ↗</a>
                <a href="https://www.facebook.com/share/1ELJfz6pp8/" target="_blank" rel="noreferrer" className="pill-chip">Facebook ↗</a>
              </div>
            </div>
          </div>

          {/* Intelligent Booking Console */}
          <form className="contact-form" onSubmit={submitBooking}>
            <div className="form-service-selector">
              <label className="field-heading">Select Required Service</label>
              <div className="service-chips">
                {[
                  'Commercial Photography',
                  'Portrait & Family Shoot',
                  'Cinema Videography',
                  '4K Live Streaming',
                  'Biometric Passport',
                  'Real Estate Photography',
                  'Custom / Any Occasion',
                ].map((srv) => (
                  <button
                    type="button"
                    key={srv}
                    className={`chip-btn pill-chip ${selectedService === srv ? 'active' : ''}`}
                    onClick={() => setSelectedService(srv)}
                  >
                    {srv}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-two-col">
              <label>
                Your Full Name *
                <input required name="name" placeholder="e.g. Maya Lin" />
              </label>
              <label>
                Email Address *
                <input required type="email" name="email" placeholder="maya@company.com" />
              </label>
            </div>

            <div className="form-two-col">
              <label>
                Phone / Mobile
                <input type="tel" name="phone" placeholder="(647) 000-0000" />
              </label>
              <label>
                Preferred Production Date
                <input type="date" name="date" />
              </label>
            </div>

            <div className="form-budget-selector">
              <label className="field-heading">Estimated Budget / Tier</label>
              <div className="budget-chips">
                {[
                  'Starting from $100 (Photo)',
                  'Starting from $120 (Stream)',
                  'Starting from $150 (Video)',
                  '$500 – $1,500',
                  '$1,500+',
                ].map((bg) => (
                  <button
                    type="button"
                    key={bg}
                    className={`chip-btn pill-chip ${selectedBudget === bg ? 'active' : ''}`}
                    onClick={() => setSelectedBudget(bg)}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-location-selector">
              <label className="field-heading">Shooting Location</label>
              <div className="location-chips">
                {['London, ON (Studio / Local)', 'Across Ontario (GTA / Regional)', 'Canada-Wide / Travel'].map((loc) => (
                  <button
                    type="button"
                    key={loc}
                    className={`chip-btn pill-chip ${sessionLocation === loc ? 'active' : ''}`}
                    onClick={() => setSessionLocation(loc)}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <label>
              Project Details & Creative Brief *
              <textarea
                required
                name="message"
                placeholder="Tell us about your shoot type (maternity, baby shower, real estate, corporate event, live stream, or passport), preferred dates, and location..."
              />
            </label>

            {bookingError && (
              <div style={{ padding: '12px 16px', background: 'rgba(255, 60, 60, 0.1)', border: '1px solid rgba(255, 60, 60, 0.3)', borderRadius: 'var(--radius-sm)', color: '#ff6b6b', fontSize: '13px' }}>
                ⚠ {bookingError}
              </div>
            )}

            {bookingSent && (
              <div style={{ padding: '16px', background: 'rgba(215, 255, 63, 0.1)', border: '1px solid rgba(215, 255, 63, 0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--lime)', fontSize: '13px', lineHeight: '1.5' }}>
                ✓ <strong>Inquiry Dispatched Successfully!</strong> Our studio coordinator will review your creative brief and reach out within 4 business hours.
              </div>
            )}

            <button
              className="lime-button btn-primary booking-submit-btn"
              type="submit"
              disabled={bookingLoading}
              style={{ opacity: bookingLoading ? 0.7 : 1, cursor: bookingLoading ? 'wait' : 'pointer' }}
            >
              {bookingLoading ? 'Submitting to Studio Vault...' : bookingSent ? 'Submit Another Production Request ↗' : 'Dispatch Studio Inquiry ↗'}
            </button>
          </form>
        </div>
      </section>

      {/* Global Minimal Studio Footer */}
      <footer className="site-footer">
        <div className="site-container footer-container">
          <div className="footer-col-left">
            <span>SUPER SNAP STUDIO / © 2021—2026</span>
          </div>
          <div className="footer-col-center">
            <span className="footer-tagline">EVERY FRAME, ALIVE.</span>
          </div>
          <div className="footer-col-right">
            <a href="/admin" style={{ color: 'var(--lime)', textDecoration: 'none' }}>Owner Console ⚡</a>
            <span className="footer-dot">•</span>
            <a href="/portal" style={{ color: '#F4F1E9', textDecoration: 'none' }}>Client Vault</a>
            <span className="footer-dot">•</span>
            <a href="#hero-title" onClick={(e) => handleAnchorClick(e, '#hero-title')}>Back to top ↑</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
