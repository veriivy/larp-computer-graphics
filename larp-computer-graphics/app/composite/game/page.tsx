'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Playfair_Display } from 'next/font/google'
import Link from 'next/link'
import { RotateCcw, Clock, Star, Trophy } from 'lucide-react'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
})

type M3 = [[number, number, number], [number, number, number], [number, number, number]]
type Pt = [number, number]

const REMY_SHAPE: Pt[] = [
  [ 1.15,  0.05],
  [ 1.05,  0.38],
  [ 0.82,  0.58],
  [ 0.55,  0.70],
  [ 0.42,  0.98],
  [ 0.26,  0.73],
  [-0.05,  0.72],
  [-0.50,  0.70],
  [-0.90,  0.60],
  [-1.15,  0.35],
  [-1.08,  0.05],
  [-1.38, -0.14],
  [-1.18, -0.34],
  [-0.88, -0.20],
  [-0.72, -0.52],
  [-0.48, -0.64],
  [-0.05, -0.68],
  [ 0.42, -0.62],
  [ 0.62, -0.52],
  [ 0.82, -0.58],
  [ 1.02, -0.36],
  [ 1.12, -0.10],
]

const COURSES = ['Amuse-bouche', 'Entrée', 'Plat principal', 'Dessert'] as const

function applyM3(m: M3, p: Pt): Pt {
  return [
    p[0] * m[0][0] + p[1] * m[1][0] + m[2][0],
    p[0] * m[0][1] + p[1] * m[1][1] + m[2][1],
  ]
}

function transformShape(m: M3, shape: Pt[]): Pt[] {
  return shape.map(p => applyM3(m, p))
}

const IDENTITY_M3: M3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]

function lerpM3(t: number, m: M3): M3 {
  return [
    [1 - t + t * m[0][0], t * m[0][1], 0],
    [t * m[1][0], 1 - t + t * m[1][1], 0],
    [t * m[2][0], t * m[2][1], 1],
  ]
}

function mKey(m: M3) { return m.flat().join(',') }

function numFmt(n: number): string {
  if (n === 0) return '0'
  if (n === 1) return '1'
  if (n === -1) return '−1'
  const r = Math.round(n * 100) / 100
  return r < 0 ? '−' + String(-r) : String(r)
}

const QUESTIONS: {
  id: number
  desc: string
  steps: string[]
  answer: M3
  options: M3[]
}[] = [
  {
    id: 0,
    desc: 'Scale Remy by 2, then translate 1 unit right',
    steps: ['M₁ = scale ×2', 'M₂ = translate (1, 0)', 'Mₜₒₜₐₗ = M₁ · M₂'],
    answer: [[2,0,0],[0,2,0],[1,0,1]],
    options: [
      [[2,0,0],[0,2,0],[1,0,1]],
      [[2,0,0],[0,2,0],[2,0,1]],
      [[2,0,0],[0,2,0],[0,0,1]],
      [[1,0,0],[0,1,0],[1,0,1]],
    ],
  },
  {
    id: 1,
    desc: 'Reflect Remy across the y-axis, then translate 2 units right',
    steps: ['M₁ = reflect y-axis', 'M₂ = translate (2, 0)', 'Mₜₒₜₐₗ = M₁ · M₂'],
    answer: [[-1,0,0],[0,1,0],[2,0,1]],
    options: [
      [[-1,0,0],[0,1,0],[2,0,1]],
      [[-1,0,0],[0,1,0],[-2,0,1]],
      [[-1,0,0],[0,1,0],[0,0,1]],
      [[1,0,0],[0,1,0],[2,0,1]],
    ],
  },
  {
    id: 2,
    desc: 'Scale Remy by 0.5, then rotate 90° counter-clockwise',
    steps: ['M₁ = scale ×0.5', 'M₂ = rotate 90° CCW', 'Mₜₒₜₐₗ = M₁ · M₂'],
    answer: [[0,0.5,0],[-0.5,0,0],[0,0,1]],
    options: [
      [[0,0.5,0],[-0.5,0,0],[0,0,1]],
      [[0,1,0],[-1,0,0],[0,0,1]],
      [[0,0.5,0],[0.5,0,0],[0,0,1]],
      [[-0.5,0,0],[0,-0.5,0],[0,0,1]],
    ],
  },
  {
    id: 3,
    desc: 'Translate Remy by (1, 1), then reflect across the x-axis',
    steps: ['M₁ = translate (1, 1)', 'M₂ = reflect x-axis', 'Mₜₒₜₐₗ = M₁ · M₂'],
    answer: [[1,0,0],[0,-1,0],[1,-1,1]],
    options: [
      [[1,0,0],[0,-1,0],[1,-1,1]],
      [[1,0,0],[0,-1,0],[1,1,1]],
      [[1,0,0],[0,-1,0],[0,0,1]],
      [[1,0,0],[0,1,0],[1,1,1]],
    ],
  },
]

