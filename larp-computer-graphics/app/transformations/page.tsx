'use client'

import { useState, useEffect, useRef } from 'react'
import { Playfair_Display } from 'next/font/google'
import Link from 'next/link'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
})

type M2 = [[number, number], [number, number]]
type Pt = [number, number]

const SHAPE: Pt[] = [
  [-0.8, 0.4], [0.5, 0.4], [0.5, 0.9],
  [1.4, 0], [0.5, -0.9], [0.5, -0.4], [-0.8, -0.4],
]

function applyM2(m: M2, p: Pt): Pt {
  return [
    m[0][0] * p[0] + m[1][0] * p[1],
    m[0][1] * p[0] + m[1][1] * p[1],
  ]
}

function transformShape(m: M2, shape: Pt[]): Pt[] {
  return shape.map(p => applyM2(m, p))
}

const C45 = Math.cos(Math.PI / 4)
const S45 = Math.sin(Math.PI / 4)

interface Demo {
  name: string
  m: M2
  display: (string | number)[][]
  desc: string
  gif?: string
}

const DEMOS: Demo[] = [
  { name: 'Reflection (x₁-axis)', m: [[1, 0], [0, -1]], display: [['1', '0'], ['0', '−1']], desc: 'Flips every point across the horizontal axis' },
  { name: 'Reflection (x₂-axis)', m: [[-1, 0], [0, 1]], display: [['−1', '0'], ['0', '1']], desc: 'Flips every point across the vertical axis', gif: '/demos/Reflection.gif' },
  { name: 'Horizontal Expansion', m: [[2, 0], [0, 1]], display: [['k', '0'], ['0', '1']], desc: 'Scales x by factor k (shown: k = 2)' },
  { name: 'Vertical Expansion', m: [[1, 0], [0, 2]], display: [['1', '0'], ['0', 'k']], desc: 'Scales y by factor k (shown: k = 2)' },
  { name: 'Horizontal Shear', m: [[1, 0], [1, 1]], display: [['1', '0'], ['k', '1']], desc: 'Slants shape horizontally (shown: k = 1)' },
  { name: 'Vertical Shear', m: [[1, 1], [0, 1]], display: [['1', 'k'], ['0', '1']], desc: 'Slants shape vertically (shown: k = 1)' },
  { name: 'Projection (x₁-axis)', m: [[1, 0], [0, 0]], display: [['1', '0'], ['0', '0']], desc: 'Collapses all points onto the x-axis' },
  { name: 'Projection (x₂-axis)', m: [[0, 0], [0, 1]], display: [['0', '0'], ['0', '1']], desc: 'Collapses all points onto the y-axis' },
  { name: 'Rotation (θ = 45°)', m: [[C45, S45], [-S45, C45]], display: [['cos θ', 'sin θ'], ['−sin θ', 'cos θ']], desc: 'Rotates counter-clockwise by angle θ', gif: '/demos/Rotation.gif' },
]

// ── Matrix display ─────────────────────────────────────────────────────────────

function Matrix2x2({ rows }: { rows: (string | number)[][] }) {
  return (
    <div className="inline-flex items-stretch font-mono text-sm">
      <div className="w-2.5 border-l-2 border-t-2 border-b-2 border-amber-500/50 rounded-tl rounded-bl" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 tabular-nums py-1.5 px-1 text-right">
        {rows.flat().map((v, i) => (
          <span key={i} className="text-amber-100/85 min-w-[2.5ch]">{v}</span>
        ))}
      </div>
      <div className="w-2.5 border-r-2 border-t-2 border-b-2 border-amber-500/50 rounded-tr rounded-br" />
    </div>
  )
}

// ── Canvas drawing ─────────────────────────────────────────────────────────────

