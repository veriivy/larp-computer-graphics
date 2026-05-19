import { Playfair_Display } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Grid3x3, Layers, Boxes, Sparkles, ArrowRight } from "lucide-react";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
});

const sections = [
  {
    title: "Basic Transformations",
    description:
      "Reflections, rotations, scaling, shears, and projections — explored through a timed interactive game",
    href: "/transformations",
    icon: Grid3x3,
    numeral: "I",
  },
  {
    title: "Homogeneous Coordinates",
    description:
      "How a single extra dimension unifies all affine transformations, including translation",
    href: "/homogeneous",
    icon: Layers,
    numeral: "II",
  },
  {
    title: "Composite Transformations",
    description:
      "Chain multiple 3×3 matrices into one and discover why order always matters",
    href: "/composite",
    icon: Boxes,
    numeral: "III",
  },
  {
    title: "3D Perspective Projection",
    description:
      "How cameras flatten a three-dimensional world onto a two-dimensional screen",
    href: "/perspective",
    icon: Sparkles,
    numeral: "IV",
  },
];

export default function Home() {
  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Paris GIF background — place your gif at public/paris.gif */}
        <div className="absolute inset-0">
          <Image
            src="/paris.gif"
            alt=""
            fill
            unoptimized
            priority
            className="object-cover"
            aria-hidden="true"
          />
        </div>

        {/* Vignette + dark overlay */}
        <div className="absolute inset-0 bg-black/55" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        {/* Warm amber warmth at the bottom edge */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#1a0e05]/70 to-transparent" />

        {/* Hero content */}
        <div
          className={`${playfair.className} relative z-10 flex flex-col items-center px-6 text-center`}
        >
          {/* Eyebrow line */}
          <div className="mb-8 flex items-center gap-4">
            <span className="h-px w-12 bg-amber-300/45 sm:w-20" />
            <span className="text-[10px] font-light uppercase tracking-[0.55em] text-amber-300/70">
              Linear Algebra with Remy
            </span>
            <span className="h-px w-12 bg-amber-300/45 sm:w-20" />
          </div>

          {/* Title */}
          <h1 className="text-amber-50 leading-[1.08]">
            {/* <span className="block text-5xl font-bold tracking-tight sm:text-7xl">
              Linear Algebra
            </span>
            <span className="my-3 block text-2xl font-normal italic text-amber-200/65 sm:text-3xl">
              in
            </span> */}
            <span className="block text-5xl font-bold tracking-tight sm:text-7xl italic">
              Computer Graphics
            </span>
          </h1>

          {/* Ornament */}
          <div className="my-9 flex items-center gap-5">
            <span className="h-px w-16 bg-amber-500/35" />
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              className="fill-amber-500/55"
              aria-hidden="true"
            >
              <path d="M12 0l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 15l-6.2 4.3 2.4-7.4L2 7.4h7.6z" />
            </svg>
            <span className="h-px w-16 bg-amber-500/35" />
          </div>

          {/* Begin button — fill-from-bottom + letter-spacing expand */}
          <Link
            href="/transformations"
            className="group relative inline-block overflow-hidden border border-amber-200/45 px-14 py-[14px]"
          >
            {/* Sliding fill */}
            <span
              className="absolute inset-0 translate-y-full bg-amber-100 transition-transform duration-500 ease-in-out group-hover:translate-y-0"
              aria-hidden="true"
            />
            <span className="relative z-10 text-[11px] font-normal uppercase tracking-[0.5em] text-amber-100 transition-all duration-500 group-hover:tracking-[0.7em] group-hover:text-slate-800">
              Begin
            </span>
          </Link>

          {/* About link */}
          <Link
            href="/about"
            className="mt-7 text-[10px] uppercase tracking-[0.45em] text-amber-200/35 transition-colors duration-300 hover:text-amber-200/65"
          >
            About this project
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span
            className={`${playfair.className} text-[9px] uppercase tracking-[0.5em] text-amber-200/28`}
          >
            Explore
          </span>
          <span className="h-8 w-px bg-gradient-to-b from-amber-200/25 to-transparent" />
        </div>
      </section>

      {/* ─── Section cards ────────────────────────────────────────────── */}
      <section className="bg-[#0e0c09] px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p
            className={`${playfair.className} mb-14 text-center text-[10px] uppercase tracking-[0.6em] text-amber-600/40`}
          >
            The Curriculum
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className="group flex flex-col gap-3 border border-amber-900/25 bg-[#131008] p-7 transition-all duration-300 hover:border-amber-700/40 hover:bg-[#1b1509]"
                >
                  {/* Top row: numeral + icon */}
                  <div className="flex items-start justify-between">
                    <span
                      className={`${playfair.className} text-3xl font-light italic text-amber-700/35 transition-colors duration-300 group-hover:text-amber-600/55`}
                    >
                      {section.numeral}
                    </span>
                    <Icon className="mt-1 h-4 w-4 text-amber-700/35 transition-colors duration-300 group-hover:text-amber-600/55" />
                  </div>

                  {/* Title */}
                  <h3
                    className={`${playfair.className} text-lg font-semibold text-amber-50/85 transition-colors duration-300 group-hover:text-amber-50`}
                  >
                    {section.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm leading-relaxed text-slate-500 transition-colors duration-300 group-hover:text-slate-400">
                    {section.description}
                  </p>

                  {/* Explore cta */}
                  <div className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-amber-700/40 transition-colors duration-300 group-hover:text-amber-600/70">
                    <span>Explore</span>
                    <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
