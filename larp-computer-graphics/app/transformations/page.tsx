'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, RotateCcw, Clock, Trophy } from 'lucide-react'

type M2 = [[number, number], [number, number]]
type Pt = [number, number]

const SHAPE: Pt[] = [
  [-0.8, 0.4], [0.5, 0.4], [0.5, 0.9],
  [1.4, 0], [0.5, -0.9], [0.5, -0.4], [-0.8, -0.4],
]

function applyM2(m: M2, p: Pt): Pt {
  return [m[0][0] * p[0] + m[0][1] * p[1], m[1][0] * p[0] + m[1][1] * p[1]]
}

function transformShape(m: M2, shape: Pt[]): Pt[] {
  return shape.map(p => applyM2(m, p))
}

function mKey(m: M2) {
  return m.flat().join(',')
}

const QUESTIONS: {
  id: number
  desc: string
  detail: string
  answer: M2
  options: { label: string; m: M2 }[]
}[] = [
  {
    id: 0,
    desc: 'Reflect across the line y = x',
    detail: 'Swapping the x and y coordinates reflects every point across the diagonal line y = x.',
    answer: [[0, 1], [1, 0]],
    options: [
      { label: 'Reflection across y = x', m: [[0, 1], [1, 0]] },
      { label: 'Reflection across x-axis', m: [[1, 0], [0, -1]] },
      { label: 'Reflection across y-axis', m: [[-1, 0], [0, 1]] },
      { label: 'Reflection across y = −x', m: [[0, -1], [-1, 0]] },
    ],
  },
  {
    id: 1,
    desc: 'Horizontal expansion by a factor of 3',
    detail: 'Scale x by 3 while keeping y unchanged. Only the first diagonal entry changes.',
    answer: [[3, 0], [0, 1]],
    options: [
      { label: 'Uniform scale by 3', m: [[3, 0], [0, 3]] },
      { label: 'Horizontal expansion ×3', m: [[3, 0], [0, 1]] },
      { label: 'Vertical expansion ×3', m: [[1, 0], [0, 3]] },
      { label: 'Horizontal shear by 3', m: [[1, 3], [0, 1]] },
    ],
  },
  {
    id: 2,
    desc: 'Project onto the y-axis',
    detail: 'All x-coordinates become 0. The shape collapses to a vertical line segment on the y-axis.',
    answer: [[0, 0], [0, 1]],
    options: [
      { label: 'Projection onto x-axis', m: [[1, 0], [0, 0]] },
      { label: 'Zero transformation', m: [[0, 0], [0, 0]] },
      { label: 'Projection onto y-axis', m: [[0, 0], [0, 1]] },
      { label: 'Identity (no change)', m: [[1, 0], [0, 1]] },
    ],
  },
  {
    id: 3,
    desc: 'Reflect across y-axis, then expand horizontally by 2',
    detail: 'Composite: first A = reflect across y-axis, then B = expand by 2. Combined matrix C = BA.',
    answer: [[-2, 0], [0, 1]],
    options: [
      { label: 'Reflect y-axis + uniform expand 2', m: [[-2, 0], [0, 2]] },
      { label: 'Reflect y-axis + horizontal expand 2', m: [[-2, 0], [0, 1]] },
      { label: 'Horizontal expand 2 only', m: [[2, 0], [0, 1]] },
      { label: 'Reflect y-axis + vertical expand 2', m: [[-1, 0], [0, 2]] },
    ],
  },
]

function MatrixBox({ m, highlight }: { m: M2; highlight?: boolean }) {
  return (
    <div className={`font-mono text-sm inline-flex items-center gap-1 ${highlight ? 'text-green-400' : 'text-white'}`}>
      <span className="text-slate-400 text-lg leading-none">⎡<br />⎣</span>
      <div className="grid grid-cols-2 gap-x-3 tabular-nums text-center">
        <span>{m[0][0]}</span><span>{m[0][1]}</span>
        <span>{m[1][0]}</span><span>{m[1][1]}</span>
      </div>
      <span className="text-slate-400 text-lg leading-none">⎤<br />⎦</span>
    </div>
  )
}

