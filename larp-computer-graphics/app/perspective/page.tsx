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
  return [v[0] * d / z, v[1] * d / z]
}

// 3D scene: viewer is behind and above the scene camera, looking toward the plane.
// Camera appears in the foreground (lower canvas), plane in mid-ground, cube in background.
function drawScene3D(
  canvas: HTMLCanvasElement,
  time: number,
  eyeZ: number,
  d: number,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width, H = canvas.height
  // Screen center shifted down so the camera (foreground) is prominent at the bottom
  const scx = W * 0.5, scy = H * 0.66

  // Scene positions — cube depth responds to eyeZ slider
  const PLANE_Z = 2.5
  const CUBE_Z  = PLANE_Z + eyeZ * 0.42   // farther eyeZ → cube moves away from plane

  // Viewer is behind the scene camera, elevated and slightly to the right.
  // VY ≈ 0  → viewer is roughly behind the camera (looking in +Z same as camera)
  // VP < 0  → viewer is above, looking down into the scene
  const VY   =  0.20   // slight rightward offset — we see the camera's right side
  const VP   = -0.52   // steep downward pitch — camera is in the lower foreground
  const VD   =  12.0
  const VSCL =  60
  const centZ = PLANE_Z * 0.5  // bias toward camera so it appears large in frame

  function w2s(p: Vec3): [number, number] {
    let x = p[0], y = p[1], z = p[2] - centZ
    const cyy = Math.cos(VY), syy = Math.sin(VY)
    const nx = cyy*x + syy*z; z = -syy*x + cyy*z; x = nx
    const cpp = Math.cos(VP), spp = Math.sin(VP)
    const ny = cpp*y - spp*z; z = spp*y + cpp*z; y = ny
    const dz = z + VD
    if (dz < 0.01) return [scx, scy]
    const s = VSCL * VD / dz
    return [scx + x*s, scy - y*s]
  }

  ctx.fillStyle = '#0e0c09'
  ctx.fillRect(0, 0, W, H)

  // Bigger plane: clamped so it stays visible for all focalD values
  const planeHW = Math.max(1.6, Math.min(3.8, PLANE_Z * 2.8 / d))
  const planeHH = planeHW

  const pTL: Vec3 = [-planeHW,  planeHH, PLANE_Z]
  const pTR: Vec3 = [ planeHW,  planeHH, PLANE_Z]
  const pBR: Vec3 = [ planeHW, -planeHH, PLANE_Z]
  const pBL: Vec3 = [-planeHW, -planeHH, PLANE_Z]

  // Rotated cube vertices
  const ryFn = rotY(time * 0.4)
  const rxFn = rotX(time * 0.2)
  const cubeVerts: Vec3[] = CUBE_VERTS.map(v => {
    const rv = rxFn(ryFn(v))
    return [rv[0], rv[1], rv[2] + CUBE_Z] as Vec3
  })

  // Project each cube vertex onto the plane (ray from camera at origin)
  const projPts: Vec3[] = cubeVerts.map(([vx, vy, vz]) => {
    if (vz <= 0) return [0, 0, PLANE_Z] as Vec3
    const t = PLANE_Z / vz
    return [vx * t, vy * t, PLANE_Z] as Vec3
  })

  const camP: Vec3 = [0, 0, 0]

  // === 1. FRUSTUM EDGES ===
  const extZ = CUBE_Z + 1.2
  const ff: Vec3[] = [pTL, pTR, pBR, pBL].map(([px, py]) =>
    [px * extZ / PLANE_Z, py * extZ / PLANE_Z, extZ] as Vec3
  )
  ctx.strokeStyle = '#f59e0b18'
  ctx.lineWidth = 1
  ff.forEach(fc => {
    const [ax, ay] = w2s(camP), [bx, by] = w2s(fc)
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke()
  })
  ctx.strokeStyle = '#f59e0b10'
  ctx.lineWidth = 0.5
  ctx.setLineDash([3, 3])
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = w2s(ff[i]), [bx, by] = w2s(ff[(i+1)%4])
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke()
  }
  ctx.setLineDash([])

  // === 2. OPTICAL AXIS ===
  ctx.strokeStyle = '#28200e'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  const [oax, oay] = w2s(camP), [obx, oby] = w2s([0, 0, CUBE_Z + 1.2])
  ctx.beginPath(); ctx.moveTo(oax, oay); ctx.lineTo(obx, oby); ctx.stroke()
  ctx.setLineDash([])

  // === 3. CUBE ===
  CUBE_EDGES.forEach(([a, b]) => {
    const avgZ = (cubeVerts[a][2] + cubeVerts[b][2]) / 2 - CUBE_Z
    const alpha = Math.max(0.35, Math.min(0.9, 0.65 + avgZ * 0.12))
    const [ax, ay] = w2s(cubeVerts[a]), [bx, by] = w2s(cubeVerts[b])
    ctx.strokeStyle = `rgba(217,119,6,${alpha})`
    ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke()
  })
  cubeVerts.forEach(v => {
    const [sx, sy] = w2s(v)
    ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(253,186,116,0.9)'; ctx.fill()
  })

  // === 4. PROJECTION PLANE ===
  const [tlX, tlY] = w2s(pTL), [trX, trY] = w2s(pTR)
  const [brX, brY] = w2s(pBR), [blX, blY] = w2s(pBL)

  ctx.fillStyle = '#f59e0b0e'
  ctx.beginPath()
  ctx.moveTo(tlX, tlY); ctx.lineTo(trX, trY); ctx.lineTo(brX, brY); ctx.lineTo(blX, blY)
  ctx.closePath(); ctx.fill()

  const GRID_N = 4
  ctx.strokeStyle = '#f59e0b12'
  ctx.lineWidth = 0.5
  for (let i = 0; i <= GRID_N; i++) {
    const t = (i / GRID_N) * 2 - 1
    const [ax, ay] = w2s([t * planeHW, -planeHH, PLANE_Z])
    const [bx, by] = w2s([t * planeHW,  planeHH, PLANE_Z])
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke()
    const [cx2, cy2] = w2s([-planeHW, t * planeHH, PLANE_Z])
    const [dx, dy]   = w2s([ planeHW, t * planeHH, PLANE_Z])
    ctx.beginPath(); ctx.moveTo(cx2, cy2); ctx.lineTo(dx, dy); ctx.stroke()
  }
  ctx.strokeStyle = '#f59e0b62'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(tlX, tlY); ctx.lineTo(trX, trY); ctx.lineTo(brX, brY); ctx.lineTo(blX, blY)
  ctx.closePath(); ctx.stroke()

  // === 5. PROJECTED EDGES & DOTS on the plane ===
  CUBE_EDGES.forEach(([a, b]) => {
    const [ax, ay] = w2s(projPts[a]), [bx, by] = w2s(projPts[b])
    ctx.strokeStyle = 'rgba(254,243,199,0.70)'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke()
  })
  projPts.forEach(pt => {
    const [sx, sy] = w2s(pt)
    ctx.beginPath(); ctx.arc(sx, sy, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(254,243,199,0.92)'; ctx.fill()
  })

  // === 6. PROJECTION LINES (cube vertex → plane) ===
  ctx.strokeStyle = 'rgba(254,243,199,0.13)'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 3])
  cubeVerts.forEach((cv, i) => {
    const [ax, ay] = w2s(cv), [bx, by] = w2s(projPts[i])
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke()
  })
  ctx.setLineDash([])

  // === 7. CAMERA (3D box — we see its back/top since viewer is behind it) ===
  const CW = 0.55, CH = 0.36, CD = 0.42

  const ctx2 = ctx
  function drawFace(corners: Vec3[], fill: string, stroke: string, lw = 1.5) {
    const pts = corners.map(c => w2s(c))
    ctx2.fillStyle = fill; ctx2.strokeStyle = stroke; ctx2.lineWidth = lw
    ctx2.beginPath(); ctx2.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) ctx2.lineTo(pts[i][0], pts[i][1])
    ctx2.closePath(); ctx2.fill(); ctx2.stroke()
  }

  // Back face (Z = -CD/2, the face closest to the viewer from behind)
  drawFace([
    [-CW/2, -CH/2, -CD/2], [ CW/2, -CH/2, -CD/2],
    [ CW/2,  CH/2, -CD/2], [-CW/2,  CH/2, -CD/2],
  ], '#211506', '#d97706', 1.5)

  // Top face (Y = +CH/2, visible since viewer looks from above)
  drawFace([
    [-CW/2, CH/2, -CD/2], [CW/2, CH/2, -CD/2],
    [ CW/2, CH/2,  CD/2], [-CW/2, CH/2, CD/2],
  ], '#301d08', '#d9770660', 1)

  // Right face (X = +CW/2, slightly visible since viewer is offset right)
  drawFace([
    [CW/2, -CH/2, -CD/2], [CW/2, -CH/2,  CD/2],
    [CW/2,  CH/2,  CD/2], [CW/2,  CH/2, -CD/2],
  ], '#271608', '#d9770648', 1)

  // Viewfinder bump on top
  const VFW = CW * 0.4, VFH = 0.10, VFD = CD * 0.45
  drawFace([
    [-VFW/2, CH/2 + VFH, -CD/4 - VFD/2], [VFW/2, CH/2 + VFH, -CD/4 - VFD/2],
    [ VFW/2, CH/2 + VFH, -CD/4 + VFD/2], [-VFW/2, CH/2 + VFH, -CD/4 + VFD/2],
  ], '#2a1808', '#d9770640', 0.8)

  // Lens (on the front face, pointing toward the plane — away from viewer)
  const [lsx, lsy] = w2s([0, 0, CD/2])
  const [lax, lay] = w2s([0.13, 0, CD/2])
  const ppu = Math.hypot(lax - lsx, lay - lsy) / 0.13
  const lR = Math.max(5, 0.14 * ppu)
  ctx.beginPath(); ctx.arc(lsx, lsy, lR * 1.45, 0, Math.PI * 2)
  ctx.fillStyle = '#0a0804'; ctx.fill(); ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.beginPath(); ctx.arc(lsx, lsy, lR * 0.85, 0, Math.PI * 2)
  ctx.fillStyle = '#130d05'; ctx.fill(); ctx.strokeStyle = '#d9770658'; ctx.lineWidth = 1; ctx.stroke()
  ctx.beginPath(); ctx.arc(lsx, lsy, lR * 0.36, 0, Math.PI * 2)
  ctx.fillStyle = '#f59e0b'; ctx.fill()

  // === 8. LABELS ===
  ctx.font = '10px sans-serif'; ctx.textAlign = 'center'

  const [camLX, camLY] = w2s([0, -CH/2, 0])
  ctx.fillStyle = '#d9770870'
  ctx.fillText('camera', camLX, camLY + 14)

  const pmX = (tlX + trX + brX + blX) / 4
  ctx.fillStyle = '#f59e0b78'
  ctx.fillText('projection plane', pmX, Math.min(tlY, trY) - 8)

  const csX = cubeVerts.map(v => w2s(v)[0])
  const csY = cubeVerts.map(v => w2s(v)[1])
  ctx.fillStyle = '#d97706a0'
  ctx.fillText('3D object', csX.reduce((a, v) => a + v, 0) / csX.length, Math.min(...csY) - 10)

  ctx.fillStyle = 'rgba(254,243,199,0.45)'; ctx.font = '9px sans-serif'
  ctx.fillText('projected 2D', pmX, Math.max(brY, blY) + 14)
}

