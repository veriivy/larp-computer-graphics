import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Linear Algebra in Computer Graphics",
  description: "Interactive exploration of matrix transformations and computer graphics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-900 text-white">
        <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <Link href="/" className="font-bold text-base sm:text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap shrink-0">
              LA × CG
            </Link>
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm overflow-x-auto">
              <Link href="/transformations" className="px-2 py-1 text-slate-400 hover:text-white transition-colors whitespace-nowrap rounded hover:bg-slate-800">Transformations</Link>
              <Link href="/homogeneous" className="px-2 py-1 text-slate-400 hover:text-white transition-colors whitespace-nowrap rounded hover:bg-slate-800">Homogeneous</Link>
              <Link href="/composite" className="px-2 py-1 text-slate-400 hover:text-white transition-colors whitespace-nowrap rounded hover:bg-slate-800">Composite</Link>
              <Link href="/perspective" className="px-2 py-1 text-slate-400 hover:text-white transition-colors whitespace-nowrap rounded hover:bg-slate-800">3D Projection</Link>
              <Link href="/about" className="px-2 py-1 text-slate-400 hover:text-white transition-colors whitespace-nowrap rounded hover:bg-slate-800">About</Link>
            </div>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-800 py-6">
          <p className="text-center text-slate-500 text-sm">Linear Algebra Research Project · Interactive Computer Graphics Education</p>
        </footer>
      </body>
    </html>
  );
}
