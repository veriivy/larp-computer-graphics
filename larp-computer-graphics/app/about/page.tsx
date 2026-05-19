import { Playfair_Display } from 'next/font/google'
import Link from 'next/link'
import { Grid3x3, Layers, Boxes, Sparkles } from 'lucide-react'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
})

const topics = [
  {
    icon: Grid3x3,
    title: 'Basic Transformations',
    numeral: 'I',
    href: '/transformations',
    desc: 'Reflections, rotations, scaling, shears, and projections using 2×2 matrices. Includes an interactive timed game.',
  },
  {
    icon: Layers,
    title: 'Homogeneous Coordinates',
    numeral: 'II',
    href: '/homogeneous',
    desc: 'How lifting 2D points into 3D with a "1" coordinate enables translation via matrix multiplication.',
  },
  {
    icon: Boxes,
    title: 'Composite Transformations',
    numeral: 'III',
    href: '/composite',
    desc: 'Chaining multiple 3×3 homogeneous transformations into a single matrix. Another timed challenge game.',
  },
  {
    icon: Sparkles,
    title: '3D Perspective Projection',
    numeral: 'IV',
    href: '/perspective',
    desc: 'How 3D objects are mapped to 2D screens using similar triangles and the perspective division formula.',
  },
]

export default function AboutPage() {
  return (
    <div className="bg-[#0e0c09] min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto">

        <div className="mb-12 text-center">
          <div className="mb-6 flex items-center justify-center gap-4">
            <span className="h-px w-16 bg-amber-300/30" />
            <span className="text-[10px] font-light uppercase tracking-[0.55em] text-amber-300/50">About</span>
            <span className="h-px w-16 bg-amber-300/30" />
          </div>
          <h1 className={`${playfair.className} text-4xl sm:text-5xl font-bold italic text-amber-50 mb-4`}>
            About This Project
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed text-sm">
            An interactive research project exploring how linear algebra underpins modern computer graphics,
            built for a college linear algebra class.
          </p>
        </div>

        <div className="border border-amber-900/25 bg-[#131008] p-6 mb-10">
          <h2 className={`${playfair.className} text-xl font-semibold text-amber-100 mb-3`}>The Big Picture</h2>
          <p className="text-slate-400 mb-4 leading-relaxed text-sm">
            Every image you see in a 3D game, animated film, or CAD program is generated through a pipeline of matrix multiplications.
            Vertices of a 3D model are transformed, projected, and rasterized — all using the linear algebra concepts explored here.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            The same math that handles a simple reflection in a 2×2 matrix scales up to the 4×4 transformation stacks
            used by GPUs to render millions of triangles per frame.
          </p>
        </div>

        <p className={`${playfair.className} text-[10px] uppercase tracking-[0.6em] text-amber-600/40 mb-6 text-center`}>
          The Curriculum
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {topics.map(t => {
            const Icon = t.icon
            return (
              <Link
                key={t.href}
                href={t.href}
                className="group flex flex-col gap-3 border border-amber-900/25 bg-[#131008] p-6 transition-all duration-300 hover:border-amber-700/40 hover:bg-[#1b1509]"
              >
                <div className="flex items-start justify-between">
                  <span className={`${playfair.className} text-3xl font-light italic text-amber-700/35 transition-colors duration-300 group-hover:text-amber-600/55`}>
                    {t.numeral}
                  </span>
                  <Icon className="mt-1 h-4 w-4 text-amber-700/35 transition-colors duration-300 group-hover:text-amber-600/55" />
                </div>
                <h3 className={`${playfair.className} text-lg font-semibold text-amber-50/85 transition-colors duration-300 group-hover:text-amber-50`}>
                  {t.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500 transition-colors duration-300 group-hover:text-slate-400">
                  {t.desc}
                </p>
              </Link>
            )
          })}
        </div>

        <div className="border border-amber-900/25 bg-[#131008] p-6 mb-8">
          <h2 className={`${playfair.className} text-xl font-semibold text-amber-100 mb-4`}>Key Concepts</h2>
          <ul className="space-y-2 text-slate-400 text-sm">
            {[
              'Linear transformations and their matrix representations',
              'Why translation is not a linear transformation in standard coordinates',
              'Homogeneous coordinates: embedding n-D in (n+1)-D to unify all affine transformations',
              'Non-commutativity of matrix multiplication and its geometric consequence',
              'Perspective projection: the math behind how a camera sees the world',
              'The full 3D rendering pipeline from model space to screen space',
            ].map(item => (
              <li key={item} className="flex gap-2">
                <span className="text-amber-700/50 mt-0.5 shrink-0">·</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-amber-900/25 bg-[#131008] p-6">
          <h2 className={`${playfair.className} text-xl font-semibold text-amber-100 mb-4`}>Technology</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'HTML Canvas API'].map(t => (
              <span key={t} className="px-3 py-1 border border-amber-900/30 text-amber-200/50 text-xs font-mono">
                {t}
              </span>
            ))}
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            All visualizations are rendered with the native HTML Canvas API — no external graphics libraries.
            Game state and leaderboards use localStorage for persistence across sessions.
          </p>
        </div>
      </div>
    </div>
  )
}
