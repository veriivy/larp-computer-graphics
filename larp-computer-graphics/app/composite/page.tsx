'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Playfair_Display } from 'next/font/google'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, RotateCcw, Clock, Trophy } from 'lucide-react'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
})

type M3 = [[number, number, number], [number, number, number], [number, number, number]]
type Pt = [number, number]

// Row-vector convention: [x, y, 1] · M
function applyM3(m: M3, p: Pt): Pt {
  const x = p[0] * m[0][0] + p[1] * m[1][0] + 1 * m[2][0]
  const y = p[0] * m[0][1] + p[1] * m[1][1] + 1 * m[2][1]
  return [x, y]
}

function transformShape(m: M3, shape: Pt[]): Pt[] {
  return shape.map(p => applyM3(m, p))
}

function mKey(m: M3) { return m.flat().join(',') }

const SHAPE: Pt[] = [
  [-0.6, 0.4], [0.4, 0.4], [0.4, 0.8],
  [1.1, 0], [0.4, -0.8], [0.4, -0.4], [-0.6, -0.4],
]

const QUESTIONS: {
  id: number
  desc: string
  steps: string[]
  answer: M3
  options: { label: string; m: M3 }[]
}[] = [
  {
    id: 0,
    desc: 'Scale by 2, then translate 3 units right',
    steps: ['M₁ = scale by 2', 'M₂ = translate (3, 0)', 'Mₜₒₜₐₗ = M₁ · M₂'],
    answer: [[2,0,0],[0,2,0],[3,0,1]],
    options: [
      { label: 'Scale 2 then translate right 3 (correct order)', m: [[2,0,0],[0,2,0],[3,0,1]] },
      { label: 'Translate right 3 then scale 2 (wrong order)', m: [[2,0,0],[0,2,0],[6,0,1]] },
      { label: 'Scale 2 only, no translation', m: [[2,0,0],[0,2,0],[0,0,1]] },
      { label: 'Translate right 3 only, no scale', m: [[1,0,0],[0,1,0],[3,0,1]] },
    ],
  },
  {
    id: 1,
    desc: 'Reflect across y-axis, then translate 1 unit right',
    steps: ['M₁ = reflect across y-axis', 'M₂ = translate (1, 0)', 'Mₜₒₜₐₗ = M₁ · M₂'],
    answer: [[-1,0,0],[0,1,0],[1,0,1]],
    options: [
      { label: 'Reflect y-axis + translate right 1', m: [[-1,0,0],[0,1,0],[1,0,1]] },
      { label: 'Reflect y-axis only', m: [[-1,0,0],[0,1,0],[0,0,1]] },
      { label: 'Translate right 1 + reflect y-axis', m: [[-1,0,0],[0,1,0],[-1,0,1]] },
      { label: 'Reflect x-axis + translate right 1', m: [[1,0,0],[0,-1,0],[1,0,1]] },
    ],
  },
  {
    id: 2,
    desc: 'Scale by 1.5, then rotate 90° counter-clockwise',
    steps: ['M₁ = scale by 1.5', 'M₂ = rotate 90°', 'Mₜₒₜₐₗ = M₁ · M₂'],
    answer: [[0,1.5,0],[-1.5,0,0],[0,0,1]],
    options: [
      { label: 'Scale 1.5 + rotate 90° CCW', m: [[0,1.5,0],[-1.5,0,0],[0,0,1]] },
      { label: 'Scale 2 + rotate 90° CCW', m: [[0,2,0],[-2,0,0],[0,0,1]] },
      { label: 'Rotate 90° CCW only', m: [[0,1,0],[-1,0,0],[0,0,1]] },
      { label: 'Scale 1.5 + rotate 180°', m: [[-1.5,0,0],[0,-1.5,0],[0,0,1]] },
    ],
  },
  {
    id: 3,
    desc: 'Scale by 0.5, rotate 90° CCW, translate 10 units up',
    steps: ['M₁ = scale 0.5', 'M₂ = rotate 90°', 'M₃ = translate (0, 10)', 'Mₜₒₜₐₗ = M₁·M₂·M₃'],
    answer: [[0,0.5,0],[-0.5,0,0],[0,10,1]],
    options: [
      { label: 'Scale 0.5 + rotate 90° + up 10', m: [[0,0.5,0],[-0.5,0,0],[0,10,1]] },
      { label: 'Scale 0.5 + rotate 90° only', m: [[0,0.5,0],[-0.5,0,0],[0,0,1]] },
      { label: 'Rotate 90° + up 10', m: [[0,1,0],[-1,0,0],[0,10,1]] },
      { label: 'Scale 0.5 + up 10 only', m: [[0.5,0,0],[0,0.5,0],[0,10,1]] },
    ],
  },
  {
    id: 4,
    desc: 'Translate (5, 5), reflect across y-axis, horizontal shear by 1',
    steps: ['M₁ = translate (5, 5)', 'M₂ = reflect y-axis', 'M₃ = horiz. shear by 1', 'Mₜₒₜₐₗ = M₁·M₂·M₃'],
    answer: [[-1,0,0],[1,1,0],[0,5,1]],
    options: [
      { label: 'Translate(5,5) + reflect + shear', m: [[-1,0,0],[1,1,0],[0,5,1]] },
      { label: 'Reflect + shear + translate', m: [[-1,0,0],[1,1,0],[5,5,1]] },
      { label: 'Translate + reflect only', m: [[-1,0,0],[0,1,0],[5,5,1]] },
      { label: 'Translate + shear only', m: [[1,0,0],[1,1,0],[5,5,1]] },
    ],
  },
  {
    id: 5,
    desc: 'Scale by 2, translate 4 left, rotate 180°, reflect x-axis',
    steps: ['M₁=scale 2', 'M₂=translate (−4,0)', 'M₃=rotate 180°', 'M₄=reflect x-axis'],
    answer: [[-2,0,0],[0,2,0],[4,0,1]],
    options: [
      { label: 'Correct composite', m: [[-2,0,0],[0,2,0],[4,0,1]] },
      { label: 'Scale 2 + rotate 180°', m: [[-2,0,0],[0,-2,0],[0,0,1]] },
      { label: 'Scale 2 + reflect x', m: [[2,0,0],[0,-2,0],[0,0,1]] },
      { label: 'Scale 2 + translate left 4', m: [[2,0,0],[0,2,0],[-4,0,1]] },
    ],
  },
]

