'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Playfair_Display } from 'next/font/google'
import Link from 'next/link'
import { RotateCcw, Undo2, Save, Check } from 'lucide-react'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
})

type Pt = [number, number]

const CANVAS_W = 500
const CANVAS_H = 400
const SC = 55  // same scale as game canvas

function canvasToCoord(
  e: React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
): Pt {
  const rect = canvas.getBoundingClientRect()
  const px = (e.clientX - rect.left) * (canvas.width / rect.width)
  const py = (e.clientY - rect.top) * (canvas.height / rect.height)
  const cx = canvas.width / 2, cy = canvas.height / 2
  return [
    Math.round(((px - cx) / SC) * 100) / 100,
    Math.round(((cy - py) / SC) * 100) / 100,
  ]
}

function compressImage(img: HTMLImageElement): string {
  const MAX = 360
  const ratio = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1)
  const c = document.createElement('canvas')
  c.width = Math.round(img.naturalWidth * ratio)
  c.height = Math.round(img.naturalHeight * ratio)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.88)
}

function redraw(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement | null,
  points: Pt[],
  hover: Pt | null,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width, H = canvas.height
  const cx = W / 2, cy = H / 2

  ctx.fillStyle = '#100e0b'
  ctx.fillRect(0, 0, W, H)

  if (img) {
    const FIT_W = 6 * SC, FIT_H = 5 * SC
    const imgScale = Math.min(FIT_W / img.naturalWidth, FIT_H / img.naturalHeight, 1)
    const iw = img.naturalWidth * imgScale, ih = img.naturalHeight * imgScale
    ctx.globalAlpha = 0.6
    ctx.drawImage(img, cx - iw / 2, cy - ih / 2, iw, ih)
    ctx.globalAlpha = 1
  }

  // Grid
  ctx.strokeStyle = '#1e1a14'
  ctx.lineWidth = 1
  for (let i = -6; i <= 6; i++) {
    ctx.beginPath(); ctx.moveTo(cx + i * SC, 0); ctx.lineTo(cx + i * SC, H); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, cy + i * SC); ctx.lineTo(W, cy + i * SC); ctx.stroke()
  }
  ctx.strokeStyle = '#3d3020'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()

  const toC = (p: Pt): [number, number] => [cx + p[0] * SC, cy - p[1] * SC]

  // Hover preview line from last point
  if (hover && points.length > 0) {
    const last = toC(points[points.length - 1])
    const hc = toC(hover)
    ctx.beginPath()
    ctx.moveTo(last[0], last[1])
    ctx.lineTo(hc[0], hc[1])
    ctx.strokeStyle = 'rgba(217,119,6,0.35)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 3])
    ctx.stroke()
    ctx.setLineDash([])
  }

  if (points.length > 0) {
    const cs = points.map(toC)

    // Filled polygon
    ctx.beginPath()
    ctx.moveTo(cs[0][0], cs[0][1])
    for (let i = 1; i < cs.length; i++) ctx.lineTo(cs[i][0], cs[i][1])
    if (points.length >= 3) {
      ctx.closePath()
      ctx.fillStyle = 'rgba(217,119,6,0.12)'
      ctx.fill()
    }
    ctx.strokeStyle = '#d97706'
    ctx.lineWidth = 2
    ctx.stroke()

    // Closing preview dash back to first point
    if (hover && points.length >= 2) {
      const hc = toC(hover)
      ctx.beginPath()
      ctx.moveTo(hc[0], hc[1])
      ctx.lineTo(cs[0][0], cs[0][1])
      ctx.strokeStyle = 'rgba(217,119,6,0.20)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 4])
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Vertex dots and labels
    cs.forEach(([x, y], i) => {
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#d97706'
      ctx.fill()
      ctx.fillStyle = 'rgba(254,243,199,0.75)'
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(String(i + 1), x, y - 7)
      ctx.textBaseline = 'alphabetic'
    })
  }

  // Hover dot
  if (hover) {
    const hc = toC(hover)
    ctx.beginPath()
    ctx.arc(hc[0], hc[1], 3.5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(217,119,6,0.7)'
    ctx.fill()
  }
}

export default function SetupPage() {
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null)
  const [points, setPoints] = useState<Pt[]>([])
  const [hover, setHover] = useState<Pt | null>(null)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load existing from localStorage on mount
  useEffect(() => {
    try {
      const savedImg = localStorage.getItem('remy-img')
      const savedShape = localStorage.getItem('remy-shape')
      if (savedImg) {
        const img = new Image()
        img.onload = () => setImgEl(img)
        img.src = savedImg
        setImgSrc(savedImg)
      }
      if (savedShape) {
        const pts = JSON.parse(savedShape) as Pt[]
        if (Array.isArray(pts) && pts.length >= 3) setPoints(pts)
      }
    } catch {}
  }, [])

  const draw = useCallback(() => {
    if (canvasRef.current) redraw(canvasRef.current, imgEl, points, hover)
  }, [imgEl, points, hover])

  useEffect(() => { draw() }, [draw])

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        setImgEl(img)
        setImgSrc(compressImage(img))
        setPoints([])
        setSaved(false)
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!canvasRef.current) return
    const pt = canvasToCoord(e, canvasRef.current)
    setPoints(ps => [...ps, pt])
    setSaved(false)
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!canvasRef.current) return
    setHover(canvasToCoord(e, canvasRef.current))
  }

  function handleSave() {
    if (!imgSrc || points.length < 3) return
    setSaveError('')
    try {
      localStorage.setItem('remy-img', imgSrc)
      localStorage.setItem('remy-shape', JSON.stringify(points))
      setSaved(true)
    } catch {
      setSaveError('Storage full — try a smaller image.')
    }
  }

  function handleReset() {
    localStorage.removeItem('remy-img')
    localStorage.removeItem('remy-shape')
    setImgSrc(null)
    setImgEl(null)
    setPoints([])
    setSaved(false)
  }

  const canSave = !!imgSrc && points.length >= 3

  return (
    <div className="bg-[#0e0c09] min-h-screen px-6 py-12">
      <div className="max-w-5xl mx-auto">

        <div className="mb-10 flex items-center justify-center gap-4">
          <span className="h-px w-16 bg-amber-300/30" />
          <span className="text-[10px] font-light uppercase tracking-[0.55em] text-amber-300/50">Restaurant Remy — Setup</span>
          <span className="h-px w-16 bg-amber-300/30" />
        </div>

        <h1 className={`${playfair.className} text-4xl font-bold italic text-amber-50 mb-2 text-center`}>
          Configure Shape
        </h1>
        <p className="text-slate-400 text-sm text-center mb-10 max-w-lg mx-auto leading-relaxed">
          Upload your image, then click around its outline on the canvas to trace the silhouette polygon.
          Points are placed in game coordinate space and saved to this browser.
        </p>

        <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-start">

          {/* Canvas */}
          <div className="border border-amber-900/25 bg-[#131008]">
            <div className="px-4 py-3 border-b border-amber-900/20 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.45em] text-amber-700/50">
                Click to place vertices
              </p>
              {hover && (
                <span className="font-mono text-[10px] text-amber-700/40">
                  ({hover[0].toFixed(2)}, {hover[1].toFixed(2)})
                </span>
              )}
            </div>
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="w-full cursor-crosshair"
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHover(null)}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">

            {/* Image upload */}
            <div className="border border-amber-900/25 bg-[#131008] p-4">
              <p className="text-[10px] uppercase tracking-[0.45em] text-amber-700/50 mb-3">Image</p>
              <label className="cursor-pointer block">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="sr-only" />
                <div className={`border px-4 py-3 text-center text-xs transition-colors ${
                  imgSrc
                    ? 'border-amber-600/50 text-amber-300/70'
                    : 'border-amber-900/30 text-amber-200/40 hover:border-amber-700/50 hover:text-amber-200/60'
                }`}>
                  {imgSrc ? '✓ Image loaded — click to replace' : 'Upload image'}
                </div>
              </label>
            </div>

            {/* Points list */}
            <div className="border border-amber-900/25 bg-[#131008] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-[0.45em] text-amber-700/50">
                  Vertices <span className="text-amber-900/50">({points.length})</span>
                </p>
                {points.length >= 3 && (
                  <span className="text-[10px] text-amber-700/40">polygon closed</span>
                )}
              </div>
              {points.length === 0 ? (
                <p className="text-[11px] text-amber-900/40 italic">No points yet — click the canvas</p>
              ) : (
                <div className="space-y-0.5 max-h-48 overflow-y-auto">
                  {points.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 py-1 border-b border-amber-900/10">
                      <span className={`${playfair.className} italic text-amber-700/35 text-xs w-4 text-right shrink-0`}>{i + 1}</span>
                      <span className="font-mono text-[11px] text-amber-200/50 flex-1">
                        ({p[0].toFixed(2)}, {p[1].toFixed(2)})
                      </span>
                      <button
                        onClick={() => { setPoints(ps => ps.filter((_, j) => j !== i)); setSaved(false) }}
                        className="text-amber-900/40 hover:text-amber-700/60 text-xs transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => { setPoints(ps => ps.slice(0, -1)); setSaved(false) }}
                disabled={points.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-amber-900/30 text-amber-200/50 text-xs hover:border-amber-700/50 hover:text-amber-200/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Undo2 size={13} /> Undo last point
              </button>
              <button
                onClick={() => { setPoints([]); setSaved(false) }}
                disabled={points.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-amber-900/30 text-amber-200/50 text-xs hover:border-amber-700/50 hover:text-amber-200/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <RotateCcw size={13} /> Clear all points
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 border text-xs transition-all duration-200 ${
                saved
                  ? 'border-amber-600/50 text-amber-300/80 bg-amber-900/10'
                  : canSave
                    ? 'border-amber-200/45 text-amber-100 hover:bg-amber-100 hover:text-slate-800'
                    : 'border-amber-900/20 text-amber-900/40 cursor-not-allowed'
              }`}
            >
              {saved ? <><Check size={13} /> Saved to browser</> : <><Save size={13} /> Save &amp; apply</>}
            </button>

            {saveError && (
              <p className="text-[11px] text-red-400/70">{saveError}</p>
            )}

            {!canSave && (
              <p className="text-[10px] text-amber-900/40 text-center">
                {!imgSrc ? 'Upload an image first' : 'Place at least 3 vertices'}
              </p>
            )}

            <div className="pt-2 border-t border-amber-900/15 space-y-2">
              <button
                onClick={handleReset}
                className="w-full text-[10px] text-amber-900/40 hover:text-amber-700/60 transition-colors py-1"
              >
                Reset to built-in defaults
              </button>
              <Link
                href="/transformations/game"
                className="block text-center text-[10px] text-amber-700/50 hover:text-amber-600/70 transition-colors py-1"
              >
                ← Back to game
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