// ── Matrix display ─────────────────────────────────────────────────────────────

function Matrix3x3({ m }: { m: M3 }) {
  return (
    <div className="inline-flex items-stretch font-mono text-xs">
      <div className="w-2 border-l-2 border-t-2 border-b-2 border-amber-500/50 rounded-tl rounded-bl" />
      <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 tabular-nums py-1 px-0.5 text-right">
        {m.map((row, r) =>
          row.map((v, c) => (
            <span key={`${r}${c}`} className="text-amber-100/85 min-w-[2ch]">{numFmt(v)}</span>
          ))
        )}
      </div>
      <div className="w-2 border-r-2 border-t-2 border-b-2 border-amber-500/50 rounded-tr rounded-br" />
    </div>
  )
}

// ── Canvas drawing ─────────────────────────────────────────────────────────────

function drawPoly(
  ctx: CanvasRenderingContext2D,
  cs: [number, number][],
  fill: string,
  stroke: string,
  lw: number,
  dashed: boolean,
) {
  if (!cs.length) return
  ctx.beginPath()
  ctx.moveTo(cs[0][0], cs[0][1])
  for (let i = 1; i < cs.length; i++) ctx.lineTo(cs[i][0], cs[i][1])
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = stroke
  ctx.lineWidth = lw
  ctx.setLineDash(dashed ? [6, 4] : [])
  ctx.stroke()
  ctx.setLineDash([])
}

function drawShapeWithImg(
  ctx: CanvasRenderingContext2D,
  shape: Pt[],
  animM: M3,
  img: HTMLImageElement | null,
  cx: number, cy: number, sc: number,
  fill: string, stroke: string, lw: number,
) {
  const toC = (p: Pt): [number, number] => [cx + p[0] * sc, cy - p[1] * sc]
  const cs = transformShape(animM, shape).map(toC)
  if (!cs.length) return
  ctx.beginPath()
  ctx.moveTo(cs[0][0], cs[0][1])
  for (let i = 1; i < cs.length; i++) ctx.lineTo(cs[i][0], cs[i][1])
  ctx.closePath()
  if (img) {
    const FIT_W = 6 * sc, FIT_H = 5 * sc
    const imgScale = Math.min(FIT_W / img.naturalWidth, FIT_H / img.naturalHeight, 1)
    const iw = img.naturalWidth * imgScale, ih = img.naturalHeight * imgScale
    ctx.save()
    ctx.clip()
    ctx.transform(
      animM[0][0], -animM[0][1],
      -animM[1][0], animM[1][1],
      cx * (1 - animM[0][0]) + animM[1][0] * cy + animM[2][0] * sc,
      cy * (1 - animM[1][1]) + animM[0][1] * cx - animM[2][1] * sc,
    )
    ctx.drawImage(img, cx - iw / 2, cy - ih / 2, iw, ih)
    ctx.restore()
  } else {
    ctx.fillStyle = fill
    ctx.fill()
  }
  ctx.strokeStyle = stroke
  ctx.lineWidth = lw
  ctx.stroke()
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, sc: number,
  W: number, H: number,
  xRange: [number, number], yRange: [number, number],
) {
  ctx.fillStyle = '#100e0b'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#1e1a14'
  ctx.lineWidth = 1
  for (let i = xRange[0]; i <= xRange[1]; i++) {
    ctx.beginPath(); ctx.moveTo(cx + i * sc, 0); ctx.lineTo(cx + i * sc, H); ctx.stroke()
  }
  for (let i = yRange[0]; i <= yRange[1]; i++) {
    ctx.beginPath(); ctx.moveTo(0, cy + i * sc); ctx.lineTo(W, cy + i * sc); ctx.stroke()
  }
  ctx.strokeStyle = '#3d3020'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()
}

