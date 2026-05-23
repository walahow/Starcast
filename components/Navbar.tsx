'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useCart } from '@/lib/context/CartContext';
import { ShoppingCart, User, LogOut, Package, Shield } from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { count } = useCart();

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
          <div className="hidden md:flex items-center gap-8">
            <a
              href="/#showcase"
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors relative group"
            >
              Collection
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </a>
            <a
              href="/#how-to"
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors relative group"
            >
              How It Works
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </a>

            {/* Cart Icon */}
            <Link
              href="/checkout"
              className="relative p-2.5 text-foreground hover:text-primary transition-all rounded-xl hover:bg-secondary/40 flex items-center justify-center"
            >
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-background text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center border border-background">
                  {count}
                </span>
              )}
            </Link>

            {/* Auth Area */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border border-border/80 rounded-xl hover:border-primary/40 hover:bg-secondary/80 transition-all duration-300 cursor-pointer">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold max-w-[120px] truncate">{user?.name}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="px-4 py-2 border-b border-border/50">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Collector Profile</p>
                    <p className="text-xs font-semibold text-foreground truncate mt-0.5">{user?.name}</p>
                  </div>
                  <Link href="/orders" className="flex items-center gap-2 px-4 py-2 text-xs font-semibold hover:bg-secondary/60 hover:text-primary transition-colors">
                    <Package className="w-4 h-4 text-primary/80" /> My Orders
                  </Link>
                  {user?.role === 'admin' && (
                    <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-xs font-semibold hover:bg-secondary/60 hover:text-primary transition-colors">
                      <Shield className="w-4 h-4 text-primary/80" /> Admin Panel
                    </Link>
                  )}
                  <button onClick={() => logout()} className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors border-t border-border/50 mt-1.5 text-left cursor-pointer">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-6 py-2.5 bg-foreground text-background text-sm font-bold uppercase tracking-widest rounded-lg hover:shadow-lg hover:bg-foreground/90 hover:-translate-y-0.5 transition-all duration-300"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Actions (Cart + Menu Button) */}
          <div className="flex items-center gap-4 md:hidden">
            <Link
              href="/checkout"
              className="relative p-2 text-foreground hover:text-primary transition-all rounded-xl animate-pulse"
            >
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-background text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-foreground hover:text-primary transition"
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
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-6 space-y-2 border-t border-border/40 pt-6 animate-fade-in-up">
            <a
              href="/#showcase"
              className="block px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Collection
            </a>
            <a
              href="/#how-to"
              className="block px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </a>
            
            {isAuthenticated ? (
              <div className="pt-4 border-t border-border/40 space-y-2">
                <div className="px-4 py-2 bg-secondary/30 rounded-lg">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Collector Profile</p>
                  <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                </div>
                <Link
                  href="/orders"
                  className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Package className="w-4 h-4 text-primary" /> My Orders
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield className="w-4 h-4 text-primary" /> Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => { logout(); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition rounded-lg text-left"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="block px-4 py-3 bg-primary text-background text-sm font-bold uppercase rounded-lg text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
