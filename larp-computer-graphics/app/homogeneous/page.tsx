'use client'

import { useState, useEffect, useRef } from 'react'
import { Playfair_Display } from 'next/font/google'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
})

type Pt = [number, number]

function drawHomogScene(canvas: HTMLCanvasElement, px: number, py: number, h: number, k: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width, H = canvas.height
  const cx = W / 2, cy = H / 2
  const sc = 55

  ctx.fillStyle = '#100e0b'
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = '#1e1a14'
  ctx.lineWidth = 1
  for (let i = -6; i <= 6; i++) {
    ctx.beginPath(); ctx.moveTo(cx + i * sc, 0); ctx.lineTo(cx + i * sc, H); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, cy + i * sc); ctx.lineTo(W, cy + i * sc); ctx.stroke()
  }

  ctx.strokeStyle = '#3d3020'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()

  ctx.fillStyle = '#4a3828'
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
  ctx.fillStyle = '#5a4535'
  ctx.textAlign = 'left'
  ctx.fillText('x', W - 10, cy - 5)
  ctx.fillText('y', cx + 6, 13)

  const toC = (p: Pt): Pt => [cx + p[0] * sc, cy - p[1] * sc]

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

    const angle = Math.atan2(by - ay, bx - ax)
    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.moveTo(bx, by)
    ctx.lineTo(bx - 10 * Math.cos(angle - 0.4), by - 10 * Math.sin(angle - 0.4))
    ctx.lineTo(bx - 10 * Math.cos(angle + 0.4), by - 10 * Math.sin(angle + 0.4))
    ctx.closePath()
    ctx.fill()
  }

  const [ox, oy] = toC([px, py])
  ctx.beginPath()
  ctx.arc(ox, oy, 8, 0, Math.PI * 2)
  ctx.fillStyle = '#d97706'
  ctx.fill()
  ctx.strokeStyle = '#92400e'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = '#fcd34d'
  ctx.font = 'bold 11px monospace'
  ctx.textAlign = 'left'
  ctx.fillText(`(${px}, ${py})`, ox + 12, oy - 5)

  if (h !== 0 || k !== 0) {
    const [tx, ty] = toC([px + h, py + k])
    ctx.beginPath()
    ctx.arc(tx, ty, 8, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(254,243,199,0.9)'
    ctx.fill()
    ctx.strokeStyle = '#d97706'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = '#fef3c7'
    ctx.font = 'bold 11px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`(${px + h}, ${py + k})`, tx + 12, ty - 5)
  }

  ctx.font = '11px monospace'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#d97706'
  ctx.fillRect(10, 10, 11, 11)
  ctx.fillStyle = '#7a5c3a'
  ctx.fillText('Point (x, y)', 25, 19)
  if (h !== 0 || k !== 0) {
    ctx.fillStyle = 'rgba(254,243,199,0.9)'
    ctx.fillRect(10, 27, 11, 11)
    ctx.fillStyle = '#7a5c3a'
    ctx.fillText('Translated', 25, 36)
    ctx.strokeStyle = '#f59e0b80'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 3])
    ctx.beginPath(); ctx.moveTo(10, 49); ctx.lineTo(21, 49); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#7a5c3a'
    ctx.fillText('Translation', 25, 52)
  }
}

function SliderRow({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-amber-700/60 text-sm font-mono w-8">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 accent-amber-500"
      />
      <span className="text-amber-100/70 font-mono text-sm w-8 text-right">{value}</span>
    </div>
  )
}