function drawMiniCanvas(canvas: HTMLCanvasElement, m: M2) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width, H = canvas.height
  const cx = W / 2, cy = H / 2
  const sc = 28

  ctx.fillStyle = '#100e0b'
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = '#1e1a14'
  ctx.lineWidth = 1
  for (let i = -5; i <= 5; i++) {
    ctx.beginPath(); ctx.moveTo(cx + i * sc, 0); ctx.lineTo(cx + i * sc, H); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, cy + i * sc); ctx.lineTo(W, cy + i * sc); ctx.stroke()
  }

  ctx.strokeStyle = '#3d3020'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()

  const toC = (p: Pt): [number, number] => [cx + p[0] * sc, cy - p[1] * sc]

  const drawPoly = (pts: Pt[], fill: string, stroke: string, lw: number, dashed: boolean) => {
    if (!pts.length) return
    const s = pts.map(toC)
    ctx.beginPath()
    ctx.moveTo(s[0][0], s[0][1])
    for (let i = 1; i < s.length; i++) ctx.lineTo(s[i][0], s[i][1])
    ctx.closePath()
    ctx.fillStyle = fill
    ctx.fill()
    ctx.strokeStyle = stroke
    ctx.lineWidth = lw
    ctx.setLineDash(dashed ? [4, 3] : [])
    ctx.stroke()
    ctx.setLineDash([])
  }

  drawPoly(transformShape(m, SHAPE), 'rgba(254,243,199,0.07)', 'rgba(254,243,199,0.45)', 1.5, true)
  drawPoly(SHAPE, 'rgba(217,119,6,0.18)', '#d97706', 1.5, false)
}

// ── TransformCard ──────────────────────────────────────────────────────────────

function TransformCard({ demo }: { demo: Demo }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gifFailed, setGifFailed] = useState(false)
  const showGif = !!demo.gif && !gifFailed

  useEffect(() => {
    if (canvasRef.current) drawMiniCanvas(canvasRef.current, demo.m)
  }, [demo.m])

  return (
    <div className="border border-amber-900/25 bg-[#131008] p-4 transition-all duration-300 hover:border-amber-700/35 hover:bg-[#1a1208]">
      <div className="relative h-[150px]">
        <canvas
          ref={canvasRef}
          width={200}
          height={150}
          className={`absolute inset-0 w-full h-full ${showGif ? 'hidden' : ''}`}
        />
        {demo.gif && !gifFailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={demo.gif}
            alt={demo.name}
            className="absolute inset-0 w-full h-full object-contain"
            onError={() => setGifFailed(true)}
          />
        )}
      </div>
      <div className="mt-3 space-y-2 text-center">
        <p className={`${playfair.className} text-sm font-semibold text-amber-100/85`}>{demo.name}</p>
        <div className="flex justify-center">
          <Matrix2x2 rows={demo.display} />
        </div>
        <p className="text-xs text-amber-100/40 leading-relaxed">{demo.desc}</p>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TransformationsPage() {
  return (
    <div className="bg-[#0e0c09] min-h-screen px-6 py-12">
      <div className="max-w-6xl mx-auto">

        <div className="mb-12 text-center">
          <div className="mb-6 flex items-center justify-center gap-4">
            <span className="h-px w-16 bg-amber-300/30" />
            <span className="text-[10px] font-light uppercase tracking-[0.55em] text-amber-300/50">Module I</span>
            <span className="h-px w-16 bg-amber-300/30" />
          </div>
          <h1 className={`${playfair.className} text-4xl sm:text-5xl font-bold italic text-amber-50 mb-4`}>
            Basic Transformations
          </h1>
          <p className="text-amber-50 max-w-2xl mx-auto leading-relaxed text-sm">
            A <strong className="text-amber-200/70">linear transformation</strong> maps every point via matrix
            multiplication. Using the row-vector convention{' '}
            <span className="font-mono text-amber-400/80">[x, y] · M</span>, the origin always stays fixed.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-14">
          {DEMOS.map(demo => <TransformCard key={demo.name} demo={demo} />)}
        </div>

        <div className="text-center">
          <Link
            href="/transformations/game"
            className="group relative inline-block overflow-hidden border border-amber-200/45 px-12 py-[13px]"
          >
            <span className="absolute inset-0 translate-y-full bg-amber-100 transition-transform duration-500 ease-in-out group-hover:translate-y-0" aria-hidden="true" />
            <span className="relative z-10 text-[11px] font-normal uppercase tracking-[0.5em] text-amber-100 transition-all duration-500 group-hover:tracking-[0.65em] group-hover:text-slate-800">
              Next
            </span>
          </Link>
        </div>

      </div>
    </div>
  )
}