// ── Matrix display ─────────────────────────────────────────────────────────────

function Matrix3x3({ m }: { m: M3 }) {
  return (
    <div className="inline-flex items-stretch font-mono text-xs">
      <div className="w-2 border-l-2 border-t-2 border-b-2 border-amber-500/50 rounded-tl rounded-bl" />
      <div className="grid grid-cols-3 gap-x-2.5 gap-y-0.5 tabular-nums py-1 px-0.5 text-right">
        {m.map((row, r) =>
          row.map((v, c) => (
            <span key={`${r}${c}`} className="text-amber-100/85 min-w-[1.5ch]">{v}</span>
          ))
        )}
      </div>
      <div className="w-2 border-r-2 border-t-2 border-b-2 border-amber-500/50 rounded-tr rounded-br" />
    </div>
  )
}

// ── Canvas drawing ─────────────────────────────────────────────────────────────

function drawScene(canvas: HTMLCanvasElement, target: Pt[], flash: 'correct' | 'wrong' | null) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width, H = canvas.height
  const cx = Math.round(W * 0.42), cy = Math.round(H / 2)
  const sc = 50

  ctx.fillStyle = '#100e0b'
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = '#1e1a14'
  ctx.lineWidth = 1
  for (let i = -5; i <= 7; i++) {
    ctx.beginPath(); ctx.moveTo(cx + i * sc, 0); ctx.lineTo(cx + i * sc, H); ctx.stroke()
  }
  for (let i = -5; i <= 5; i++) {
    ctx.beginPath(); ctx.moveTo(0, cy + i * sc); ctx.lineTo(W, cy + i * sc); ctx.stroke()
  }

  ctx.strokeStyle = '#3d3020'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()

  ctx.fillStyle = '#4a3828'
  ctx.font = '10px monospace'
  ctx.textAlign = 'center'
  for (let i = -4; i <= 6; i++) {
    if (i === 0) continue
    ctx.fillText(String(i), cx + i * sc, cy + 13)
  }
  ctx.textAlign = 'right'
  for (let i = -4; i <= 4; i++) {
    if (i === 0) continue
    ctx.fillText(String(-i), cx - 3, cy + i * sc + 4)
  }

  const toC = (p: Pt): [number, number] => [cx + p[0] * sc, cy - p[1] * sc]

  const drawPoly = (pts: Pt[], fill: string, stroke: string, lw: number, dashed: boolean) => {
    if (!pts.length) return
    const s = pts.map(toC)
    ctx.beginPath()
    ctx.moveTo(s[0][0], s[0][1])
    for (let i = 1; i < s.length; i++) ctx.lineTo(s[i][0], s[i][1])
    ctx.closePath()
    ctx.fillStyle = fill; ctx.fill()
    ctx.strokeStyle = stroke; ctx.lineWidth = lw
    ctx.setLineDash(dashed ? [6, 4] : [])
    ctx.stroke()
    ctx.setLineDash([])
  }

  drawPoly(target, 'rgba(254,243,199,0.07)', 'rgba(254,243,199,0.45)', 2.5, true)
  drawPoly(SHAPE, 'rgba(217,119,6,0.18)', '#d97706', 2.5, false)

  if (flash) {
    ctx.fillStyle = flash === 'correct' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'
    ctx.fillRect(0, 0, W, H)
  }

  ctx.font = '11px monospace'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#d97706'
  ctx.fillRect(10, 10, 12, 9)
  ctx.fillStyle = '#7a5c3a'
  ctx.fillText('Original', 26, 19)
  ctx.strokeStyle = 'rgba(254,243,199,0.45)'
  ctx.setLineDash([5, 3])
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(10, 30); ctx.lineTo(22, 30); ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = '#7a5c3a'
  ctx.fillText('Target', 26, 34)
}

