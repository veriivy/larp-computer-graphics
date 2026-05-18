'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

type Pt = [number, number]

function drawHomogScene(canvas: HTMLCanvasElement, px: number, py: number, h: number, k: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width
  const H = canvas.height
  const cx = W / 2
  const cy = H / 2
  const sc = 55

  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, W, H)

  // Grid
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 1
  for (let i = -6; i <= 6; i++) {
    ctx.beginPath(); ctx.moveTo(cx + i * sc, 0); ctx.lineTo(cx + i * sc, H); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, cy + i * sc); ctx.lineTo(W, cy + i * sc); ctx.stroke()
  }

  // Axes
  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()

  // Axis labels
  ctx.fillStyle = '#475569'
  ctx.font = '11px monospace'
  ctx.textAlign = 'center'
  for (let i = -5; i <= 5; i++) {
    if (i === 0) continue
    ctx.fillText(String(i), cx + i * sc, cy + 14)
  }
  ctx.textAlign = 'right'
  for (let i = -4; i <= 4; i++) {
    if (i === 0) continue
    ctx.fillText(String(-i), cx - 4, cy + i * sc + 4)
  }
  ctx.fillStyle = '#64748b'
  ctx.textAlign = 'left'
  ctx.fillText('x', W - 10, cy - 5)
  ctx.fillText('y', cx + 6, 13)

  const toC = (p: Pt): Pt => [cx + p[0] * sc, cy - p[1] * sc]

  // Translation vector arrow
  const [ax, ay] = toC([px, py])
  const [bx, by] = toC([px + h, py + k])

  if (h !== 0 || k !== 0) {
    ctx.strokeStyle = '#f59e0b80'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 4])
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    ctx.stroke()
    ctx.setLineDash([])

    // Arrowhead
    const angle = Math.atan2(by - ay, bx - ax)
    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.moveTo(bx, by)
    ctx.lineTo(bx - 10 * Math.cos(angle - 0.4), by - 10 * Math.sin(angle - 0.4))
    ctx.lineTo(bx - 10 * Math.cos(angle + 0.4), by - 10 * Math.sin(angle + 0.4))
    ctx.closePath()
    ctx.fill()
  }

  // Original point (blue)
  const [ox, oy] = toC([px, py])
  ctx.beginPath()
  ctx.arc(ox, oy, 8, 0, Math.PI * 2)
  ctx.fillStyle = '#3b82f6'
  ctx.fill()
  ctx.strokeStyle = '#1d4ed8'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = '#93c5fd'
  ctx.font = 'bold 11px monospace'
  ctx.textAlign = 'left'
  ctx.fillText(`(${px}, ${py})`, ox + 12, oy - 5)

  // Translated point (green)
  if (h !== 0 || k !== 0) {
    const [tx, ty] = toC([px + h, py + k])
    ctx.beginPath()
    ctx.arc(tx, ty, 8, 0, Math.PI * 2)
    ctx.fillStyle = '#22c55e'
    ctx.fill()
    ctx.strokeStyle = '#15803d'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = '#86efac'
    ctx.font = 'bold 11px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`(${px + h}, ${py + k})`, tx + 12, ty - 5)
  }

  // Legend
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#3b82f6'; ctx.fillRect(8, 8, 11, 11)
  ctx.fillStyle = '#94a3b8'; ctx.fillText('Point (x, y)', 23, 18)
  if (h !== 0 || k !== 0) {
    ctx.fillStyle = '#22c55e'; ctx.fillRect(8, 25, 11, 11)
    ctx.fillStyle = '#94a3b8'; ctx.fillText('Translated point', 23, 35)
    ctx.strokeStyle = '#f59e0b80'; ctx.lineWidth = 2
    ctx.setLineDash([4, 3])
    ctx.beginPath(); ctx.moveTo(8, 47); ctx.lineTo(19, 47); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#94a3b8'; ctx.fillText('Translation vector', 23, 51)
  }
}

