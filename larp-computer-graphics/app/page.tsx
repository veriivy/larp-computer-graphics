import Link from "next/link";
import { ArrowRight, Boxes, Grid3x3, Layers, Sparkles } from "lucide-react";

export default function Home() {
  const sections = [
    {
      title: "Basic Transformations",
      description: "Explore reflections, rotations, scaling, shears, and projections through an interactive game",
      href: "/transformations",
      icon: Grid3x3,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Homogeneous Coordinates",
      description: "Learn how translations work in 2D with 3x3 matrices and homogeneous coordinates",
      href: "/homogeneous",
      icon: Layers,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      title: "Composite Transformations",
      description: "Master combining multiple transformations into single matrices with timed challenges",
      href: "/composite",
      icon: Boxes,
      gradient: "from-orange-500 to-red-500"
    },
    {
      title: "3D Perspective Projection",
      description: "Visualize how 3D objects are projected onto 2D screens in computer graphics",
      href: "/perspective",
      icon: Sparkles,
      gradient: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
              Linear Algebra in
              <br />
              Computer Graphics
            </h1>
            <p className="text-xl sm:text-2xl text-slate-300 max-w-3xl mx-auto mb-12">
              An interactive exploration of how matrix transformations power modern graphics rendering
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/transformations"
                className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Start Learning
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/about"
                className="px-8 py-4 bg-slate-800 border border-slate-700 rounded-lg text-white font-semibold hover:bg-slate-700 transition-all duration-300"
              >
                About This Project
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 gap-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/50"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
                <div className="relative">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${section.gradient} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {section.title}
                  </h3>
                  <p className="text-slate-400 mb-4">
                    {section.description}
                  </p>
                  <div className="flex items-center text-sm font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Explore Interactive Demo
                    <ArrowRight className="w-4 h-4 ml-2 text-blue-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-slate-400">
          <p>Linear Algebra Research Project • Interactive Computer Graphics Education</p>
        </div>
      </div>
    </div>
  );
}