// Side-view schematic: Z axis goes right, Y axis goes up.
// Uses the same vis-space positions as drawScene3D so both views are consistent.
function drawSideProfile(
  canvas: HTMLCanvasElement,
  time: number,
  eyeZ: number,
  d: number,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width, H = canvas.height
  const cy = H / 2

  const PLANE_Z = 2.5
  const CUBE_Z  = PLANE_Z + eyeZ * 0.42

  const SZ = 34    // px per world z-unit
  const SY = 44    // px per world y-unit
  const XH = 10    // x-axis isometric horizontal offset
  const XV =  3    // x-axis isometric vertical offset

  const eyeSX  = 52
  const planeSX = eyeSX + PLANE_Z * SZ
  const cubeCX  = eyeSX + CUBE_Z  * SZ

  ctx.fillStyle = '#100e0b'
  ctx.fillRect(0, 0, W, H)

  // Grid
  ctx.strokeStyle = '#18140f'
  ctx.lineWidth = 1
  for (let i = 1; i <= 22; i++) {
    const x = eyeSX + i * SZ
    if (x < W) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
  }
  for (let i = -4; i <= 4; i++) {
    const y = cy + i * SY
    if (y > 0 && y < H) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
  }

  // Optical axis
  ctx.strokeStyle = '#28200f'
  ctx.lineWidth = 1
  ctx.setLineDash([5, 4])
  ctx.beginPath(); ctx.moveTo(eyeSX, cy); ctx.lineTo(W, cy); ctx.stroke()
  ctx.setLineDash([])

  const ryFn = rotY(time * 0.4)
  const rxFn = rotX(time * 0.2)
  const verts = CUBE_VERTS.map(v => rxFn(ryFn(v)))

  // Y-accurate positions (for geometrically correct projection rays)
  const svY = verts.map(v => ({
    sx: eyeSX + (v[2] + CUBE_Z) * SZ,
    sy: cy - v[1] * SY,
  }))

  // Isometric positions (for 3D cube drawing)
  const svISO = verts.map(v => ({
    sx: eyeSX + (v[2] + CUBE_Z) * SZ + v[0] * XH,
    sy: cy - v[1] * SY - v[0] * XV,
  }))

  // Geometric projection: ray from camera through vertex, intersects x = planeSX
  const projY = svY.map(({ sx, sy }) => {
    const dx = sx - eyeSX
    if (dx <= 0) return cy
    const t = (planeSX - eyeSX) / dx
    return cy + (sy - cy) * t
  })

  // === FRUSTUM ===
  const halfAngle = Math.atan2(2.5, d)
  const fLen = W - eyeSX + 10

  ctx.save()
  ctx.beginPath(); ctx.rect(eyeSX, 0, W - eyeSX, H); ctx.clip()

  ctx.fillStyle = '#f59e0b07'
  ctx.beginPath()
  ctx.moveTo(eyeSX, cy)
  ctx.lineTo(eyeSX + fLen, cy - fLen * Math.tan(halfAngle))
  ctx.lineTo(eyeSX + fLen, cy + fLen * Math.tan(halfAngle))
  ctx.closePath(); ctx.fill()

  ctx.strokeStyle = '#f59e0b28'
  ctx.lineWidth = 1.5
  ctx.setLineDash([8, 5])
  ctx.beginPath(); ctx.moveTo(eyeSX, cy); ctx.lineTo(eyeSX + fLen, cy - fLen * Math.tan(halfAngle)); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(eyeSX, cy); ctx.lineTo(eyeSX + fLen, cy + fLen * Math.tan(halfAngle)); ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()

  const topFY = cy - (W - eyeSX) * Math.tan(halfAngle)
  ctx.fillStyle = '#f59e0b40'
  ctx.font = '9px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('frustum', W - 6, Math.max(topFY + 11, 10))

  // === PROJECTION RAYS (dashed, from camera through vertices) ===
  ctx.strokeStyle = '#6b4b2b22'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 4])
  svY.forEach(({ sx, sy }) => {
    const dx = sx - eyeSX
    if (Math.abs(dx) < 0.1) return
    const t = (W + 20 - eyeSX) / dx
    ctx.beginPath()
    ctx.moveTo(eyeSX, cy)
    ctx.lineTo(eyeSX + dx * t, cy + (sy - cy) * t)
    ctx.stroke()
  })
  ctx.setLineDash([])

  // === PROJECTION PLANE ===
  const planeTop = Math.max(cy - 2.8 * SY, 6)
  const planeBot = Math.min(cy + 2.8 * SY, H - 6)

  ctx.fillStyle = '#f59e0b10'
  ctx.fillRect(planeSX - 1.5, planeTop, 3, planeBot - planeTop)
  ctx.strokeStyle = '#f59e0b78'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(planeSX, planeTop); ctx.lineTo(planeSX, planeBot); ctx.stroke()

  // Projected edges on plane
  CUBE_EDGES.forEach(([a, b]) => {
    ctx.strokeStyle = 'rgba(254,243,199,0.60)'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(planeSX, projY[a]); ctx.lineTo(planeSX, projY[b]); ctx.stroke()
  })
  projY.forEach(py => {
    ctx.beginPath(); ctx.arc(planeSX, py, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(254,243,199,0.72)'; ctx.fill()
  })

  // === 3D CUBE (isometric side view) ===
  CUBE_EDGES.forEach(([a, b]) => {
    const avgZ = (verts[a][2] + verts[b][2]) / 2
    const alpha = Math.max(0.3, Math.min(0.9, 0.62 + avgZ * 0.12))
    ctx.strokeStyle = `rgba(217,119,6,${alpha})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(svISO[a].sx, svISO[a].sy)
    ctx.lineTo(svISO[b].sx, svISO[b].sy)
    ctx.stroke()
  })

  // === CAMERA ===
  const lx = eyeSX, ly = cy
  ctx.fillStyle = '#221708'; ctx.strokeStyle = '#d9770680'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.rect(lx - 50, ly - 15, 36, 30); ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#2e1d08'; ctx.strokeStyle = '#d9770650'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.rect(lx - 42, ly - 22, 12, 8); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.arc(lx, ly, 14, 0, Math.PI * 2)
  ctx.fillStyle = '#0a0804'; ctx.fill(); ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2; ctx.stroke()
  ctx.beginPath(); ctx.arc(lx, ly, 8, 0, Math.PI * 2)
  ctx.fillStyle = '#120d05'; ctx.fill(); ctx.strokeStyle = '#d9770660'; ctx.lineWidth = 1; ctx.stroke()
  ctx.beginPath(); ctx.arc(lx, ly, 3.5, 0, Math.PI * 2)
  ctx.fillStyle = '#f59e0b'; ctx.fill()

  // === LABELS ===
  ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'
  ctx.fillStyle = '#d9770868'; ctx.fillText('camera', lx - 32, ly + 22)
  ctx.fillStyle = '#f59e0b80'; ctx.fillText('plane', planeSX, planeTop - 4)
  ctx.fillStyle = '#d9770875'; ctx.fillText('3D object', cubeCX, H - 5)
  ctx.fillStyle = 'rgba(254,243,199,0.48)'; ctx.font = '9px sans-serif'
  ctx.textAlign = 'left'; ctx.fillText('2D result', planeSX + 5, H - 5)
  ctx.fillStyle = '#332a18'; ctx.textAlign = 'left'
  ctx.fillText('→ Z', eyeSX + 4, H - 5)
}

function draw2DProjection(canvas: HTMLCanvasElement, time: number, d: number, eyeZ: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width, H = canvas.height
  const cx = W / 2, cy = H / 2
  const sc = 72

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
    const [ax, ay] = projected[a], [bx, by] = projected[b]
    ctx.strokeStyle = 'rgba(254,243,199,0.55)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx + ax * sc, cy - ay * sc)
    ctx.lineTo(cx + bx * sc, cy - by * sc)
    ctx.stroke()
  })

  projected.forEach(([px, py]) => {
    ctx.beginPath()
    ctx.arc(cx + px * sc, cy - py * sc, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(254,243,199,0.80)'; ctx.fill()
  })

  ctx.fillStyle = '#7a5c3a'
  ctx.font = 'bold 9px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('2D PROJECTED RESULT', W / 2, H - 6)
}

export default function PerspectivePage() {
  const [running, setRunning] = useState(true)
  const [eyeZ, setEyeZ] = useState(4)
  const [focalD, setFocalD] = useState(2)
  const canvas3dRef   = useRef<HTMLCanvasElement>(null)
  const canvasSideRef = useRef<HTMLCanvasElement>(null)
  const canvas2dRef   = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const lastRef = useRef<number>(0)
  const timeRef = useRef<number>(0)

  useEffect(() => {
    function frame(ts: number) {
      if (lastRef.current === 0) lastRef.current = ts
      const dt = (ts - lastRef.current) / 1000
      lastRef.current = ts
      if (running) timeRef.current += dt
      if (canvas3dRef.current)   drawScene3D(canvas3dRef.current, timeRef.current, eyeZ, focalD)
      if (canvasSideRef.current) drawSideProfile(canvasSideRef.current, timeRef.current, eyeZ, focalD)
      if (canvas2dRef.current)   draw2DProjection(canvas2dRef.current, timeRef.current, focalD, eyeZ)
      animRef.current = requestAnimationFrame(frame)
    }
    animRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(animRef.current)
  }, [running, eyeZ, focalD])

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
              <div className="text-amber-300/80 mb-1">x&apos; = X · d / Z</div>
              <div className="text-amber-300/80">y&apos; = Y · d / Z</div>
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
          <h2 className={`${playfair.className} text-xl font-semibold text-amber-100 mb-4`}>Homogeneous 3D Coordinates</h2>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed">
            Just like 2D points gain a &ldquo;1&rdquo; to become 3D homogeneous, 3D points gain a &ldquo;1&rdquo; to become 4D homogeneous.
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
            <h2 className={`${playfair.className} text-xl font-semibold text-amber-100`}>Live Demo: Perspective Projection</h2>
            <button
              onClick={() => setRunning(r => !r)}
              className="px-4 py-1.5 border border-amber-900/40 text-amber-200/60 text-sm hover:border-amber-700/50 hover:text-amber-200/80 transition-colors"
            >
              {running ? 'Pause' : 'Resume'}
            </button>
          </div>
          <p className="text-slate-400 text-sm mb-5 leading-relaxed">
            Left: 3D scene showing the camera, frustum cone, and the projection plane as a tilted screen — cream dots are individual projected vertices.
            Middle: side-profile schematic showing depth, frustum angle, and how rays hit the plane.
            Right: the clean 2D result.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-amber-700/45 text-[10px] uppercase tracking-widest mb-1.5 text-center">3D scene — oblique view</p>
              <canvas
                ref={canvas3dRef}
                width={420}
                height={380}
                className="w-full border border-amber-900/25"
              />
            </div>
            <div>
              <p className="text-amber-700/45 text-[10px] uppercase tracking-widest mb-1.5 text-center">side profile</p>
              <canvas
                ref={canvasSideRef}
                width={380}
                height={380}
                className="w-full border border-amber-900/25"
              />
            </div>
            <div>
              <p className="text-amber-700/45 text-[10px] uppercase tracking-widest mb-1.5 text-center">2D projected result</p>
              <canvas
                ref={canvas2dRef}
                width={380}
                height={380}
                className="w-full border border-amber-900/25"
              />
            </div>
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
                <p className="text-slate-500 text-xs mt-1">Larger = less perspective distortion in the 2D result.</p>
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
                <p className="text-slate-500 text-xs mt-1">Larger = narrower frustum (telephoto). Plane shrinks in the 3D view.</p>
              </div>
            </div>
            <div className="bg-[#0e0c09] border border-amber-900/20 p-4 font-mono text-xs self-start">
              <p className="text-amber-700/60 mb-2 text-[10px] uppercase tracking-widest">Projection formula</p>
              <p className="text-amber-200/60">
                <span className="text-amber-300/80">x&apos;</span> = X · <span className="text-amber-400">{focalD}</span> / (Z + <span className="text-amber-400">{eyeZ}</span>)
              </p>
              <p className="mt-1 text-amber-200/60">
                <span className="text-amber-300/80">y&apos;</span> = Y · <span className="text-amber-400">{focalD}</span> / (Z + <span className="text-amber-400">{eyeZ}</span>)
              </p>
              <div className="mt-3 pt-3 border-t border-amber-900/20 space-y-1 text-[10px] text-slate-500">
                <div><span className="text-amber-500/70">■</span> amber = 3D object &amp; camera</div>
                <div><span className="text-amber-100/40">■</span> cream = projected 2D points on plane</div>
                <div><span className="text-amber-500/25">◈</span> dashed cone = frustum (field of view)</div>
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