function drawScene(
  canvas: HTMLCanvasElement,
  target: Pt[],
  flash: 'correct' | 'wrong' | null,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width
  const H = canvas.height
  const cx = Math.round(W * 0.42)
  const cy = Math.round(H / 2)
  const sc = 55

  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, W, H)

  // Grid lines
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 1
  for (let i = -5; i <= 7; i++) {
    ctx.beginPath(); ctx.moveTo(cx + i * sc, 0); ctx.lineTo(cx + i * sc, H); ctx.stroke()
  }
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath(); ctx.moveTo(0, cy + i * sc); ctx.lineTo(W, cy + i * sc); ctx.stroke()
  }

  // Axes
  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()

  // Tick labels
  ctx.fillStyle = '#475569'
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
  ctx.fillStyle = '#64748b'
  ctx.textAlign = 'left'
  ctx.fillText('x', W - 10, cy - 5)
  ctx.fillText('y', cx + 6, 13)

  const toC = (p: Pt): Pt => [cx + p[0] * sc, cy - p[1] * sc]

  const drawPoly = (pts: Pt[], fill: string, stroke: string, lw = 2.5) => {
    if (!pts.length) return
    ctx.beginPath()
    ctx.moveTo(...toC(pts[0]))
    for (let i = 1; i < pts.length; i++) ctx.lineTo(...toC(pts[i]))
    ctx.closePath()
    ctx.fillStyle = fill
    ctx.fill()
    ctx.strokeStyle = stroke
    ctx.lineWidth = lw
    ctx.stroke()
  }

  // Target shape (green dashed)
  ctx.setLineDash([6, 4])
  drawPoly(target, 'rgba(34,197,94,0.10)', '#22c55e80')
  ctx.setLineDash([])

  // Original shape (blue solid)
  drawPoly(SHAPE, 'rgba(59,130,246,0.18)', '#3b82f6')

  if (flash) {
    ctx.fillStyle = flash === 'correct' ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)'
    ctx.fillRect(0, 0, W, H)
  }

  // Legend
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'left'
  const leg = (x: number, y: number, c: string, txt: string) => {
    ctx.fillStyle = c; ctx.fillRect(x, y - 9, 13, 10)
    ctx.fillStyle = '#94a3b8'; ctx.fillText(txt, x + 17, y)
  }
  leg(8, 16, '#3b82f6', 'Original')
  leg(8, 32, '#22c55e80', 'Target')
}

const TRANSFORMATIONS_INFO = [
  { name: 'Reflection (x-axis)', matrix: '[[1,0],[0,−1]]', desc: 'Flips across the horizontal axis' },
  { name: 'Reflection (y-axis)', matrix: '[[−1,0],[0,1]]', desc: 'Flips across the vertical axis' },
  { name: 'Reflection (y = x)', matrix: '[[0,1],[1,0]]', desc: 'Swaps x and y coordinates' },
  { name: 'Rotation by θ', matrix: '[[cosθ,−sinθ],[sinθ,cosθ]]', desc: 'Rotates counter-clockwise by angle θ' },
  { name: 'Horizontal expansion (k)', matrix: '[[k,0],[0,1]]', desc: 'Scales x by factor k' },
  { name: 'Vertical expansion (k)', matrix: '[[1,0],[0,k]]', desc: 'Scales y by factor k' },
  { name: 'Horizontal shear (k)', matrix: '[[1,k],[0,1]]', desc: 'Slants shape horizontally' },
  { name: 'Projection onto y-axis', matrix: '[[0,0],[0,1]]', desc: 'Collapses x to 0' },
  { name: 'Projection onto x-axis', matrix: '[[1,0],[0,0]]', desc: 'Collapses y to 0' },
]

type Phase = 'intro' | 'playing' | 'done'

