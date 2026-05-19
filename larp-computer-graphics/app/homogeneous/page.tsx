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
type H3 = [number, number, number]  // [x_2d, w_homog, y_2d] — w_homog maps to "up" in scene

// Shape used in the homogeneous visualization (scaled to fit well in the W=1 plane)
const DEMO_SHAPE: Pt[] = [
  [ 0.04,  0.70], [ 0.24,  0.52], [ 0.36,  0.20],
  [ 0.34, -0.10], [ 0.22, -0.36], [ 0.04, -0.44],
  [-0.04, -0.44], [-0.22, -0.36], [-0.34, -0.10],
  [-0.36,  0.20], [-0.24,  0.52], [-0.04,  0.70],
]

// 3D visualization: shows a shape at w=1 (the canonical w=1 plane, amber)
// and the same shape at w=wVal (cream, floating in homogeneous space).
// Dashed rays connect them, showing they represent the same 2D point.
function drawHomogScene(canvas: HTMLCanvasElement, wVal: number, h: number, k: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width, H = canvas.height
  const scx = W * 0.50, scy = H * 0.52

  const VY = -0.42, VP = -0.40, VD = 13, VSCL = 60, centW = 1.3

  function w2s([x, wh, y]: H3): [number, number] {
    let wx = x, wy = wh - centW, wz = y
    const cyy = Math.cos(VY), syy = Math.sin(VY)
    const nx = cyy*wx + syy*wz; wz = -syy*wx + cyy*wz; wx = nx
    const cpp = Math.cos(VP), spp = Math.sin(VP)
    const ny = cpp*wy - spp*wz; wz = spp*wy + cpp*wz; wy = ny
    const dz = wz + VD
    if (dz < 0.01) return [scx, scy]
    const s = VSCL * VD / dz
    return [scx + wx*s, scy - wy*s]
  }

  ctx.fillStyle = '#0e0c09'
  ctx.fillRect(0, 0, W, H)

  // === COORDINATE AXES ===
  const AL = 2.6
  const [o0, o1] = w2s([0, 0, 0])

  ctx.lineWidth = 1.5
  ctx.strokeStyle = '#3a2a18'
  const [xx, xy] = w2s([AL, 0, 0])
  ctx.beginPath(); ctx.moveTo(o0, o1); ctx.lineTo(xx, xy); ctx.stroke()
  const [yx, yy] = w2s([0, 0, AL])
  ctx.beginPath(); ctx.moveTo(o0, o1); ctx.lineTo(yx, yy); ctx.stroke()
  ctx.strokeStyle = '#6a4020'
  const [wx2, wy2] = w2s([0, AL, 0])
  ctx.beginPath(); ctx.moveTo(o0, o1); ctx.lineTo(wx2, wy2); ctx.stroke()

  const ctx2 = ctx
  function arrowHead(ax: number, ay: number, bx: number, by: number, col: string) {
    const angle = Math.atan2(by - ay, bx - ax)
    ctx2.fillStyle = col
    ctx2.beginPath()
    ctx2.moveTo(bx, by)
    ctx2.lineTo(bx - 8*Math.cos(angle-0.35), by - 8*Math.sin(angle-0.35))
    ctx2.lineTo(bx - 8*Math.cos(angle+0.35), by - 8*Math.sin(angle+0.35))
    ctx2.closePath(); ctx2.fill()
  }
  arrowHead(o0, o1, xx, xy, '#3a2a18')
  arrowHead(o0, o1, yx, yy, '#3a2a18')
  arrowHead(o0, o1, wx2, wy2, '#6a4020')

  ctx.font = '11px monospace'
  const [lxx, lxy] = w2s([AL+0.25, 0, 0])
  const [lyx, lyy] = w2s([0, 0, AL+0.25])
  const [lwx, lwy] = w2s([0, AL+0.25, 0])
  ctx.textAlign = 'center'
  ctx.fillStyle = '#4a3828'; ctx.fillText('x', lxx, lxy)
  ctx.fillStyle = '#4a3828'; ctx.fillText('y', lyx, lyy)
  ctx.fillStyle = '#9a6030'; ctx.fillText('w', lwx, lwy)

  // === W=1 FLOOR GRID ===
  const GE = 2.1, GN = 5
  ctx.strokeStyle = '#201a0f'
  ctx.lineWidth = 0.5
  for (let i = 0; i <= GN; i++) {
    const t = -GE + (2*GE/GN)*i
    const [ax, ay] = w2s([t, 1, -GE])
    const [bx, by] = w2s([t, 1,  GE])
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke()
    const [cx2, cy2] = w2s([-GE, 1, t])
    const [dx, dy]   = w2s([ GE, 1, t])
    ctx.beginPath(); ctx.moveTo(cx2, cy2); ctx.lineTo(dx, dy); ctx.stroke()
  }

  const fc = [[-GE,1,-GE],[GE,1,-GE],[GE,1,GE],[-GE,1,GE]].map(c => w2s(c as H3))
  ctx.fillStyle = '#f59e0b06'
  ctx.beginPath(); ctx.moveTo(fc[0][0], fc[0][1])
  fc.slice(1).forEach(([p, q]) => ctx.lineTo(p, q)); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = '#f59e0b30'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(fc[0][0], fc[0][1])
  fc.slice(1).forEach(([p, q]) => ctx.lineTo(p, q)); ctx.closePath(); ctx.stroke()

  const [wlx, wly] = w2s([-GE-0.1, 1, 0])
  ctx.fillStyle = '#f59e0b48'; ctx.font = '10px monospace'; ctx.textAlign = 'right'
  ctx.fillText('w = 1', wlx, wly)

  // === GHOST SHAPE at origin (before translation) ===
  const hasTranslation = Math.abs(h) > 0.01 || Math.abs(k) > 0.01
  if (hasTranslation) {
    const gp = DEMO_SHAPE.map(([sx, sy]) => w2s([sx, 1, sy]))
    ctx.strokeStyle = 'rgba(217,119,6,0.22)'; ctx.lineWidth = 1; ctx.setLineDash([2, 3])
    ctx.beginPath(); ctx.moveTo(gp[0][0], gp[0][1])
    gp.slice(1).forEach(([p, q]) => ctx.lineTo(p, q)); ctx.closePath(); ctx.stroke()
    ctx.setLineDash([])

    // Translation arrow on the w=1 plane
    const [oax, oay] = w2s([0, 1, 0])
    const [tax, tay] = w2s([h, 1, k])
    ctx.strokeStyle = 'rgba(251,191,36,0.45)'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(oax, oay); ctx.lineTo(tax, tay); ctx.stroke()
    arrowHead(oax, oay, tax, tay, 'rgba(251,191,36,0.60)')
  }

  // === TRANSLATED SHAPE at w=1 (amber) ===
  const fp = DEMO_SHAPE.map(([sx, sy]) => w2s([sx + h, 1, sy + k]))
  ctx.fillStyle = 'rgba(217,119,6,0.14)'; ctx.strokeStyle = 'rgba(217,119,6,0.72)'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(fp[0][0], fp[0][1])
  fp.slice(1).forEach(([p, q]) => ctx.lineTo(p, q)); ctx.closePath(); ctx.fill(); ctx.stroke()
  fp.forEach(([p, q]) => {
    ctx.beginPath(); ctx.arc(p, q, 2, 0, Math.PI*2)
    ctx.fillStyle = 'rgba(253,186,116,0.68)'; ctx.fill()
  })

  if (Math.abs(wVal - 1) > 0.04) {
    // === PROJECTION RAYS (floor → floating shape) ===
    ctx.strokeStyle = 'rgba(254,243,199,0.13)'; ctx.lineWidth = 1; ctx.setLineDash([2, 4])
    DEMO_SHAPE.forEach(([sx, sy], i) => {
      const [fx, fy] = fp[i]
      const [lx2, ly2] = w2s([(sx+h)*wVal, wVal, (sy+k)*wVal])
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(lx2, ly2); ctx.stroke()
    })
    ctx.setLineDash([])

    // === FLOATING SHAPE at w=wVal (cream) ===
    const lp = DEMO_SHAPE.map(([sx, sy]) => w2s([(sx+h)*wVal, wVal, (sy+k)*wVal]))
    ctx.fillStyle = 'rgba(254,243,199,0.10)'; ctx.strokeStyle = 'rgba(254,243,199,0.78)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(lp[0][0], lp[0][1])
    lp.slice(1).forEach(([p, q]) => ctx.lineTo(p, q)); ctx.closePath(); ctx.fill(); ctx.stroke()
    lp.forEach(([p, q]) => {
      ctx.beginPath(); ctx.arc(p, q, 2.5, 0, Math.PI*2)
      ctx.fillStyle = 'rgba(254,243,199,0.82)'; ctx.fill()
    })
  }

  // === TICK on W AXIS at current wVal ===
  const [tm0, tm1] = w2s([0, wVal, 0])
  ctx.beginPath(); ctx.arc(tm0, tm1, 4, 0, Math.PI*2)
  ctx.fillStyle = '#f59e0b'; ctx.fill()
  ctx.fillStyle = 'rgba(254,243,199,0.65)'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left'
  ctx.fillText(`w = ${wVal.toFixed(1)}`, tm0 + 8, tm1 + 4)

  // === LEGEND ===
  ctx.font = '10px monospace'; ctx.textAlign = 'left'
  let ly = 10
  if (hasTranslation) {
    ctx.strokeStyle = 'rgba(217,119,6,0.22)'; ctx.lineWidth = 1; ctx.setLineDash([2, 3])
    ctx.strokeRect(10, ly, 10, 10); ctx.setLineDash([])
    ctx.fillStyle = '#5a4030'; ctx.fillText('(x, y, 1) — original', 24, ly + 9)
    ly += 17
  }
  ctx.fillStyle = 'rgba(217,119,6,0.72)'; ctx.fillRect(10, ly, 10, 10)
  ctx.fillStyle = '#7a5c3a'; ctx.fillText('(x+h, y+k, 1) — translated', 24, ly + 9)
  if (Math.abs(wVal - 1) > 0.04) {
    ly += 17
    ctx.fillStyle = 'rgba(254,243,199,0.78)'; ctx.fillRect(10, ly, 10, 10)
    ctx.fillStyle = '#7a5c3a'; ctx.fillText(`w·(x+h, y+k, 1)  at  w = ${wVal.toFixed(1)}`, 24, ly + 9)
  }
}

