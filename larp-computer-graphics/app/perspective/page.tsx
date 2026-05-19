'use client'

import { useState, useEffect, useRef } from 'react'
import { Playfair_Display } from 'next/font/google'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
})

type Vec3 = [number, number, number]

const CUBE_VERTS: Vec3[] = [
  [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
  [-1,-1, 1],[1,-1, 1],[1,1, 1],[-1,1, 1],
]

const CUBE_EDGES: [number,number][] = [
  [0,1],[1,2],[2,3],[3,0],
  [4,5],[5,6],[6,7],[7,4],
  [0,4],[1,5],[2,6],[3,7],
]

function rotX(a: number): (v: Vec3) => Vec3 {
  const c = Math.cos(a), s = Math.sin(a)
  return ([x,y,z]) => [x, c*y - s*z, s*y + c*z]
}
function rotY(a: number): (v: Vec3) => Vec3 {
  const c = Math.cos(a), s = Math.sin(a)
  return ([x,y,z]) => [c*x + s*z, y, -s*x + c*z]
}

function perspProject(v: Vec3, d: number, eyeZ: number): [number, number] {
  const z = v[2] + eyeZ
  if (z <= 0) return [0, 0]
  const scale = d / z
  return [v[0] * scale, v[1] * scale]
}

function drawPerspScene(
  canvas: HTMLCanvasElement,
  time: number,
  eyeZ: number,
  d: number,
  showPlane: boolean,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width, H = canvas.height
  const cx = W / 2, cy = H / 2
  const sc = 90

  ctx.fillStyle = '#100e0b'
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = '#1e1a14'
  ctx.lineWidth = 1
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath(); ctx.moveTo(cx + i * sc * 0.3, 0); ctx.lineTo(cx + i * sc * 0.3, H); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, cy + i * sc * 0.3); ctx.lineTo(W, cy + i * sc * 0.3); ctx.stroke()
  }

  const ry = rotY(time * 0.4)
  const rx = rotX(time * 0.2)
  const verts = CUBE_VERTS.map(v => rx(ry(v)))
  const projected = verts.map(v => perspProject(v, d, eyeZ))

  if (showPlane) {
    const planeX = (d / (eyeZ + d)) * sc * 2.5
    ctx.strokeStyle = '#f59e0b30'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(cx - planeX, 0)
    ctx.lineTo(cx - planeX, H)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#f59e0b50'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('projection plane', cx - planeX, 14)
  }

  CUBE_EDGES.forEach(([a, b]) => {
    const va = verts[a], vb = verts[b]
    const avgZ = (va[2] + vb[2]) / 2
    const alpha = Math.max(0.25, Math.min(0.85, 0.55 + avgZ * 0.15))
    const [ax, ay] = projected[a]
    const [bx, by] = projected[b]
    ctx.strokeStyle = `rgba(217,119,6,${alpha})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx + ax * sc, cy - ay * sc)
    ctx.lineTo(cx + bx * sc, cy - by * sc)
    ctx.stroke()
  })

  projected.forEach(([px, py], i) => {
    const z = verts[i][2]
    const alpha = Math.max(0.35, Math.min(0.9, 0.65 + z * 0.15))
    ctx.beginPath()
    ctx.arc(cx + px * sc, cy - py * sc, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(253,186,116,${alpha})`
    ctx.fill()
  })

  // Eye / viewer indicator
  ctx.beginPath()
  ctx.arc(cx + sc * 2.2, cy, 5, 0, Math.PI * 2)
  ctx.fillStyle = '#d97706'
  ctx.fill()
  ctx.fillStyle = '#fbbf24'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('viewer', cx + sc * 2.2 + 8, cy + 4)
}