export default function TransformationsPage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correct, setCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(0)
  const [shuffled, setShuffled] = useState<{ label: string; m: M2 }[]>([])
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [leaderboard, setLeaderboard] = useState<{ name: string; time: number; score: number }[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    try {
      setLeaderboard(JSON.parse(localStorage.getItem('tg-lb') || '[]'))
    } catch {}
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
    const q = QUESTIONS[qIndex]
    drawScene(canvasRef.current, transformShape(q.answer, SHAPE), correct === null ? null : correct ? 'correct' : 'wrong')
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
      if (qIndex + 1 < QUESTIONS.length) {
        setQIndex(i => i + 1)
      } else {
        stopTimer()
        setPhase('done')
      }
    }, 1400)
  }

  function submitScore() {
    const entry = { name: name.trim() || 'Anonymous', time, score }
    const updated = [...leaderboard, entry].sort((a, b) => b.score - a.score || a.time - b.time).slice(0, 10)
    setLeaderboard(updated)
    try { localStorage.setItem('tg-lb', JSON.stringify(updated)) } catch {}
    setSubmitted(true)
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (phase === 'intro') return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
      <h1 className="text-4xl font-bold text-white mb-3">Basic Transformations</h1>
      <p className="text-slate-400 text-lg mb-10">
        A <strong className="text-slate-200">linear transformation</strong> maps every point in the plane via matrix multiplication.
        For a 2×2 matrix M, the new point is M · <span className="font-mono text-blue-400">[x, y]ᵀ</span>.
        The origin always stays fixed.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
        {TRANSFORMATIONS_INFO.map(t => (
          <div key={t.name} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <div className="text-white font-semibold text-sm mb-1">{t.name}</div>
            <div className="font-mono text-xs text-blue-400 mb-2">{t.matrix}</div>
            <div className="text-slate-400 text-xs">{t.desc}</div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Ready to play?</h2>
        <p className="text-slate-400 mb-6">
          You'll see a shape (blue) and a target (green dashed). Pick the matrix that maps the original to the target.
          4 questions — fastest time wins!
        </p>
        <button
          onClick={startGame}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Start Game
        </button>
        {leaderboard.length > 0 && (
          <div className="mt-8 text-left">
            <h3 className="text-slate-300 font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" /> Leaderboard
            </h3>
            <div className="space-y-1">
              {leaderboard.map((e, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-slate-500 w-5 text-right">{i + 1}.</span>
                  <span className="text-white flex-1">{e.name}</span>
                  <span className="text-green-400 font-mono">{e.score}/4</span>
                  <span className="text-slate-400 font-mono">{fmt(e.time)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  if (phase === 'playing') {
    const q = QUESTIONS[qIndex]
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="text-slate-400 text-sm">Question {qIndex + 1} / {QUESTIONS.length}</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-300 font-mono text-sm">
              <Clock className="w-4 h-4 text-slate-500" /> {fmt(time)}
            </div>
            <div className="text-sm text-slate-400">Score: <span className="text-white font-semibold">{score}</span></div>
          </div>
        </div>

        <div className="flex gap-4 mb-2">
          {QUESTIONS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i < qIndex ? 'bg-green-500' : i === qIndex ? 'bg-blue-500' : 'bg-slate-700'}`} />
          ))}
        </div>

        <div className="mt-6 grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">{q.desc}</h2>
            <p className="text-slate-400 text-sm mb-4">{q.detail}</p>
            <canvas
              ref={canvasRef}
              width={480}
              height={340}
              className="w-full rounded-xl border border-slate-700/50"
            />
          </div>

          <div>
            <p className="text-slate-400 text-sm mb-4 font-medium uppercase tracking-wide">Select the transformation matrix:</p>
            <div className="grid grid-cols-1 gap-3">
              {shuffled.map((opt, idx) => {
                let border = 'border-slate-700 hover:border-slate-500'
                let bg = 'bg-slate-800/60 hover:bg-slate-800'
                if (selected !== null) {
                  const isAnswer = mKey(opt.m) === mKey(q.answer)
                  if (idx === selected) {
                    border = correct ? 'border-green-500' : 'border-red-500'
                    bg = correct ? 'bg-green-500/10' : 'bg-red-500/10'
                  } else if (isAnswer && selected !== null) {
                    border = 'border-green-500/50'
                    bg = 'bg-green-500/5'
                  }
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={selected !== null}
                    className={`w-full text-left p-4 rounded-xl border ${border} ${bg} transition-all duration-200 disabled:cursor-default`}
                  >
                    <div className="text-slate-300 text-sm font-medium mb-2">{opt.label}</div>
                    <MatrixBox m={opt.m} />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // done
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      <div className="text-6xl mb-4">{score === 4 ? '🏆' : score >= 2 ? '🎯' : '📚'}</div>
      <h2 className="text-3xl font-bold text-white mb-2">
        {score === 4 ? 'Perfect Score!' : `${score} / 4 Correct`}
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
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={submitScore}
              className="px-6 py-2 bg-blue-600 rounded-lg text-white font-semibold hover:bg-blue-500 transition-colors"
            >
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
              <span className="text-green-400 font-mono">{e.score}/4</span>
              <span className="text-slate-400 font-mono">{fmt(e.time)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 justify-center mt-6">
        <button
          onClick={startGame}
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 rounded-lg text-white font-semibold hover:bg-slate-600 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Play Again
        </button>
        <Link href="/homogeneous" className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity">
          Next: Homogeneous →
        </Link>
      </div>
    </div>
  )
}