function Matrix3x3({ values, highlight }: { values: (number | string)[][]; highlight?: [number, number][] }) {
  return (
    <div className="inline-flex items-stretch font-mono text-xs">
      <div className="w-2 border-l-2 border-t-2 border-b-2 border-amber-500/50 rounded-tl rounded-bl" />
      <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 tabular-nums py-1.5 px-0.5 text-right">
        {values.map((row, r) =>
          row.map((val, c) => {
            const isHl = highlight?.some(([hr, hc]) => hr === r && hc === c)
            return (
              <span key={`${r}-${c}`} className={`min-w-[1.5ch] ${isHl ? 'text-amber-400 font-bold' : 'text-amber-100/85'}`}>
                {val}
              </span>
            )
          })
        )}
      </div>
      <div className="w-2 border-r-2 border-t-2 border-b-2 border-amber-500/50 rounded-tr rounded-br" />
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
    <div className="bg-[#0e0c09] min-h-screen px-6 py-12">
      <div className="max-w-5xl mx-auto">

        <div className="mb-12 text-center">
          <div className="mb-6 flex items-center justify-center gap-4">
            <span className="h-px w-16 bg-amber-300/30" />
            <span className="text-[10px] font-light uppercase tracking-[0.55em] text-amber-300/50">Module II</span>
            <span className="h-px w-16 bg-amber-300/30" />
          </div>
          <h1 className={`${playfair.className} text-4xl sm:text-5xl font-bold italic text-amber-50 mb-4`}>
            Homogeneous Coordinates
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed text-sm">
            A clever trick that lets us represent <strong className="text-amber-200/70">translation</strong> as matrix
            multiplication — something a standard 2×2 matrix cannot do.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <div className="border border-amber-900/25 bg-[#131008] p-6">
            <h2 className={`${playfair.className} text-xl font-semibold text-amber-100 mb-3`}>The Problem</h2>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
              For a 2×2 matrix, the origin always maps to itself. So{' '}
              <em>translation cannot be linear</em>. It requires vector addition:
            </p>
            <div className="bg-[#0e0c09] border border-amber-900/20 p-4 font-mono text-sm text-center">
              <span className="text-amber-400">[x, y]</span>
              <span className="text-slate-500"> + </span>
              <span className="text-amber-300/60">[h, k]</span>
              <span className="text-slate-500"> = </span>
              <span className="text-amber-100/70">[x+h, y+k]</span>
            </div>
          </div>

          <div className="border border-amber-900/25 bg-[#131008] p-6">
            <h2 className={`${playfair.className} text-xl font-semibold text-amber-100 mb-3`}>The Solution</h2>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
              Embed 2D points into 3D by appending a 1:{' '}
              <span className="font-mono text-amber-400/80">(x, y) → (x, y, 1)</span>.
              Now translation becomes a 3×3 matrix multiply:
            </p>
            <div className="bg-[#0e0c09] border border-amber-900/20 p-4 font-mono text-sm text-center">
              <span className="text-amber-400">[x, y, 1]</span>
              <span className="text-slate-500"> · M = </span>
              <span className="text-amber-100/70">[x+h, y+k, 1]</span>
            </div>
          </div>
        </div>

        <div className="border border-amber-900/25 bg-[#131008] p-6 mb-10">
          <h2 className={`${playfair.className} text-xl font-semibold text-amber-100 mb-4`}>The Translation Matrix</h2>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-slate-400 text-sm mb-3">For translation by (h, k):</p>
              <Matrix3x3
                values={[['1','0','0'],['0','1','0'],['h','k','1']]}
                highlight={[[2,0],[2,1]]}
              />
            </div>
            <div className="text-amber-700/50 text-2xl">→</div>
            <div className="text-sm text-slate-400 max-w-xs">
              <p className="mb-2">Verify by multiplying:</p>
              <div className="bg-[#0e0c09] border border-amber-900/20 p-3 font-mono text-xs">
                <p className="text-amber-200/60">[x, y, 1] · [[1,0,0],[0,1,0],[h,k,1]]</p>
                <p className="mt-1 text-amber-400">= [x+h, y+k, 1] ✓</p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-amber-900/10 border border-amber-700/20 text-sm text-amber-300/70">
            Uses the <strong className="text-amber-300/90">row-vector convention</strong>: points are row vectors multiplied on the left.
          </div>
        </div>

        <div className="border border-amber-900/25 bg-[#131008] p-6 mb-10">
          <h2 className={`${playfair.className} text-xl font-semibold text-amber-100 mb-2`}>Interactive Demo</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Adjust the point position and translation vector. Watch the matrix update and the point move.
          </p>
          <div className="grid lg:grid-cols-2 gap-8">
            <canvas
              ref={canvasRef}
              width={480}
              height={360}
              className="w-full border border-amber-900/25"
            />
            <div className="space-y-6">
              <div>
                <p className={`${playfair.className} text-sm font-semibold text-amber-200/70 mb-3`}>Point coordinates</p>
                <div className="space-y-3">
                  <SliderRow label="x" value={px} min={-4} max={4} onChange={setPx} />
                  <SliderRow label="y" value={py} min={-4} max={4} onChange={setPy} />
                </div>
              </div>
              <div>
                <p className={`${playfair.className} text-sm font-semibold text-amber-200/70 mb-3`}>Translation vector</p>
                <div className="space-y-3">
                  <SliderRow label="h" value={h} min={-4} max={4} onChange={setH} />
                  <SliderRow label="k" value={k} min={-4} max={4} onChange={setK} />
                </div>
              </div>
              <div className="bg-[#0e0c09] border border-amber-900/20 p-4">
                <p className="text-[10px] uppercase tracking-[0.4em] text-amber-700/50 mb-3">Matrix equation</p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-amber-400/80 text-xs">[{px}, {py}, 1] ·</span>
                  <Matrix3x3 values={matrix} highlight={[[2,0],[2,1]]} />
                  <span className="text-slate-500">=</span>
                  <span className="font-mono text-amber-200/70 text-xs">[{px+h}, {py+k}, 1]</span>
                </div>
              </div>
              <div className="bg-[#0e0c09] border border-amber-900/20 p-4 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Original point</span>
                  <span className="font-mono text-amber-400/80">({px}, {py})</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Translation</span>
                  <span className="font-mono text-amber-300/60">(+{h}, +{k})</span>
                </div>
                <div className="flex justify-between text-xs font-semibold border-t border-amber-900/20 pt-1.5">
                  <span className="text-slate-400">Result</span>
                  <span className="font-mono text-amber-200/80">({px+h}, {py+k})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-amber-900/25 bg-[#131008] p-6 mb-10">
          <h2 className={`${playfair.className} text-xl font-semibold text-amber-100 mb-3`}>Extending to 3D</h2>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed">
            The same idea extends to 3D. A 3D point{' '}
            <span className="font-mono text-amber-400/80">(X, Y, Z)</span> becomes a homogeneous 4D point{' '}
            <span className="font-mono text-amber-400/80">(X, Y, Z, 1)</span>, and all transformations fit into a 4×4 matrix.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-[#0e0c09] border border-amber-900/20 p-4">
              <p className="text-[10px] uppercase tracking-[0.4em] text-amber-700/40 mb-3">Standard 3D point</p>
              <div className="inline-flex items-stretch font-mono text-sm">
                <div className="w-2 border-l-2 border-t-2 border-b-2 border-amber-500/50 rounded-tl rounded-bl" />
                <div className="grid grid-cols-1 gap-1 py-1.5 px-2">
                  <span className="text-amber-400">X</span>
                  <span className="text-amber-400">Y</span>
                  <span className="text-amber-400">Z</span>
                </div>
                <div className="w-2 border-r-2 border-t-2 border-b-2 border-amber-500/50 rounded-tr rounded-br" />
              </div>
            </div>
            <div className="bg-[#0e0c09] border border-amber-900/20 p-4">
              <p className="text-[10px] uppercase tracking-[0.4em] text-amber-700/40 mb-3">Homogeneous 3D point</p>
              <div className="inline-flex items-stretch font-mono text-sm">
                <div className="w-2 border-l-2 border-t-2 border-b-2 border-amber-500/50 rounded-tl rounded-bl" />
                <div className="grid grid-cols-1 gap-1 py-1.5 px-2">
                  <span className="text-amber-400">X</span>
                  <span className="text-amber-400">Y</span>
                  <span className="text-amber-400">Z</span>
                  <span className="text-amber-200/50">1</span>
                </div>
                <div className="w-2 border-r-2 border-t-2 border-b-2 border-amber-500/50 rounded-tr rounded-br" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Link
            href="/transformations"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-amber-900/40 text-amber-200/60 text-sm hover:border-amber-700/50 hover:text-amber-200/80 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Transformations
          </Link>
          <Link
            href="/composite"
            className="group relative inline-block overflow-hidden border border-amber-200/45 px-6 py-2.5"
          >
            <span className="absolute inset-0 translate-y-full bg-amber-100 transition-transform duration-500 ease-in-out group-hover:translate-y-0" aria-hidden="true" />
            <span className="relative z-10 text-[11px] font-normal uppercase tracking-[0.4em] text-amber-100 transition-all duration-500 group-hover:text-slate-800 inline-flex items-center gap-2">
              Composite <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
