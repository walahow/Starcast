'use client';

import { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn, ShieldAlert } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      // Determine destination based on email or role
      if (email.toLowerCase().includes("admin")) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative ambient backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Logo/Branding */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <h1 className="text-4xl font-bold tracking-widest font-serif text-foreground">
              STARCAST
            </h1>
            <div className="w-2 h-2 bg-primary rounded-full group-hover:scale-150 transition-transform duration-500" />
          </Link>
          <p className="text-muted-foreground text-sm mt-3 uppercase tracking-[0.2em]">
            ◆ AUTHENTIC COLLECTIBLES PORTAL ◆
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-secondary/40 backdrop-blur-xl border border-border/80 rounded-2xl p-8 md:p-10 shadow-2xl relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

          <h2 className="text-2xl font-bold text-foreground font-serif text-center mb-8">
            Access Your Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3.5 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="collector@starcast.id"
                className="w-full px-4 py-3.5 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition duration-300"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition duration-300 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition duration-300"
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-primary text-background font-bold py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:-translate-y-0.5 transition duration-300 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Verifying..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/40 text-center">
            <p className="text-sm text-muted-foreground">
              New to the showroom?{" "}
              <Link href="/register" className="text-primary hover:underline font-semibold ml-1">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-muted-foreground hover:text-primary transition duration-300">
            ← Return to Showroom
          </Link>
        </div>
      </div>
    </div>
  );
}