// ── Page ───────────────────────────────────────────────────────────────────────

type Phase = 'intro' | 'playing' | 'done'

export default function CompositePage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correct, setCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(0)
  const [shuffled, setShuffled] = useState<{ label: string; m: M3 }[]>([])
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [leaderboard, setLeaderboard] = useState<{ name: string; time: number; score: number }[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const total = QUESTIONS.length

  useEffect(() => {
    try { setLeaderboard(JSON.parse(localStorage.getItem('comp-lb') || '[]')) } catch {}
  }, [])

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
    if (phase !== 'playing' || !canvasRef.current) return
    drawScene(
      canvasRef.current,
      transformShape(QUESTIONS[qIndex].answer, SHAPE),
      correct === null ? null : correct ? 'correct' : 'wrong',
    )
  }, [phase, qIndex, correct])

  function startGame() {
    setQIndex(0); setScore(0); setTime(0); setSubmitted(false)
    setPhase('playing')
    timerRef.current = setInterval(() => setTime(t => t + 1), 1000)
  }

  function handleSelect(idx: number) {
    if (selected !== null) return
    setSelected(idx)
    const isCorrect = mKey(shuffled[idx].m) === mKey(QUESTIONS[qIndex].answer)
    setCorrect(isCorrect)
    if (isCorrect) setScore(s => s + 1)
    setTimeout(() => {
      if (qIndex + 1 < QUESTIONS.length) { setQIndex(i => i + 1) }
      else { stopTimer(); setPhase('done') }
    }, 1400)
  }

  function submitScore() {
    const entry = { name: name.trim() || 'Anonymous', time, score }
    const updated = [...leaderboard, entry].sort((a, b) => b.score - a.score || a.time - b.time).slice(0, 10)
    setLeaderboard(updated)
    try { localStorage.setItem('comp-lb', JSON.stringify(updated)) } catch {}
    setSubmitted(true)
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // ── Intro ──────────────────────────────────────────────────────────────────

  if (phase === 'intro') return (
    <div className="bg-[#0e0c09] min-h-screen px-6 py-12">
      <div className="max-w-5xl mx-auto">

        <div className="mb-12 text-center">
          <div className="mb-6 flex items-center justify-center gap-4">
            <span className="h-px w-16 bg-amber-300/30" />
            <span className="text-[10px] font-light uppercase tracking-[0.55em] text-amber-300/50">Module III</span>
            <span className="h-px w-16 bg-amber-300/30" />
          </div>
          <h1 className={`${playfair.className} text-4xl sm:text-5xl font-bold italic text-amber-50 mb-4`}>
            Composite Transformations
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed text-sm">
            Chain multiple transformations into one matrix. Using homogeneous 3×3 matrices,
            translation joins the party — and order always matters.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <div className="border border-amber-900/25 bg-[#131008] p-6">
            <h2 className={`${playfair.className} text-xl font-semibold text-amber-100 mb-3`}>The Formula</h2>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
              To apply M₁ first and then M₂, compute the combined matrix:
            </p>
            <div className="bg-[#0e0c09] border border-amber-900/20 p-4 font-mono text-center text-sm">
              <span className="text-amber-400">Mₜₒₜₐₗ</span>
              <span className="text-slate-500"> = </span>
              <span className="text-amber-200/70">M₁</span>
              <span className="text-slate-500"> · </span>
              <span className="text-amber-200/50">M₂</span>
            </div>
            <p className="text-slate-500 text-xs mt-3">
              Row-vector convention: point · Mₜₒₜₐₗ = transformed point
            </p>
          </div>
          <div className="border border-amber-900/25 bg-[#131008] p-6">
            <h2 className={`${playfair.className} text-xl font-semibold text-amber-100 mb-3`}>Order Matters!</h2>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
              Matrix multiplication is <strong className="text-amber-400/80">not commutative</strong>.
              Translate-then-rotate ≠ rotate-then-translate.
            </p>
            <div className="bg-[#0e0c09] border border-amber-900/20 p-3 font-mono text-xs text-amber-600/70">
              M₁ · M₂ ≠ M₂ · M₁  (in general)
            </div>
          </div>
        </div>

        <div className="border border-amber-900/25 bg-[#131008] p-6 mb-10">
          <h2 className={`${playfair.className} text-xl font-semibold text-amber-100 mb-4`}>Example: Scale ×2, then translate right 3</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-amber-700/50 text-xs mb-2">M₁ (scale 2)</p>
              <Matrix3x3 m={[[2,0,0],[0,2,0],[0,0,1]]} />
            </div>
            <span className="text-amber-700/40 text-xl">·</span>
            <div className="text-center">
              <p className="text-amber-700/50 text-xs mb-2">M₂ (translate right 3)</p>
              <Matrix3x3 m={[[1,0,0],[0,1,0],[3,0,1]]} />
            </div>
            <span className="text-amber-700/40 text-xl">=</span>
            <div className="text-center">
              <p className="text-amber-400/70 text-xs mb-2">Mₜₒₜₐₗ</p>
              <Matrix3x3 m={[[2,0,0],[0,2,0],[3,0,1]]} />
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-4">
            Result: a point (x, y) maps to (2x + 3, 2y) — scaled by 2, then moved 3 units right.
          </p>
        </div>

        <div className="border border-amber-900/30 bg-[#131008] p-8 sm:p-10 text-center">
          <h2 className={`${playfair.className} text-2xl font-semibold text-amber-100 mb-3`}>
            Ready for the Challenge?
          </h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
            {total} questions using 3×3 homogeneous matrices. Pick the correct composite matrix that maps the amber shape to the cream target.
          </p>
          <button
            onClick={startGame}
            className="group relative inline-block overflow-hidden border border-amber-200/45 px-12 py-[13px]"
          >
            <span className="absolute inset-0 translate-y-full bg-amber-100 transition-transform duration-500 ease-in-out group-hover:translate-y-0" aria-hidden="true" />
            <span className="relative z-10 text-[11px] font-normal uppercase tracking-[0.5em] text-amber-100 transition-all duration-500 group-hover:tracking-[0.65em] group-hover:text-slate-800">
              Start Game
            </span>
          </button>

          {leaderboard.length > 0 && (
            <div className="mt-10 text-left max-w-sm mx-auto">
              <p className={`${playfair.className} text-[10px] uppercase tracking-[0.45em] text-amber-700/50 mb-3 flex items-center gap-2`}>
                <Trophy className="w-3 h-3" /> Leaderboard
              </p>
              {leaderboard.map((e, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-amber-900/15">
                  <span className={`${playfair.className} italic text-amber-700/40 w-5 text-right text-sm`}>{i + 1}</span>
                  <span className="text-amber-100/70 flex-1 text-sm">{e.name}</span>
                  <span className="text-amber-400/70 font-mono text-xs">{e.score}/{total}</span>
                  <span className="text-slate-500 font-mono text-xs">{fmt(e.time)}</span>
                </div>
              ))}
            </div>
          )}
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
              Question {qIndex + 1} of {total}
            </span>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5 text-amber-200/50 font-mono text-sm">
                <Clock className="w-3.5 h-3.5 text-amber-700/50" /> {fmt(time)}
              </div>
              <span className="text-sm text-amber-700/50">
                Score: <span className="text-amber-200/70 font-semibold">{score}</span>
              </span>
            </div>
          </div>

          <div className="flex gap-2 mb-7">
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`h-0.5 flex-1 ${
                  i < qIndex ? 'bg-amber-600/70' : i === qIndex ? 'bg-amber-400/60' : 'bg-amber-900/30'
                }`}
              />
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className={`${playfair.className} text-xl font-semibold text-amber-50 mb-2`}>{q.desc}</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {q.steps.map((s, i) => (
                  <span key={i} className="text-xs border border-amber-900/30 px-2 py-1 text-amber-700/60 font-mono">{s}</span>
                ))}
              </div>
              <canvas
                ref={canvasRef}
                width={460}
                height={320}
                className="w-full border border-amber-900/25"
              />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.45em] text-amber-700/50 mb-4">
                Select the correct 3×3 composite matrix
              </p>
              <div className="grid gap-3">
                {shuffled.map((opt, idx) => {
                  const isAnswer = mKey(opt.m) === mKey(q.answer)
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
                      className={`w-full text-left p-4 border ${borderClass} ${bgClass} transition-all duration-200 disabled:cursor-default`}
                    >
                      <div className="text-amber-700/60 text-xs mb-2">{opt.label}</div>
                      <Matrix3x3 m={opt.m} />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Done ───────────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#0e0c09] min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex items-center justify-center gap-4">
          <span className="h-px w-12 bg-amber-300/30" />
          <span className="text-[10px] tracking-[0.5em] text-amber-300/40 uppercase">Result</span>
          <span className="h-px w-12 bg-amber-300/30" />
        </div>

        <h2 className={`${playfair.className} text-4xl font-bold italic text-amber-50 mb-2`}>
          {score === total ? 'Parfait!' : score >= total / 2 ? 'Well done' : 'Keep studying'}
        </h2>
        <p className={`${playfair.className} text-lg text-amber-700/60 mb-1`}>{score} / {total} correct</p>
        <p className="text-slate-500 text-sm mb-8">
          Time: <span className="text-amber-200/60 font-mono">{fmt(time)}</span>
        </p>

        {!submitted ? (
          <div className="border border-amber-900/30 bg-[#131008] p-6 mb-6">
            <p className={`${playfair.className} text-sm text-amber-200/60 mb-4`}>Add to leaderboard</p>
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
              <Trophy className="w-3 h-3" /> Leaderboard
            </p>
            {leaderboard.map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-amber-900/15">
                <span className={`${playfair.className} italic text-amber-700/40 w-5 text-right text-sm`}>{i + 1}</span>
                <span className="text-amber-100/70 flex-1 text-sm">{e.name}</span>
                <span className="text-amber-400/70 font-mono text-xs">{e.score}/{total}</span>
                <span className="text-slate-500 font-mono text-xs">{fmt(e.time)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={startGame}
            className="inline-flex items-center gap-2 px-6 py-3 border border-amber-900/40 text-amber-200/60 text-sm hover:border-amber-700/50 hover:text-amber-200/80 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Play Again
          </button>
          <Link
            href="/perspective"
            className="group relative inline-block overflow-hidden border border-amber-200/45 px-6 py-3"
          >
            <span className="absolute inset-0 translate-y-full bg-amber-100 transition-transform duration-500 ease-in-out group-hover:translate-y-0" aria-hidden="true" />
            <span className="relative z-10 text-[11px] font-normal uppercase tracking-[0.4em] text-amber-100 transition-all duration-500 group-hover:text-slate-800 inline-flex items-center gap-2">
              3D Projection <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