function drawPreview(canvas: HTMLCanvasElement, img: HTMLImageElement | null, shape: Pt[]) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width, H = canvas.height
  const cx = W / 2, cy = H / 2, sc = 28
  drawGrid(ctx, cx, cy, sc, W, H, [-6, 6], [-5, 5])
  drawShapeWithImg(ctx, shape, IDENTITY_M3, img, cx, cy, sc, 'rgba(217,119,6,0.18)', '#d97706', 1.5)
}

function drawGameScene(
  canvas: HTMLCanvasElement,
  target: Pt[],
  flash: 'correct' | 'wrong' | null,
  img: HTMLImageElement | null,
  shape: Pt[],
  animM: M3 = IDENTITY_M3,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width, H = canvas.height
  const cx = Math.round(W * 0.42), cy = Math.round(H / 2), sc = 55

  drawGrid(ctx, cx, cy, sc, W, H, [-5, 7], [-4, 4])

  ctx.fillStyle = '#4a3828'
  ctx.font = '11px monospace'
  ctx.textAlign = 'center'
  for (let i = -4; i <= 6; i++) {
    if (i === 0) continue
    ctx.fillText(String(i), cx + i * sc, cy + 14)
  }
  ctx.textAlign = 'right'
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue
    ctx.fillText(String(-i), cx - 4, cy + i * sc + 4)
  }
  ctx.fillStyle = '#5a4535'
  ctx.textAlign = 'left'
  ctx.fillText('x', W - 12, cy - 5)
  ctx.fillText('y', cx + 6, 13)

  const toC = (p: Pt): [number, number] => [cx + p[0] * sc, cy - p[1] * sc]
  drawPoly(ctx, target.map(toC), 'rgba(254,243,199,0.07)', 'rgba(254,243,199,0.45)', 2.5, true)
  drawShapeWithImg(ctx, shape, animM, img, cx, cy, sc, 'rgba(217,119,6,0.18)', '#d97706', 2.5)

  if (flash) {
    ctx.fillStyle = flash === 'correct' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'
    ctx.fillRect(0, 0, W, H)
  }

  ctx.font = '11px monospace'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#d97706'
  ctx.fillRect(10, 10, 12, 9)
  ctx.fillStyle = '#7a5c3a'
  ctx.fillText('Remy', 26, 19)
  ctx.strokeStyle = 'rgba(254,243,199,0.45)'
  ctx.setLineDash([5, 3])
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(10, 30); ctx.lineTo(22, 30); ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = '#7a5c3a'
  ctx.fillText('Target', 26, 34)
}

// ── Star rating ────────────────────────────────────────────────────────────────

function starsForScore(score: number) {
  if (score >= 4) return 3
  if (score >= 3) return 2
  if (score >= 2) return 1
  return 0
}

const STAR_LABELS = ['', 'Une Étoile', 'Deux Étoiles', 'Trois Étoiles'] as const

// ── Page ───────────────────────────────────────────────────────────────────────

type Phase = 'intro' | 'playing' | 'done'

