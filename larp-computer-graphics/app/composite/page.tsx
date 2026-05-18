'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, RotateCcw, Clock, Trophy } from 'lucide-react'

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

function mKey(m: M3) {
  return m.flat().join(',')
}

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

// For q2 and q3 the options are duplicated — fix unique keys by using index
function Matrix3x3Display({ m }: { m: M3 }) {
  return (
    <div className="font-mono text-xs inline-flex items-center gap-0.5">
      <span className="text-slate-400 text-lg leading-[1.05]" style={{ fontWeight: 100 }}>
        ⎡<br />⎢<br />⎣
      </span>
      <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 tabular-nums text-center">
        {m.map((row, r) =>
          row.map((v, c) => <span key={`${r}${c}`} className="text-slate-200">{v}</span>)
        )}
      </div>
      <span className="text-slate-400 text-lg leading-[1.05]" style={{ fontWeight: 100 }}>
        ⎤<br />⎥<br />⎦
      </span>
    </div>
  )
}

function drawScene(canvas: HTMLCanvasElement, target: Pt[], flash: 'correct' | 'wrong' | null) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width, H = canvas.height
  const cx = Math.round(W * 0.42), cy = Math.round(H / 2)
  const sc = 50

  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1
  for (let i = -5; i <= 7; i++) {
    ctx.beginPath(); ctx.moveTo(cx + i * sc, 0); ctx.lineTo(cx + i * sc, H); ctx.stroke()
  }
  for (let i = -5; i <= 5; i++) {
    ctx.beginPath(); ctx.moveTo(0, cy + i * sc); ctx.lineTo(W, cy + i * sc); ctx.stroke()
  }

  ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()

  ctx.fillStyle = '#475569'; ctx.font = '10px monospace'
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

  const toC = (p: Pt): Pt => [cx + p[0] * sc, cy - p[1] * sc]

  const drawPoly = (pts: Pt[], fill: string, stroke: string, dash = false) => {
    if (!pts.length) return
    ctx.beginPath()
    ctx.moveTo(...toC(pts[0]))
    for (let i = 1; i < pts.length; i++) ctx.lineTo(...toC(pts[i]))
    ctx.closePath()
    if (dash) ctx.setLineDash([6, 4])
    ctx.fillStyle = fill; ctx.fill()
    ctx.strokeStyle = stroke; ctx.lineWidth = 2.5; ctx.stroke()
    ctx.setLineDash([])
  }

  drawPoly(target, 'rgba(34,197,94,0.10)', '#22c55e80', true)
  drawPoly(SHAPE, 'rgba(59,130,246,0.18)', '#3b82f6')

  if (flash) {
    ctx.fillStyle = flash === 'correct' ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)'
    ctx.fillRect(0, 0, W, H)
  }

  ctx.font = '12px sans-serif'; ctx.textAlign = 'left'
  ctx.fillStyle = '#3b82f6'; ctx.fillRect(8, 8, 11, 11)
  ctx.fillStyle = '#94a3b8'; ctx.fillText('Original', 23, 18)
  ctx.fillStyle = '#22c55e80'; ctx.fillRect(8, 25, 11, 11)
  ctx.fillStyle = '#94a3b8'; ctx.fillText('Target', 23, 35)
}

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
      correct === null ? null : correct ? 'correct' : 'wrong'
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
  const total = QUESTIONS.length

  if (phase === 'intro') return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Link href="/homogeneous" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Homogeneous Coordinates
      </Link>
      <h1 className="text-4xl font-bold text-white mb-3">Composite Transformations</h1>
      <p className="text-slate-400 text-lg mb-8">
        Chain multiple transformations into one matrix. Using homogeneous 3×3 matrices, translation joins the party.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-3">The Formula</h2>
          <p className="text-slate-400 text-sm mb-4">
            To apply M₁ first and then M₂, compute the combined matrix:
          </p>
          <div className="bg-slate-900 rounded-xl p-4 font-mono text-center text-sm">
            <span className="text-amber-400">Mₜₒₜₐₗ</span>
            <span className="text-slate-400"> = </span>
            <span className="text-blue-400">M₁</span>
            <span className="text-slate-400"> · </span>
            <span className="text-purple-400">M₂</span>
          </div>
          <p className="text-slate-500 text-xs mt-3">
            (Row-vector convention: point · Mₜₒₜₐₗ = transformed point)
          </p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-3">Order Matters!</h2>
          <p className="text-slate-400 text-sm mb-3">
            Matrix multiplication is <strong className="text-red-400">not commutative</strong>.
            Translate-then-rotate ≠ rotate-then-translate.
          </p>
          <div className="bg-slate-900 rounded-xl p-3 font-mono text-xs text-red-400">
            M₁ · M₂ ≠ M₂ · M₁ (in general)
          </div>
        </div>
      </div>

      {/* Example */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mb-10">
        <h2 className="text-xl font-bold text-white mb-4">Example: Scale × 2, then translate right 3</h2>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="text-center">
            <p className="text-slate-400 text-xs mb-2">M₁ (scale 2)</p>
            <Matrix3x3Display m={[[2,0,0],[0,2,0],[0,0,1]]} />
          </div>
          <span className="text-slate-500 text-xl">·</span>
          <div className="text-center">
            <p className="text-slate-400 text-xs mb-2">M₂ (translate right 3)</p>
            <Matrix3x3Display m={[[1,0,0],[0,1,0],[3,0,1]]} />
          </div>
          <span className="text-slate-500 text-xl">=</span>
          <div className="text-center">
            <p className="text-amber-400 text-xs mb-2">Mₜₒₜₐₗ</p>
            <Matrix3x3Display m={[[2,0,0],[0,2,0],[3,0,1]]} />
          </div>
        </div>
        <p className="text-slate-400 text-xs mt-4">
          Result: a point (x, y) maps to (2x + 3, 2y) — scaled by 2, then moved 3 units right.
        </p>
      </div>

      <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Ready for the Challenge?</h2>
        <p className="text-slate-400 mb-6">
          {total} questions using 3×3 homogeneous matrices. Pick the correct composite matrix that maps the blue shape to the green target.
        </p>
        <button
          onClick={startGame}
          className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Start Game
        </button>
        {leaderboard.length > 0 && (
          <div className="mt-8 text-left">
            <h3 className="text-slate-300 font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" /> Leaderboard
            </h3>
            {leaderboard.map((e, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-0.5">
                <span className="text-slate-500 w-5 text-right">{i + 1}.</span>
                <span className="text-white flex-1">{e.name}</span>
                <span className="text-green-400 font-mono">{e.score}/{total}</span>
                <span className="text-slate-400 font-mono">{fmt(e.time)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  if (phase === 'playing') {
    const q = QUESTIONS[qIndex]
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <div className="text-slate-400 text-sm">Question {qIndex + 1} / {total}</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-300 font-mono text-sm">
              <Clock className="w-4 h-4 text-slate-500" /> {fmt(time)}
            </div>
            <span className="text-sm text-slate-400">Score: <span className="text-white font-semibold">{score}</span></span>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {QUESTIONS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i < qIndex ? 'bg-orange-500' : i === qIndex ? 'bg-red-500' : 'bg-slate-700'}`} />
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">{q.desc}</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {q.steps.map((s, i) => (
                <span key={i} className="text-xs bg-slate-800 border border-slate-700 px-2 py-1 rounded text-slate-400 font-mono">{s}</span>
              ))}
            </div>
            <canvas
              ref={canvasRef}
              width={460}
              height={320}
              className="w-full rounded-xl border border-slate-700/50"
            />
          </div>

          <div>
            <p className="text-slate-400 text-sm mb-4 font-medium uppercase tracking-wide">Select the correct 3×3 composite matrix:</p>
            <div className="grid grid-cols-1 gap-3">
              {shuffled.map((opt, idx) => {
                let border = 'border-slate-700 hover:border-slate-500'
                let bg = 'bg-slate-800/60 hover:bg-slate-800'
                if (selected !== null) {
                  const isAnswer = mKey(opt.m) === mKey(q.answer)
                  if (idx === selected) {
                    border = correct ? 'border-green-500' : 'border-red-500'
                    bg = correct ? 'bg-green-500/10' : 'bg-red-500/10'
                  } else if (isAnswer) {
                    border = 'border-green-500/50'; bg = 'bg-green-500/5'
                  }
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={selected !== null}
                    className={`w-full text-left p-4 rounded-xl border ${border} ${bg} transition-all duration-200 disabled:cursor-default`}
                  >
                    <div className="text-slate-400 text-xs mb-2">{opt.label}</div>
                    <Matrix3x3Display m={opt.m} />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      <div className="text-6xl mb-4">{score === total ? '🏆' : score >= total / 2 ? '🎯' : '📚'}</div>
      <h2 className="text-3xl font-bold text-white mb-2">
        {score === total ? 'Perfect Score!' : `${score} / ${total} Correct`}
      </h2>
      <p className="text-slate-400 mb-2">Time: <span className="text-white font-mono font-semibold">{fmt(time)}</span></p>

      {!submitted ? (
        <div className="mt-8 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <p className="text-slate-300 mb-4 font-medium">Add to leaderboard</p>
          <div className="flex gap-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
            <button onClick={submitScore} className="px-6 py-2 bg-orange-600 rounded-lg text-white font-semibold hover:bg-orange-500 transition-colors">
              Submit
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 text-left">
          <h3 className="text-slate-300 font-semibold mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" /> Leaderboard
          </h3>
          {leaderboard.map((e, i) => (
            <div key={i} className="flex items-center gap-3 text-sm py-1">
              <span className="text-slate-500 w-5 text-right">{i + 1}.</span>
              <span className="text-white flex-1">{e.name}</span>
              <span className="text-green-400 font-mono">{e.score}/{total}</span>
              <span className="text-slate-400 font-mono">{fmt(e.time)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 justify-center mt-6">
        <button onClick={startGame} className="inline-flex items-center gap-2 px-5 py-3 bg-slate-700 rounded-lg text-white font-semibold hover:bg-slate-600 transition-colors">
          <RotateCcw className="w-4 h-4" /> Play Again
        </button>
        <Link href="/perspective" className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity">
          3D Projection <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