function SliderRow({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-slate-400 text-sm font-mono w-8">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 accent-blue-500"
      />
      <span className="text-white font-mono text-sm w-8 text-right">{value}</span>
    </div>
  )
}

function Matrix3x3({ values, highlight }: { values: (number | string)[][]; highlight?: [number, number][] }) {
  return (
    <div className="font-mono text-sm inline-flex items-center gap-1">
      <span className="text-slate-400 text-2xl leading-[1.1]" style={{ fontWeight: 100 }}>⎡<br />⎢<br />⎣</span>
      <div className="grid grid-cols-3 gap-x-4 gap-y-1 tabular-nums text-center">
        {values.map((row, r) =>
          row.map((val, c) => {
            const isHighlighted = highlight?.some(([hr, hc]) => hr === r && hc === c)
            return (
              <span key={`${r}-${c}`} className={isHighlighted ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                {val}
              </span>
            )
          })
        )}
      </div>
      <span className="text-slate-400 text-2xl leading-[1.1]" style={{ fontWeight: 100 }}>⎤<br />⎥<br />⎦</span>
    </div>
  )
}

export default function HomogeneousPage() {
  const [px, setPx] = useState(1)
  const [py, setPy] = useState(2)
  const [h, setH] = useState(2)
  const [k, setK] = useState(-1)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) drawHomogScene(canvasRef.current, px, py, h, k)
  }, [px, py, h, k])

  const matrix: (number | string)[][] = [
    [1, 0, 0],
    [0, 1, 0],
    [h, k, 1],
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Link href="/transformations" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Transformations
      </Link>

      <h1 className="text-4xl font-bold text-white mb-3">Homogeneous Coordinates</h1>
      <p className="text-slate-400 text-lg mb-10">
        A clever trick that lets us represent <strong className="text-slate-200">translation</strong> as matrix multiplication —
        something a standard 2×2 matrix cannot do.
      </p>

      {/* Concept cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-3">The Problem</h2>
          <p className="text-slate-400 text-sm mb-4">
            For a 2×2 matrix, the origin always maps to itself: M·[0,0]ᵀ = [0,0]ᵀ.
            So <em>translation cannot be a linear transformation</em>. Instead, it requires vector addition:
          </p>
          <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm text-center">
            <span className="text-blue-400">[x, y]</span>
            <span className="text-slate-400"> + </span>
            <span className="text-amber-400">[h, k]</span>
            <span className="text-slate-400"> = </span>
            <span className="text-green-400">[x+h, y+k]</span>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-3">The Solution</h2>
          <p className="text-slate-400 text-sm mb-4">
            Embed 2D points into 3D by appending a 1: <span className="font-mono text-blue-400">(x, y) → (x, y, 1)</span>.
            Now translation becomes a 3×3 matrix multiplication:
          </p>
          <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm text-center">
            <span className="text-blue-400">[x, y, 1]</span>
            <span className="text-slate-400"> · M = </span>
            <span className="text-green-400">[x+h, y+k, 1]</span>
          </div>
        </div>
      </div>

      {/* Translation matrix explanation */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mb-12">
        <h2 className="text-xl font-bold text-white mb-4">The Translation Matrix</h2>
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-slate-400 text-sm mb-3">For translation by (h, k):</p>
            <Matrix3x3
              values={[['1','0','0'],['0','1','0'],['h','k','1']]}
              highlight={[[2,0],[2,1]]}
            />
          </div>
          <div className="text-slate-500 text-2xl">→</div>
          <div className="text-sm text-slate-400 max-w-xs">
            <p className="mb-2">Verify by multiplying:</p>
            <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs">
              <p>[x, y, 1] ·</p>
              <p className="ml-2">[[1,0,0],[0,1,0],[h,k,1]]</p>
              <p className="mt-1 text-green-400">= [x+h, y+k, 1] ✓</p>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-300">
          Note: This uses the <strong>row-vector convention</strong> where points are row vectors multiplied on the left.
          This is consistent with the composite transformation matrices on the next page.
        </div>
      </div>

      {/* Interactive demo */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mb-10">
        <h2 className="text-xl font-bold text-white mb-2">Interactive Demo</h2>
        <p className="text-slate-400 text-sm mb-6">
          Adjust the point position and translation vector. Watch the matrix update and the point move on the canvas.
        </p>
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <canvas
              ref={canvasRef}
              width={480}
              height={360}
              className="w-full rounded-xl border border-slate-700/50"
            />
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-slate-300 font-semibold text-sm mb-3">Point coordinates</p>
              <div className="space-y-3">
                <SliderRow label="x" value={px} min={-4} max={4} onChange={setPx} />
                <SliderRow label="y" value={py} min={-4} max={4} onChange={setPy} />
              </div>
            </div>
            <div>
              <p className="text-slate-300 font-semibold text-sm mb-3">Translation vector</p>
              <div className="space-y-3">
                <SliderRow label="h" value={h} min={-4} max={4} onChange={setH} />
                <SliderRow label="k" value={k} min={-4} max={4} onChange={setK} />
              </div>
            </div>
            <div className="bg-slate-900 rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-3 font-semibold uppercase tracking-wide">Matrix equation</p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="font-mono text-blue-400 text-xs">
                  [{px}, {py}, 1] ·
                </div>
                <Matrix3x3 values={matrix} highlight={[[2,0],[2,1]]} />
                <span className="text-slate-400">=</span>
                <div className="font-mono text-green-400 text-xs">
                  [{px + h}, {py + k}, 1]
                </div>
              </div>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 text-sm">
              <div className="flex justify-between text-slate-400 text-xs mb-1">
                <span>Original point</span>
                <span className="font-mono text-blue-400">({px}, {py})</span>
              </div>
              <div className="flex justify-between text-slate-400 text-xs mb-1">
                <span>Translation</span>
                <span className="font-mono text-amber-400">(+{h}, +{k})</span>
              </div>
              <div className="flex justify-between text-slate-300 text-xs font-semibold border-t border-slate-700 pt-1 mt-1">
                <span>Result</span>
                <span className="font-mono text-green-400">({px + h}, {py + k})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Homogeneous 3D note */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mb-10">
        <h2 className="text-xl font-bold text-white mb-3">Extending to 3D</h2>
        <p className="text-slate-400 text-sm mb-4">
          The same idea extends to 3D graphics. A 3D point <span className="font-mono text-blue-400">(X, Y, Z)</span> becomes
          a homogeneous 4D point <span className="font-mono text-blue-400">(X, Y, Z, 1)</span>, and all transformations
          (including translation) fit into a 4×4 matrix.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-slate-900 rounded-xl p-4">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Standard 3D point</p>
            <div className="font-mono text-sm inline-flex items-center gap-1">
              <span className="text-slate-400 text-xl leading-none">⎡<br />⎢<br />⎣</span>
              <div className="grid grid-cols-1 gap-0.5">
                <span className="text-blue-400">X</span>
                <span className="text-blue-400">Y</span>
                <span className="text-blue-400">Z</span>
              </div>
              <span className="text-slate-400 text-xl leading-none">⎤<br />⎥<br />⎦</span>
            </div>
          </div>
          <div className="bg-slate-900 rounded-xl p-4">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Homogeneous 3D point</p>
            <div className="font-mono text-sm inline-flex items-center gap-1">
              <span className="text-slate-400 text-xl leading-none">⎡<br />⎢<br />⎢<br />⎣</span>
              <div className="grid grid-cols-1 gap-0.5">
                <span className="text-blue-400">X</span>
                <span className="text-blue-400">Y</span>
                <span className="text-blue-400">Z</span>
                <span className="text-amber-400">1</span>
              </div>
              <span className="text-slate-400 text-xl leading-none">⎤<br />⎥<br />⎥<br />⎦</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Link href="/transformations" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 rounded-lg text-white font-semibold hover:bg-slate-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Transformations
        </Link>
        <Link href="/composite" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity">
          Composite Transformations <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