export default function CompositeGamePage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correct, setCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(0)
  const [shuffled, setShuffled] = useState<M3[]>([])
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [leaderboard, setLeaderboard] = useState<{ name: string; time: number; score: number }[]>([])
  const [remyImg, setRemyImg] = useState<HTMLImageElement | null>(null)
  const [activeShape, setActiveShape] = useState<Pt[]>(REMY_SHAPE)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const suppressEffectRef = useRef(false)

  useEffect(() => {
    try { setLeaderboard(JSON.parse(localStorage.getItem('comp-game-lb') || '[]')) } catch {}
  }, [])

  useEffect(() => {
    return () => { if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current) }
  }, [])

  useEffect(() => {
    try {
      const savedShape = localStorage.getItem('remy-shape')
      if (savedShape) {
        const pts = JSON.parse(savedShape) as Pt[]
        if (Array.isArray(pts) && pts.length >= 3) setActiveShape(pts)
      }
      const savedImg = localStorage.getItem('remy-img')
      const src = savedImg || '/remy.png'
      const img = new Image()
      img.onload = () => setRemyImg(img)
      img.src = src
    } catch {
      const img = new Image()
      img.onload = () => setRemyImg(img)
      img.src = '/remy.png'
    }
  }, [])

  useEffect(() => {
    if (previewRef.current) drawPreview(previewRef.current, remyImg, activeShape)
  }, [remyImg, activeShape])

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    const opts = [...QUESTIONS[qIndex].options].sort(() => Math.random() - 0.5)
    setShuffled(opts)
    setSelected(null)
    setCorrect(null)
  }, [phase, qIndex])

  useEffect(() => {
    if (phase !== 'playing' || !canvasRef.current || suppressEffectRef.current) return
    const q = QUESTIONS[qIndex]
    drawGameScene(
      canvasRef.current,
      transformShape(q.answer, activeShape),
      correct === null ? null : correct ? 'correct' : 'wrong',
      remyImg,
      activeShape,
    )
  }, [phase, qIndex, correct, remyImg, activeShape])

  function startGame() {
    setQIndex(0); setScore(0); setTime(0); setSubmitted(false)
    setPhase('playing')
    timerRef.current = setInterval(() => setTime(t => t + 1), 1000)
  }

  function handleSelect(idx: number) {
    if (selected !== null) return
    setSelected(idx)
    const isCorrect = mKey(shuffled[idx]) === mKey(QUESTIONS[qIndex].answer)
    setCorrect(isCorrect)
    if (isCorrect) setScore(s => s + 1)

    const advance = () => {
      if (qIndex + 1 < QUESTIONS.length) setQIndex(i => i + 1)
      else { stopTimer(); setPhase('done') }
    }

    if (isCorrect && canvasRef.current) {
      const canvas = canvasRef.current
      const answerM = QUESTIONS[qIndex].answer
      const capturedShape = activeShape
      const capturedImg = remyImg
      const target = transformShape(answerM, capturedShape)
      const startTime = performance.now()
      const ANIM_MS = 900

      suppressEffectRef.current = true
      const animate = (now: number) => {
        const raw = Math.min((now - startTime) / ANIM_MS, 1)
        const t = raw * raw * (3 - 2 * raw)
        drawGameScene(canvas, target, 'correct', capturedImg, capturedShape, lerpM3(t, answerM))
        if (raw < 1) {
          animFrameRef.current = requestAnimationFrame(animate)
        } else {
          animFrameRef.current = null
          suppressEffectRef.current = false
          setTimeout(advance, 350)
        }
      }
      animFrameRef.current = requestAnimationFrame(animate)
    } else {
      setTimeout(advance, 1400)
    }
  }

  function submitScore() {
    const entry = { name: name.trim() || 'Anonymous', time, score }
    const updated = [...leaderboard, entry].sort((a, b) => b.score - a.score || a.time - b.time).slice(0, 10)
    setLeaderboard(updated)
    try { localStorage.setItem('comp-game-lb', JSON.stringify(updated)) } catch {}
    setSubmitted(true)
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // ── Intro ──────────────────────────────────────────────────────────────────

  if (phase === 'intro') return (
    <div className="bg-[#0e0c09] min-h-screen px-6 py-12">
      <div className="max-w-5xl mx-auto">

        <div className="mb-10 flex items-center justify-center gap-4">
          <span className="h-px w-16 bg-amber-300/30" />
          <span className="text-[10px] font-light uppercase tracking-[0.55em] text-amber-300/50">Gusteau’s</span>
          <span className="h-px w-16 bg-amber-300/30" />
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">

          {/* Left: title, menu + preview, start */}
          <div>
            <h1 className={`${playfair.className} text-4xl font-bold italic text-amber-50 mb-3`}>
              Earn Your Stars
            </h1>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              Chain transformations into a single composite matrix. Four courses — identify
              the correct 3×3 homogeneous matrix for each.
              The fastest perfect score earns <span className="text-amber-300/70">trois étoiles</span>.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="border border-amber-900/25 bg-[#131008]">
                <div className="px-4 pt-4 pb-3 border-b border-amber-900/20">
                  <p className="text-[10px] uppercase tracking-[0.45em] text-amber-700/50">Ce soir — Tonight&apos;s menu</p>
                </div>
                {COURSES.map((course, i) => (
                  <div key={course} className="flex items-baseline gap-2 px-4 py-2.5 border-b border-amber-900/10 last:border-0">
                    <span className={`${playfair.className} text-xs italic text-amber-700/35 w-4 shrink-0`}>{i + 1}</span>
                    <span className={`${playfair.className} text-sm text-amber-100/70`}>{course}</span>
                  </div>
                ))}
              </div>

              <div className="border border-amber-900/25 bg-[#131008] p-4 flex flex-col">
                <p className="text-[10px] uppercase tracking-[0.45em] text-amber-700/50 mb-3">Remy — sous chef</p>
                <canvas ref={previewRef} width={340} height={220} className="w-full flex-1 min-h-0" />
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full group relative inline-block overflow-hidden border border-amber-200/45 px-12 py-[13px]"
            >
              <span className="absolute inset-0 translate-y-full bg-amber-100 transition-transform duration-500 ease-in-out group-hover:translate-y-0" aria-hidden="true" />
              <span className="relative z-10 text-[11px] font-normal uppercase tracking-[0.5em] text-amber-100 transition-all duration-500 group-hover:tracking-[0.65em] group-hover:text-slate-800">
                Begin Service
              </span>
            </button>
          </div>

          {/* Right: leaderboard */}
          <div>
            {leaderboard.length > 0 ? (
              <div className="border border-amber-900/25 bg-[#131008] p-6">
                <p className={`${playfair.className} text-[10px] uppercase tracking-[0.45em] text-amber-700/50 mb-4 flex items-center gap-2`}>
                  <Trophy className="w-3 h-3" /> Hall of Critics
                </p>
                {leaderboard.map((e, i) => {
                  const s = starsForScore(e.score)
                  return (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-amber-900/15">
                      <span className={`${playfair.className} italic text-amber-700/40 w-5 text-right text-sm`}>{i + 1}</span>
                      <span className="text-amber-100/70 flex-1 text-sm">{e.name}</span>
                      <span className="flex gap-0.5">
                        {[0, 1, 2].map(j => (
                          <Star key={j} className={j < s ? 'text-amber-400 fill-amber-400' : 'text-amber-900/25'} size={11} />
                        ))}
                      </span>
                      <span className="text-slate-500 font-mono text-xs">{fmt(e.time)}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="border border-amber-900/15 bg-[#131008]/50 p-8 text-center">
                <div className="flex justify-center gap-2 mb-3">
                  {[0, 1, 2].map(i => <Star key={i} className="text-amber-900/25" size={22} />)}
                </div>
                <p className={`${playfair.className} text-base italic text-amber-700/30 mb-1`}>Awaiting the first critic</p>
                <p className="text-[11px] text-amber-900/40">No scores yet</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )

  // ── Playing ────────────────────────────────────────────────────────────────

  if (phase === 'playing') {
    const q = QUESTIONS[qIndex]
    return (
      <div className="bg-[#0e0c09] min-h-screen px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <span className={`${playfair.className} text-sm italic text-amber-700/50`}>
              {COURSES[qIndex]} <span className="text-amber-900/40 not-italic">· Course {qIndex + 1} of {QUESTIONS.length}</span>
            </span>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5 text-amber-200/50 font-mono text-sm">
                <Clock className="w-3.5 h-3.5 text-amber-700/50" /> {fmt(time)}
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <Star key={i} className={i < starsForScore(score) ? 'text-amber-400 fill-amber-400' : 'text-amber-900/30'} size={14} />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-7">
            {QUESTIONS.map((_, i) => (
              <div key={i} className="flex-1">
                <div className={`h-0.5 ${
                  i < qIndex ? 'bg-amber-600/70' : i === qIndex ? 'bg-amber-400/60' : 'bg-amber-900/30'
                }`} />
                <p className="text-[9px] mt-1 text-amber-900/40 uppercase tracking-wider hidden sm:block">{COURSES[i]}</p>
              </div>
            ))}
          </div>

          <h2 className={`${playfair.className} text-xl font-semibold text-amber-50 mb-1`}>{q.desc}</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {q.steps.map((s, i) => (
              <span key={i} className="text-xs border border-amber-900/30 px-2 py-1 text-amber-700/60 font-mono">{s}</span>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            <canvas
              ref={canvasRef}
              width={480}
              height={340}
              className="w-full border border-amber-900/25"
            />

            <div className="grid grid-cols-2 grid-rows-2 gap-3">
              {shuffled.map((opt, idx) => {
                const isAnswer = mKey(opt) === mKey(q.answer)
                let borderClass = 'border-amber-900/25 hover:border-amber-700/40'
                let bgClass = 'bg-[#131008] hover:bg-[#1a1208]'
                if (selected !== null) {
                  if (idx === selected) {
                    borderClass = correct ? 'border-green-600/60' : 'border-red-600/60'
                    bgClass = correct ? 'bg-green-900/15' : 'bg-red-900/15'
                  } else if (isAnswer) {
                    borderClass = 'border-green-700/40'
                    bgClass = 'bg-green-900/10'
                  }
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={selected !== null}
                    className={`border ${borderClass} ${bgClass} transition-all duration-200 disabled:cursor-default flex items-center justify-center`}
                  >
                    <Matrix3x3 m={opt} />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Done ───────────────────────────────────────────────────────────────────

  const stars = starsForScore(score)
  const resultTitle = stars === 3 ? 'Parfait!' : stars === 2 ? 'Très bien' : stars === 1 ? 'Bien essayé' : "Retournez à l'école"

  return (
    <div className="bg-[#0e0c09] min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex items-center justify-center gap-4">
          <span className="h-px w-12 bg-amber-300/30" />
          <span className="text-[10px] tracking-[0.5em] text-amber-300/40 uppercase">Critique&apos;s Table</span>
          <span className="h-px w-12 bg-amber-300/30" />
        </div>

        <div className="flex justify-center gap-3 mb-4">
          {[0, 1, 2].map(i => (
            <Star
              key={i}
              size={32}
              className={`transition-all duration-500 ${i < stars ? 'text-amber-400 fill-amber-400' : 'text-amber-900/20'}`}
            />
          ))}
        </div>

        {stars > 0 && (
          <p className="text-[10px] uppercase tracking-[0.5em] text-amber-600/60 mb-2">{STAR_LABELS[stars]}</p>
        )}

        <h2 className={`${playfair.className} text-4xl font-bold italic text-amber-50 mb-2`}>
          {resultTitle}
        </h2>
        <p className={`${playfair.className} text-lg text-amber-700/60 mb-1`}>{score} / 4 courses correct</p>
        <p className="text-slate-500 text-sm mb-8">
          Time: <span className="text-amber-200/60 font-mono">{fmt(time)}</span>
        </p>

        {!submitted ? (
          <div className="border border-amber-900/30 bg-[#131008] p-6 mb-6">
            <p className={`${playfair.className} text-sm text-amber-200/60 mb-4`}>Sign the guestbook</p>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="flex-1 bg-[#0e0c09] border border-amber-900/40 px-4 py-2 text-amber-100/80 placeholder-amber-900/60 focus:outline-none focus:border-amber-700/60 text-sm"
              />
              <button
                onClick={submitScore}
                className="px-5 py-2 border border-amber-700/50 text-amber-200/70 text-sm hover:bg-amber-900/20 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-amber-900/30 bg-[#131008] p-6 mb-6 text-left">
            <p className={`${playfair.className} text-[10px] uppercase tracking-[0.45em] text-amber-700/50 mb-3 flex items-center gap-2`}>
              <Trophy className="w-3 h-3" /> Hall of Critics
            </p>
            {leaderboard.map((e, i) => {
              const s = starsForScore(e.score)
              return (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-amber-900/15">
                  <span className={`${playfair.className} italic text-amber-700/40 w-5 text-right text-sm`}>{i + 1}</span>
                  <span className="text-amber-100/70 flex-1 text-sm">{e.name}</span>
                  <span className="flex gap-0.5">
                    {[0, 1, 2].map(j => (
                      <Star key={j} className={j < s ? 'text-amber-400 fill-amber-400' : 'text-amber-900/25'} size={11} />
                    ))}
                  </span>
                  <span className="text-slate-500 font-mono text-xs">{fmt(e.time)}</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={startGame}
            className="inline-flex items-center gap-2 px-6 py-3 border border-amber-900/40 text-amber-200/60 text-sm hover:border-amber-700/50 hover:text-amber-200/80 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Try again
          </button>
          <Link
            href="/perspective"
            className="group relative inline-block overflow-hidden border border-amber-200/45 px-6 py-3"
          >
            <span className="absolute inset-0 translate-y-full bg-amber-100 transition-transform duration-500 ease-in-out group-hover:translate-y-0" aria-hidden="true" />
            <span className="relative z-10 text-[11px] font-normal uppercase tracking-[0.4em] text-amber-100 transition-all duration-500 group-hover:text-slate-800">
              Next →
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
