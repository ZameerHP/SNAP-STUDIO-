'use client'

import React, { useState, useRef, useEffect } from 'react'

interface Preset {
  name: string
  widthMm: number
  heightMm: number
  headMinMm?: number
  headMaxMm?: number
  note?: string
}

const PRESETS: Preset[] = [
  { name: 'Canada Passport & Visa', widthMm: 50, heightMm: 70, headMinMm: 31, headMaxMm: 36, note: 'White/light background. Chin to crown 31-36mm.' },
  { name: 'United States Passport (2x2")', widthMm: 51, heightMm: 51, headMinMm: 25, headMaxMm: 35, note: 'White background. Head height 50-69% of frame.' },
  { name: 'UK / EU / Schengen Biometric', widthMm: 35, heightMm: 45, headMinMm: 29, headMaxMm: 34, note: 'Light grey/cream background.' },
  { name: 'India Passport / OCI (2x2")', widthMm: 51, heightMm: 51, headMinMm: 25, headMaxMm: 35, note: 'White background.' },
  { name: 'Custom Dimension Specification', widthMm: 50, heightMm: 50, note: 'Configure custom width and height below.' },
]

export default function PassportPhotoToolPage() {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0)
  const [widthMm, setWidthMm] = useState(50)
  const [heightMm, setHeightMm] = useState(70)
  const [imageSrc, setImageSrc] = useState<string | null>(null)

  // Zoom & Pan state
  const [scale, setScale] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showGuidelines, setShowGuidelines] = useState(true)
  const [includeStudioStamp, setIncludeStudioStamp] = useState(true)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const loadedImageRef = useRef<HTMLImageElement | null>(null)

  const currentPreset = PRESETS[selectedPresetIndex]

  function handlePresetChange(idx: number) {
    setSelectedPresetIndex(idx)
    const p = PRESETS[idx]
    setWidthMm(p.widthMm)
    setHeightMm(p.heightMm)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const src = evt.target?.result as string
        setImageSrc(src)
        const img = new Image()
        img.src = src
        img.onload = () => {
          loadedImageRef.current = img
          setScale(1)
          setOffsetX(0)
          setOffsetY(0)
          drawCanvas()
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Draw on Canvas
  function drawCanvas() {
    const canvas = canvasRef.current
    const img = loadedImageRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 300 DPI: 1 mm = ~11.811 pixels
    const pxPerMm = 11.811
    const targetWidth = Math.round(widthMm * pxPerMm)
    const targetHeight = Math.round(heightMm * pxPerMm)

    canvas.width = targetWidth
    canvas.height = targetHeight

    // Clear background to white
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, targetWidth, targetHeight)

    // Save context
    ctx.save()
    ctx.translate(targetWidth / 2 + offsetX, targetHeight / 2 + offsetY)
    ctx.scale(scale, scale)

    // Draw centered
    ctx.drawImage(img, -img.width / 2, -img.height / 2)
    ctx.restore()

    // Optional Studio Stamp on back or lower border
    if (includeStudioStamp) {
      ctx.save()
      ctx.fillStyle = 'rgba(16, 17, 15, 0.4)'
      ctx.font = '22px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`SUPER SNAP STUDIO • LONDON, ON • REG. CANADA • ${new Date().toLocaleDateString()}`, targetWidth / 2, targetHeight - 14)
      ctx.restore()
    }
  }

  useEffect(() => {
    if (loadedImageRef.current) {
      drawCanvas()
    }
  }, [widthMm, heightMm, scale, offsetX, offsetY, includeStudioStamp])

  // Dragging handlers
  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    setIsDragging(true)
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY })
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isDragging) return
    setOffsetX(e.clientX - dragStart.x)
    setOffsetY(e.clientY - dragStart.y)
  }

  function handleMouseUp() {
    setIsDragging(false)
  }

  // Download Single Photo
  function downloadSinglePhoto() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `SuperSnap-Passport-${widthMm}x${heightMm}mm.png`
    link.href = canvas.toDataURL('image/png', 1.0)
    link.click()
  }

  // Download 4-Up Print Sheet (4x6" photo print plate)
  function downloadPrintSheet() {
    const canvas = canvasRef.current
    if (!canvas) return

    const sheetCanvas = document.createElement('canvas')
    const ctx = sheetCanvas.getContext('2d')
    if (!ctx) return

    // 4x6 inches at 300 DPI = 1200 x 1800 px
    sheetCanvas.width = 1800
    sheetCanvas.height = 1200

    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height)

    const photoW = canvas.width
    const photoH = canvas.height

    // Calculate layout for 4 copies
    const scaleFactor = Math.min(
      (sheetCanvas.width * 0.45) / photoW,
      (sheetCanvas.height * 0.45) / photoH,
      1
    )

    const finalW = photoW * scaleFactor
    const finalH = photoH * scaleFactor

    const gapX = 80
    const gapY = 60
    const startX = (sheetCanvas.width - (finalW * 2 + gapX)) / 2
    const startY = (sheetCanvas.height - (finalH * 2 + gapY)) / 2

    // Draw 4 copies with cut-marks
    const positions = [
      { x: startX, y: startY },
      { x: startX + finalW + gapX, y: startY },
      { x: startX, y: startY + finalH + gapY },
      { x: startX + finalW + gapX, y: startY + finalH + gapY },
    ]

    positions.forEach((pos) => {
      ctx.drawImage(canvas, pos.x, pos.y, finalW, finalH)
      // Cut line outline
      ctx.strokeStyle = '#CCCCCC'
      ctx.lineWidth = 1
      ctx.strokeRect(pos.x, pos.y, finalW, finalH)
    })

    // Studio Certification text on sheet
    ctx.fillStyle = '#666666'
    ctx.font = '24px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('SUPER SNAP STUDIO — OFFICIAL BIOMETRIC PASSPORT PRINT PLATE (4X6" ARCHIVAL)', sheetCanvas.width / 2, 40)

    const link = document.createElement('a')
    link.download = `SuperSnap-Passport-Print-Plate-4x6.png`
    link.href = sheetCanvas.toDataURL('image/png', 1.0)
    link.click()
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#D7FF3F', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          INTERNAL STUDIO UTILITY (OWNER ONLY)
        </span>
        <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', margin: '4px 0 0 0' }}>
          Biometric Passport & ID Photo Maker
        </h1>
        <p style={{ color: '#88907f', fontSize: '13px', margin: '6px 0 0 0' }}>
          Configure custom dimensions, precision-crop subject framing with biometric guides, and export official prints for client delivery.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
        {/* Left: Interactive Cropping Studio */}
        <div style={{
          backgroundColor: '#191C16',
          border: '1px solid rgba(244, 241, 233, 0.1)',
          borderRadius: '4px',
          padding: '24px',
        }}>
          {/* Upload Button */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              border: '2px dashed rgba(215, 255, 63, 0.3)',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: 'rgba(215, 255, 63, 0.02)',
            }}>
              <span style={{ color: '#D7FF3F', fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
                📁 {imageSrc ? 'Replace Portrait Photo' : 'Upload Client Portrait Photo'}
              </span>
              <span style={{ color: '#88907f', fontSize: '11px', fontFamily: 'ui-monospace, monospace' }}>
                Supports RAW/JPEG/PNG high-resolution headshots
              </span>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Interactive Preview Canvas */}
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              position: 'relative',
              height: '420px',
              backgroundColor: '#0A0B09',
              border: '1px solid rgba(244, 241, 233, 0.15)',
              borderRadius: '4px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
          >
            {imageSrc ? (
              <canvas
                ref={canvasRef}
                style={{
                  maxHeight: '380px',
                  maxWidth: '380px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#88907f', fontSize: '13px' }}>
                Upload portrait photo above to initiate biometric framing
              </div>
            )}

            {/* Biometric Overlay Lines */}
            {imageSrc && showGuidelines && (
              <div style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <div style={{
                  width: '180px',
                  height: '240px',
                  border: '1px dashed rgba(215, 255, 63, 0.6)',
                  borderRadius: '50%',
                  position: 'relative',
                }}>
                  {/* Eye line */}
                  <div style={{ position: 'absolute', top: '45%', left: 0, right: 0, height: '1px', backgroundColor: 'rgba(215, 255, 63, 0.4)' }} />
                  {/* Chin line */}
                  <div style={{ position: 'absolute', bottom: '10%', left: '20%', right: '20%', height: '1px', backgroundColor: 'rgba(215, 255, 63, 0.5)' }} />
                </div>
                <span style={{ color: '#D7FF3F', fontSize: '9px', fontFamily: 'ui-monospace, monospace', marginTop: '6px', backgroundColor: 'rgba(16, 17, 15, 0.7)', padding: '2px 6px' }}>
                  Biometric Face Guide (Crown to Chin)
                </span>
              </div>
            )}
          </div>

          {/* Controls: Zoom Slider */}
          {imageSrc && (
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'ui-monospace, monospace', color: '#88907f', marginBottom: '4px' }}>
                  <span>SCALE / ZOOM ({scale.toFixed(2)}x)</span>
                  <span>Drag photo above to pan</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="3"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#D7FF3F' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#F4F1E9' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showGuidelines}
                    onChange={(e) => setShowGuidelines(e.target.checked)}
                    style={{ accentColor: '#D7FF3F' }}
                  />
                  <span>Show Biometric Face Guides</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeStudioStamp}
                    onChange={(e) => setIncludeStudioStamp(e.target.checked)}
                    style={{ accentColor: '#D7FF3F' }}
                  />
                  <span>Include Registered Corporate Studio Seal</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Right: Specifications & Export Console */}
        <div style={{
          backgroundColor: '#191C16',
          border: '1px solid rgba(244, 241, 233, 0.1)',
          borderRadius: '4px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#D7FF3F', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              STANDARDS & DIMENSIONS
            </span>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0' }}>
              Country Specification Presets
            </h3>

            {/* Presets dropdown */}
            <div style={{ marginBottom: '20px' }}>
              <select
                value={selectedPresetIndex}
                onChange={(e) => handlePresetChange(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  height: '42px',
                  backgroundColor: '#10110F',
                  border: '1px solid rgba(244, 241, 233, 0.2)',
                  borderRadius: '4px',
                  color: '#F4F1E9',
                  padding: '0 12px',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                {PRESETS.map((p, idx) => (
                  <option key={p.name} value={idx}>
                    {p.name} ({p.widthMm} × {p.heightMm} mm)
                  </option>
                ))}
              </select>
            </div>

            {/* Dimension Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Width (mm)
                </label>
                <input
                  type="number"
                  value={widthMm}
                  onChange={(e) => setWidthMm(parseFloat(e.target.value) || 35)}
                  style={{
                    width: '100%',
                    height: '40px',
                    backgroundColor: '#10110F',
                    border: '1px solid rgba(244, 241, 233, 0.15)',
                    borderRadius: '4px',
                    color: '#F4F1E9',
                    padding: '0 12px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#88907f', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Height (mm)
                </label>
                <input
                  type="number"
                  value={heightMm}
                  onChange={(e) => setHeightMm(parseFloat(e.target.value) || 45)}
                  style={{
                    width: '100%',
                    height: '40px',
                    backgroundColor: '#10110F',
                    border: '1px solid rgba(244, 241, 233, 0.15)',
                    borderRadius: '4px',
                    color: '#F4F1E9',
                    padding: '0 12px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {currentPreset.note && (
              <div style={{
                padding: '12px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(244, 241, 233, 0.08)',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#dedad0',
                marginBottom: '24px',
                lineHeight: '1.5',
              }}>
                ℹ <strong>Standard Requirements:</strong> {currentPreset.note}
              </div>
            )}
          </div>

          {/* Export Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={downloadSinglePhoto}
              disabled={!imageSrc}
              style={{
                height: '46px',
                backgroundColor: '#D7FF3F',
                color: '#10110F',
                border: 'none',
                borderRadius: '4px',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                cursor: imageSrc ? 'pointer' : 'not-allowed',
                opacity: imageSrc ? 1 : 0.5,
              }}
            >
              Export Single Photo ({widthMm}×{heightMm}mm) ↗
            </button>

            <button
              onClick={downloadPrintSheet}
              disabled={!imageSrc}
              style={{
                height: '46px',
                backgroundColor: 'transparent',
                border: '1px solid #D7FF3F',
                color: '#D7FF3F',
                borderRadius: '4px',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                cursor: imageSrc ? 'pointer' : 'not-allowed',
                opacity: imageSrc ? 1 : 0.5,
              }}
            >
              Export 4-Up Printable Sheet (4×6") 📄
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
