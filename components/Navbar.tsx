'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="text-2xl font-bold text-foreground tracking-tighter">
              STARCAST
            </div>
            <div className="w-1.5 h-1.5 bg-primary rounded-full group-hover:scale-150 transition-transform" />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-12">
            <a
              href="#showcase"
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors relative group"
            >
              Collection
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </a>
            <a
              href="#how-to"
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors relative group"
            >
              How It Works
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </a>
            <Link
              href="/admin"
              className="px-6 py-2.5 bg-foreground text-background text-sm font-bold uppercase tracking-widest rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              Admin
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-foreground hover:text-primary transition"
          >
            {isMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-6 space-y-2 border-t border-border/40 pt-6">
            <a
              href="#showcase"
              className="block px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Collection
            </a>
            <a
              href="#how-to"
              className="block px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </a>
            <Link
              href="/admin"
              className="block px-4 py-3 bg-foreground text-background text-sm font-bold uppercase rounded-lg text-center"
              onClick={() => setIsMenuOpen(false)}
            >
              Admin
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
