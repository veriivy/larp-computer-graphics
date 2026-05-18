'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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

  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, W, H)

  // Background grid (subtle)
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 1
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath(); ctx.moveTo(cx + i * sc * 0.3, 0); ctx.lineTo(cx + i * sc * 0.3, H); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, cy + i * sc * 0.3); ctx.lineTo(W, cy + i * sc * 0.3); ctx.stroke()
  }

  const ry = rotY(time * 0.4)
  const rx = rotX(time * 0.2)
  const verts = CUBE_VERTS.map(v => rx(ry(v)))

  // Sort edges by average Z for painter's algorithm
  const projected = verts.map(v => perspProject(v, d, eyeZ))

  // Draw projection plane indicator
  if (showPlane) {
    const planeX = (d / (eyeZ + d)) * sc * 2.5
    ctx.strokeStyle = '#f59e0b40'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(cx - planeX, 0)
    ctx.lineTo(cx - planeX, H)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#f59e0b60'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('projection plane', cx - planeX, 14)
  }

  // Draw cube edges (far edges dimmer)
  CUBE_EDGES.forEach(([a, b]) => {
    const va = verts[a], vb = verts[b]
    const avgZ = (va[2] + vb[2]) / 2
    const alpha = Math.max(0.3, Math.min(1, 0.7 + avgZ * 0.15))
    const [ax, ay] = projected[a]
    const [bx, by] = projected[b]
    ctx.strokeStyle = `rgba(99,179,237,${alpha})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx + ax * sc, cy - ay * sc)
    ctx.lineTo(cx + bx * sc, cy - by * sc)
    ctx.stroke()
  })

  // Draw vertices
  projected.forEach(([px, py], i) => {
    const z = verts[i][2]
    const alpha = Math.max(0.4, Math.min(1, 0.7 + z * 0.15))
    ctx.beginPath()
    ctx.arc(cx + px * sc, cy - py * sc, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(147,197,253,${alpha})`
    ctx.fill()
  })

  // Eye point
  ctx.beginPath()
  ctx.arc(cx + sc * 2.2, cy, 5, 0, Math.PI * 2)
  ctx.fillStyle = '#f472b6'
  ctx.fill()
  ctx.fillStyle = '#f9a8d4'
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

  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1
  for (let i = -5; i <= 5; i++) {
    ctx.beginPath(); ctx.moveTo(cx + i * sc, 0); ctx.lineTo(cx + i * sc, H); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, cy + i * sc); ctx.lineTo(W, cy + i * sc); ctx.stroke()
  }
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()

  const ry = rotY(time * 0.4)
  const rx = rotX(time * 0.2)
  const verts = CUBE_VERTS.map(v => rx(ry(v)))
  const projected = verts.map(v => perspProject(v, d, eyeZ))

  CUBE_EDGES.forEach(([a, b]) => {
    const [ax, ay] = projected[a]
    const [bx, by] = projected[b]
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx + ax * sc, cy - ay * sc)
    ctx.lineTo(cx + bx * sc, cy - by * sc)
    ctx.stroke()
  })

  projected.forEach(([px, py]) => {
    ctx.beginPath()
    ctx.arc(cx + px * sc, cy - py * sc, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#4ade80'
    ctx.fill()
  })

  ctx.fillStyle = '#94a3b8'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText('2D Projection', W / 2, H - 8)
}