function draw2DProjection(canvas: HTMLCanvasElement, time: number, d: number, eyeZ: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width, H = canvas.height
  const cx = W / 2, cy = H / 2
  const sc = 80

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

  const ry = rotY(time * 0.4)
  const rx = rotX(time * 0.2)
  const verts = CUBE_VERTS.map(v => rx(ry(v)))
  const projected = verts.map(v => perspProject(v, d, eyeZ))

  CUBE_EDGES.forEach(([a, b]) => {
    const [ax, ay] = projected[a]
    const [bx, by] = projected[b]
    ctx.strokeStyle = 'rgba(254,243,199,0.55)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx + ax * sc, cy - ay * sc)
    ctx.lineTo(cx + bx * sc, cy - by * sc)
    ctx.stroke()
  })

  projected.forEach(([px, py]) => {
    ctx.beginPath()
    ctx.arc(cx + px * sc, cy - py * sc, 4, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(254,243,199,0.8)'
    ctx.fill()
  })

  ctx.fillStyle = '#7a5c3a'
  ctx.font = '11px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('2D Projection', W / 2, H - 8)
}

export default function PerspectivePage() {
  const [running, setRunning] = useState(true)
  const [eyeZ, setEyeZ] = useState(4)
  const [focalD, setFocalD] = useState(2)
  const [showPlane, setShowPlane] = useState(true)
  const canvas3dRef = useRef<HTMLCanvasElement>(null)
  const canvas2dRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const lastRef = useRef<number>(0)
  const timeRef = useRef<number>(0)

  useEffect(() => {
    function frame(ts: number) {
      if (lastRef.current === 0) lastRef.current = ts
      const dt = (ts - lastRef.current) / 1000
      lastRef.current = ts
      if (running) timeRef.current += dt
      if (canvas3dRef.current) drawPerspScene(canvas3dRef.current, timeRef.current, eyeZ, focalD, showPlane)
      if (canvas2dRef.current) draw2DProjection(canvas2dRef.current, timeRef.current, focalD, eyeZ)
      animRef.current = requestAnimationFrame(frame)
    }
    animRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(animRef.current)
  }, [running, eyeZ, focalD, showPlane])

  return (
    <div className="bg-[#0e0c09] min-h-screen px-6 py-12">
      <div className="max-w-5xl mx-auto">

        <div className="mb-12 text-center">
          <div className="mb-6 flex items-center justify-center gap-4">
            <span className="h-px w-16 bg-amber-300/30" />
            <span className="text-[10px] font-light uppercase tracking-[0.55em] text-amber-300/50">Module IV</span>
            <span className="h-px w-16 bg-amber-300/30" />
          </div>
          <h1 className={`${playfair.className} text-4xl sm:text-5xl font-bold italic text-amber-50 mb-4`}>
            3D Perspective Projection
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed text-sm">
            How do 3D objects appear on a 2D screen? Perspective projection uses similar triangles to map a 3D scene onto a flat plane —
            the same math that powers every modern game and film.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <div className="border border-amber-900/25 bg-[#131008] p-5">
            <h3 className={`${playfair.className} font-semibold text-amber-100 mb-2`}>3D Coordinates</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              A 3D point has coordinates <span className="font-mono text-amber-400/80">(X, Y, Z)</span>.
              The Z-axis points into the screen. Larger Z = farther away.
            </p>
          </div>
          <div className="border border-amber-900/25 bg-[#131008] p-5">
            <h3 className={`${playfair.className} font-semibold text-amber-100 mb-2`}>Projection Formula</h3>
            <div className="bg-[#0e0c09] border border-amber-900/20 p-3 font-mono text-xs text-center mt-2">
              <div className="text-amber-300/80 mb-1">x&apos; = X · d / (Z + d)</div>
              <div className="text-amber-300/80">y&apos; = Y · d / (Z + d)</div>
            </div>
            <p className="text-slate-500 text-xs mt-2">d = focal length (distance to projection plane)</p>
          </div>
          <div className="border border-amber-900/25 bg-[#131008] p-5">
            <h3 className={`${playfair.className} font-semibold text-amber-100 mb-2`}>Why It Works</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Objects farther away (larger Z) are divided by a larger number → appear smaller.
              This matches how our eyes and cameras work.
            </p>
          </div>
        </div>

        <div className="border border-amber-900/25 bg-[#131008] p-6 mb-10">
          <h2 className={`${playfair.className} text-xl font-semibold text-amber-100 mb-3`}>Homogeneous 3D Coordinates</h2>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed">
            Just like 2D points gain a "1" to become 3D homogeneous, 3D points gain a "1" to become 4D homogeneous.
            All 3D transformations (including translation and projection) fit into a 4×4 matrix.
          </p>
          <div className="flex flex-wrap gap-8 items-center">
            <div className="text-center">
              <p className="text-amber-700/50 text-xs mb-2">3D point</p>
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
            <span className="text-amber-700/40 text-2xl">→</span>
            <div className="text-center">
              <p className="text-amber-700/50 text-xs mb-2">Homogeneous 3D point</p>
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
            <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
              The perspective projection 4×4 matrix encodes both the projection and the Z-division in a single matrix multiply.
            </p>
          </div>
        </div>

        <div className="border border-amber-900/25 bg-[#131008] p-6 mb-10">
          <div className="flex items-center justify-between mb-2">
            <h2 className={`${playfair.className} text-xl font-semibold text-amber-100`}>Live Demo: Rotating Cube</h2>
            <button
              onClick={() => setRunning(r => !r)}
              className="px-4 py-1.5 border border-amber-900/40 text-amber-200/60 text-sm hover:border-amber-700/50 hover:text-amber-200/80 transition-colors"
            >
              {running ? 'Pause' : 'Resume'}
            </button>
          </div>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Left: 3D perspective view (amber). Right: resulting 2D projection (cream). Adjust parameters below.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <canvas
              ref={canvas3dRef}
              width={440}
              height={320}
              className="w-full border border-amber-900/25"
            />
            <canvas
              ref={canvas2dRef}
              width={440}
              height={320}
              className="w-full border border-amber-900/25"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-400">Viewer distance (eye Z)</span>
                  <span className="font-mono text-amber-200/70">{eyeZ}</span>
                </div>
                <input
                  type="range" min={2} max={10} value={eyeZ}
                  onChange={e => setEyeZ(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <p className="text-slate-500 text-xs mt-1">Larger = less perspective distortion.</p>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-400">Focal length (d)</span>
                  <span className="font-mono text-amber-200/70">{focalD}</span>
                </div>
                <input
                  type="range" min={1} max={8} value={focalD}
                  onChange={e => setFocalD(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <p className="text-slate-500 text-xs mt-1">Larger = more zoomed in.</p>
              </div>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox" checked={showPlane}
                  onChange={e => setShowPlane(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
                <span className="text-slate-400 text-sm">Show projection plane</span>
              </label>
              <div className="bg-[#0e0c09] border border-amber-900/20 p-4 font-mono text-xs">
                <p className="text-amber-700/60 mb-2 text-[10px] uppercase tracking-widest">Projection formula</p>
                <p className="text-amber-200/60">
                  <span className="text-amber-300/80">x&apos;</span> = X · <span className="text-amber-400">{focalD}</span> / (Z + <span className="text-amber-400">{eyeZ}</span>)
                </p>
                <p className="mt-1 text-amber-200/60">
                  <span className="text-amber-300/80">y&apos;</span> = Y · <span className="text-amber-400">{focalD}</span> / (Z + <span className="text-amber-400">{eyeZ}</span>)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-amber-900/25 bg-[#131008] p-6 mb-10">
          <h2 className={`${playfair.className} text-xl font-semibold text-amber-100 mb-4`}>From Math to Screen</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-[#0e0c09] border border-amber-900/20 p-4">
              <div className="text-amber-400/80 font-semibold mb-2">① Model Space</div>
              <p className="text-slate-400 leading-relaxed">3D vertices defined relative to the object&apos;s own origin (e.g., a character model).</p>
            </div>
            <div className="bg-[#0e0c09] border border-amber-900/20 p-4">
              <div className="text-amber-300/70 font-semibold mb-2">② World / View Space</div>
              <p className="text-slate-400 leading-relaxed">Transformation matrices place and orient objects in the world, then relative to the camera.</p>
            </div>
            <div className="bg-[#0e0c09] border border-amber-900/20 p-4">
              <div className="text-amber-200/60 font-semibold mb-2">③ Screen Space</div>
              <p className="text-slate-400 leading-relaxed">Perspective projection collapses Z, mapping 3D coordinates to 2D pixel positions.</p>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-4 leading-relaxed">
            Every vertex in every 3D game goes through this pipeline, multiplied by a chain of matrices — exactly the composite transformations from Module III.
          </p>
        </div>

        <Link
          href="/composite"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-amber-900/40 text-amber-200/60 text-sm hover:border-amber-700/50 hover:text-amber-200/80 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Composite Transformations
        </Link>
      </div>
    </div>
  )
}