function SliderRow({ label, value, min, max, step = 1, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void
}) {
  const display = step < 1 ? value.toFixed(1) : String(value)
  return (
    <div className="flex items-center gap-4">
      <label className="text-amber-700/60 text-sm font-mono w-8">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 accent-amber-500"
      />
      <span className="text-amber-100/70 font-mono text-sm w-10 text-right">{display}</span>
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
  const [wVal, setWVal] = useState(1.8)
  const [h, setH] = useState(1)
  const [k, setK] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) drawHomogScene(canvasRef.current, wVal, h, k)
  }, [wVal, h, k])

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
          <h2 className={`${playfair.className} text-xl font-semibold text-amber-100 mb-2`}>Homogeneous Coordinates Demonstration</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Set the translation vector (h, k) to move the shape on the w = 1 plane, then adjust w to see the same
            translated point floating in homogeneous space.
          </p>
          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            <canvas
              ref={canvasRef}
              width={520}
              height={420}
              className="w-full border border-amber-900/25"
            />
            <div className="space-y-5">
              <div>
                <p className={`${playfair.className} text-sm font-semibold text-amber-200/70 mb-3`}>Translation vector</p>
                <div className="space-y-3">
                  <SliderRow label="h" value={h} min={-2} max={2} onChange={setH} />
                  <SliderRow label="k" value={k} min={-2} max={2} onChange={setK} />
                </div>
              </div>
              <div>
                <p className={`${playfair.className} text-sm font-semibold text-amber-200/70 mb-3`}>Homogeneous weight</p>
                <SliderRow label="w" value={wVal} min={0.8} max={2.5} step={0.1} onChange={setWVal} />
              </div>
              <div className="bg-[#0e0c09] border border-amber-900/20 p-4">
                <p className="text-[10px] uppercase tracking-[0.4em] text-amber-700/50 mb-3">Matrix equation</p>
                <div className="flex flex-wrap items-center gap-2.5 mb-3">
                  <span className="font-mono text-amber-400/80 text-xs">[x, y, 1] ·</span>
                  <Matrix3x3 values={matrix} highlight={[[2,0],[2,1]]} />
                  <span className="text-slate-500 text-xs">=</span>
                  <span className="font-mono text-amber-200/70 text-xs">[x+{h}, y+{k}, 1]</span>
                </div>
                <div className="space-y-1 border-t border-amber-900/20 pt-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">translation</span>
                    <span className="font-mono text-amber-300/60">(+{h}, +{k})</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">homogeneous w</span>
                    <span className="font-mono text-amber-300/60">{wVal.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold pt-1">
                    <span className="text-slate-400">floating coords</span>
                    <span className="font-mono text-amber-100/60 text-[10px]">({wVal.toFixed(1)}·(x+{h}), {wVal.toFixed(1)}·(y+{k}), {wVal.toFixed(1)})</span>
                  </div>
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
