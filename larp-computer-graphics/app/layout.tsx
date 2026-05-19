import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Linear Algebra in Computer Graphics",
  description: "Interactive exploration of matrix transformations and computer graphics",
};


const NAV_LINKS = [
  { href: "/transformations", label: "Transformations" },
  { href: "/homogeneous", label: "Homogeneous" },
  { href: "/composite", label: "Composite" },
  { href: "/perspective", label: "3D Projection" },
  { href: "/about", label: "About" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0e0c09] text-white">
        {/* ── Navigation ── */}
        <nav className="sticky top-0 z-50 border-b border-amber-900/30 bg-[#0e0c09]/96 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
            {/* Rat silhouette — home button */}
            <Link
              href="/"
              aria-label="Home"
              className="group shrink-0 transition-all duration-300"
            >
              <Image
                src="/rat_sihlouette.png"
                alt="Home"
                width={40}
                height={26}
                className="opacity-65 transition-all duration-300 group-hover:opacity-90 group-hover:scale-105"
              />
            </Link>

            {/* Nav links */}
            <div
              className={`${playfair.className} flex items-center overflow-x-auto`}
            >
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-2.5 py-1.5 text-[11px] tracking-[0.16em] text-amber-200/40 whitespace-nowrap rounded-sm transition-colors duration-200 hover:text-amber-200/85 hover:bg-amber-900/10"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <main className="flex-1">{children}</main>

        {/* ── Footer ── */}
        <footer className="border-t border-amber-900/25 bg-[#0e0c09] py-6">
          <p
            className={`${playfair.className} text-center text-[11px] italic tracking-[0.35em] text-amber-700/38`}
          >
            Linear Algebra Research Project
          </p>
        </footer>
      </body>
    </html>
  );
}