export default function PerspectivePage() {
  const [running, setRunning] = useState(true)
  const [eyeZ, setEyeZ] = useState(4)
  const [focalD, setFocalD] = useState(2)
  const [showPlane, setShowPlane] = useState(true)
  const [time, setTime] = useState(0)
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
      if (running) {
        timeRef.current += dt
        setTime(t => t + dt)
      }
      if (canvas3dRef.current) drawPerspScene(canvas3dRef.current, timeRef.current, eyeZ, focalD, showPlane)
      if (canvas2dRef.current) draw2DProjection(canvas2dRef.current, timeRef.current, focalD, eyeZ)
      animRef.current = requestAnimationFrame(frame)
    }
    animRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(animRef.current)
  }, [running, eyeZ, focalD, showPlane])

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Link href="/composite" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Composite Transformations
      </Link>

      <h1 className="text-4xl font-bold text-white mb-3">3D Perspective Projection</h1>
      <p className="text-slate-400 text-lg mb-10">
        How do 3D objects appear on a 2D screen? Perspective projection uses similar triangles to map a 3D scene onto a flat plane — the same math that powers every modern game and movie.
      </p>

      {/* Concept */}
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-2">3D Coordinates</h3>
          <p className="text-slate-400 text-sm">
            A 3D point has coordinates <span className="font-mono text-blue-400">(X, Y, Z)</span>.
            The Z-axis points into the screen. Larger Z = farther away.
          </p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-2">Projection Formula</h3>
          <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-center mt-2">
            <div className="text-green-400 mb-1">x' = X · d / (Z + d)</div>
            <div className="text-green-400">y' = Y · d / (Z + d)</div>
          </div>
          <p className="text-slate-500 text-xs mt-2">d = focal length (distance to projection plane)</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-2">Why It Works</h3>
          <p className="text-slate-400 text-sm">
            Objects farther away (larger Z) are divided by a larger number → appear smaller.
            This matches how our eyes and cameras work.
          </p>
        </div>
      </div>

      {/* Homogeneous 3D */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mb-10">
        <h2 className="text-xl font-bold text-white mb-3">Homogeneous 3D Coordinates</h2>
        <p className="text-slate-400 text-sm mb-4">
          Just like 2D points gain a "1" to become 3D homogeneous, 3D points gain a "1" to become 4D homogeneous.
          All 3D transformations (including translation and projection) fit into a 4×4 matrix.
        </p>
        <div className="flex flex-wrap gap-8 items-center">
          <div className="text-center">
            <p className="text-slate-400 text-xs mb-2">3D point</p>
            <div className="font-mono text-sm inline-flex items-center gap-1">
              <span className="text-slate-400 text-xl" style={{lineHeight:'1.3'}}>⎡<br/>⎢<br/>⎣</span>
              <div className="grid grid-cols-1 gap-0.5">
                <span className="text-blue-400">X</span>
                <span className="text-blue-400">Y</span>
                <span className="text-blue-400">Z</span>
              </div>
              <span className="text-slate-400 text-xl" style={{lineHeight:'1.3'}}>⎤<br/>⎥<br/>⎦</span>
            </div>
          </div>
          <span className="text-slate-400 text-2xl">→</span>
          <div className="text-center">
            <p className="text-slate-400 text-xs mb-2">Homogeneous 3D point</p>
            <div className="font-mono text-sm inline-flex items-center gap-1">
              <span className="text-slate-400 text-xl" style={{lineHeight:'1.1'}}>⎡<br/>⎢<br/>⎢<br/>⎣</span>
              <div className="grid grid-cols-1 gap-0.5">
                <span className="text-blue-400">X</span>
                <span className="text-blue-400">Y</span>
                <span className="text-blue-400">Z</span>
                <span className="text-amber-400">1</span>
              </div>
              <span className="text-slate-400 text-xl" style={{lineHeight:'1.1'}}>⎤<br/>⎥<br/>⎥<br/>⎦</span>
            </div>
          </div>
          <div className="max-w-xs text-slate-400 text-sm">
            The perspective projection 4×4 matrix encodes both the projection and the division by Z in a single matrix multiply.
          </div>
        </div>
      </div>

      {/* Interactive demo */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mb-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">Live Demo: Rotating Cube</h2>
          <button
            onClick={() => setRunning(r => !r)}
            className="px-4 py-1.5 bg-slate-700 rounded-lg text-sm text-white hover:bg-slate-600 transition-colors"
          >
            {running ? 'Pause' : 'Resume'}
          </button>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          Left: 3D perspective view. Right: the resulting 2D projection on the screen plane. Adjust the parameters to see how they affect the image.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <canvas
            ref={canvas3dRef}
            width={440}
            height={320}
            className="w-full rounded-xl border border-slate-700/50"
          />
          <canvas
            ref={canvas2dRef}
            width={440}
            height={320}
            className="w-full rounded-xl border border-green-900/50"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Viewer distance (eye Z)</span>
                <span className="font-mono text-white">{eyeZ}</span>
              </div>
              <input type="range" min={2} max={10} value={eyeZ} onChange={e => setEyeZ(Number(e.target.value))} className="w-full accent-pink-500" />
              <p className="text-slate-500 text-xs mt-1">How far the viewer is from the scene. Larger = less distortion.</p>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Focal length (d)</span>
                <span className="font-mono text-white">{focalD}</span>
              </div>
              <input type="range" min={1} max={8} value={focalD} onChange={e => setFocalD(Number(e.target.value))} className="w-full accent-purple-500" />
              <p className="text-slate-500 text-xs mt-1">Distance to the projection plane. Larger = more zoomed in.</p>
            </div>
          </div>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={showPlane} onChange={e => setShowPlane(e.target.checked)} className="w-4 h-4 accent-amber-400" />
              <span className="text-slate-300 text-sm">Show projection plane</span>
            </label>
            <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-400">
              <p className="text-slate-300 font-semibold mb-2">Projection formula:</p>
              <p><span className="text-green-400">x'</span> = X · <span className="text-purple-400">{focalD}</span> / (Z + <span className="text-pink-400">{eyeZ}</span>)</p>
              <p className="mt-1"><span className="text-green-400">y'</span> = Y · <span className="text-purple-400">{focalD}</span> / (Z + <span className="text-pink-400">{eyeZ}</span>)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Real world connection */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mb-10">
        <h2 className="text-xl font-bold text-white mb-4">From Math to Screen</h2>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="bg-slate-900 rounded-xl p-4">
            <div className="text-blue-400 font-semibold mb-2">① Model Space</div>
            <p className="text-slate-400">3D vertices defined relative to the object's own origin (e.g., a tree model).</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4">
            <div className="text-amber-400 font-semibold mb-2">② World / View Space</div>
            <p className="text-slate-400">Transformation matrices place and orient objects in the world, then relative to the camera.</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4">
            <div className="text-green-400 font-semibold mb-2">③ Screen Space</div>
            <p className="text-slate-400">Perspective projection collapses Z, mapping 3D coordinates to 2D pixel positions.</p>
          </div>
        </div>
        <p className="text-slate-500 text-sm mt-4">
          Every vertex in every 3D game goes through this pipeline, multiplied by a chain of matrices — exactly the composite transformations from the previous section.
        </p>
      </div>

      <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 rounded-lg text-white font-semibold hover:bg-slate-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
    </div>
  )
}
