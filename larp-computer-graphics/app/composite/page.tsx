import { Playfair_Display } from 'next/font/google'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
})

type M3 = [[number, number, number], [number, number, number], [number, number, number]]

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

export default function CompositePage() {
  return (
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

        <div className="border border-amber-900/25 bg-[#131008] p-6 mb-14">
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

        <div className="flex justify-between">
          <Link
            href="/homogeneous"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-amber-900/40 text-amber-200/60 text-sm hover:border-amber-700/50 hover:text-amber-200/80 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Homogeneous
          </Link>
          <Link
            href="/composite/game"
            className="group relative inline-block overflow-hidden border border-amber-200/45 px-6 py-2.5"
          >
            <span className="absolute inset-0 translate-y-full bg-amber-100 transition-transform duration-500 ease-in-out group-hover:translate-y-0" aria-hidden="true" />
            <span className="relative z-10 text-[11px] font-normal uppercase tracking-[0.4em] text-amber-100 transition-all duration-500 group-hover:text-slate-800 inline-flex items-center gap-2">
              Play Game <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>

      </div>
    </div>
  )
}
