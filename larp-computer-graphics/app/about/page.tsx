import Link from 'next/link'
import { ArrowLeft, Grid3x3, Layers, Boxes, Sparkles } from 'lucide-react'

export default function AboutPage() {
  const topics = [
    {
      icon: Grid3x3,
      title: 'Basic Transformations',
      href: '/transformations',
      gradient: 'from-blue-500 to-cyan-500',
      desc: 'Reflections, rotations, scaling, shears, and projections using 2×2 matrices. Includes an interactive timed game.',
    },
    {
      icon: Layers,
      title: 'Homogeneous Coordinates',
      href: '/homogeneous',
      gradient: 'from-purple-500 to-pink-500',
      desc: 'How lifting 2D points into 3D with a "1" coordinate enables translation via matrix multiplication.',
    },
    {
      icon: Boxes,
      title: 'Composite Transformations',
      href: '/composite',
      gradient: 'from-orange-500 to-red-500',
      desc: 'Chaining multiple 3×3 homogeneous transformations into a single matrix. Another timed challenge game.',
    },
    {
      icon: Sparkles,
      title: '3D Perspective Projection',
      href: '/perspective',
      gradient: 'from-green-500 to-emerald-500',
      desc: 'How 3D objects are mapped to 2D screens using similar triangles and the perspective division formula.',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <h1 className="text-4xl font-bold text-white mb-4">About This Project</h1>
      <p className="text-slate-400 text-lg mb-10">
        An interactive research project exploring how linear algebra underpins modern computer graphics,
        built for a college linear algebra class.
      </p>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mb-10">
        <h2 className="text-xl font-bold text-white mb-3">The Big Picture</h2>
        <p className="text-slate-400 mb-4">
          Every image you see in a 3D game, animated film, or CAD program is generated through a pipeline of matrix multiplications.
          Vertices of a 3D model are transformed, projected, and rasterized — all using the linear algebra concepts explored here.
        </p>
        <p className="text-slate-400">
          The same math that handles a simple reflection in a 2×2 matrix scales up to the 4×4 transformation stacks
          used by GPUs to render millions of triangles per frame.
        </p>
      </div>

      <h2 className="text-2xl font-bold text-white mb-5">What&apos;s Inside</h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {topics.map(t => {
          const Icon = t.icon
          return (
            <Link
              key={t.href}
              href={t.href}
              className="group bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-white mb-1.5">{t.title}</h3>
              <p className="text-slate-400 text-sm">{t.desc}</p>
            </Link>
          )
        })}
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mb-10">
        <h2 className="text-xl font-bold text-white mb-3">Key Concepts Covered</h2>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li className="flex gap-2"><span className="text-blue-400 mt-0.5">•</span>Linear transformations and their matrix representations</li>
          <li className="flex gap-2"><span className="text-blue-400 mt-0.5">•</span>Why translation is not a linear transformation in standard coordinates</li>
          <li className="flex gap-2"><span className="text-blue-400 mt-0.5">•</span>Homogeneous coordinates: embedding n-D in (n+1)-D to unify all affine transformations</li>
          <li className="flex gap-2"><span className="text-blue-400 mt-0.5">•</span>Non-commutativity of matrix multiplication and its geometric consequence</li>
          <li className="flex gap-2"><span className="text-blue-400 mt-0.5">•</span>Perspective projection: the math behind how a camera sees the world</li>
          <li className="flex gap-2"><span className="text-blue-400 mt-0.5">•</span>The full 3D rendering pipeline from model space to screen space</li>
        </ul>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-3">Technology</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          {['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'HTML Canvas API'].map(t => (
            <span key={t} className="px-3 py-1 bg-slate-700 rounded-full text-slate-300">{t}</span>
          ))}
        </div>
        <p className="text-slate-400 text-sm mt-4">
          All visualizations are rendered with the native HTML Canvas API — no external graphics libraries.
          Game state and leaderboards use localStorage for persistence across sessions.
        </p>
      </div>
    </div>
  )
}
