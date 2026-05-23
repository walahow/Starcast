'use client';

import { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, UserPlus, ShieldAlert } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({ name, email, password, phone, address });
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative ambient backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-lg relative z-10 animate-fade-in-up">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <h1 className="text-4xl font-bold tracking-widest font-serif text-foreground">
              STARCAST
            </h1>
            <div className="w-2 h-2 bg-primary rounded-full group-hover:scale-150 transition-transform duration-500" />
          </Link>
          <p className="text-muted-foreground text-sm mt-3 uppercase tracking-[0.2em]">
            ◆ JOIN THE ELITE COLLECTORS ◆
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-secondary/40 backdrop-blur-xl border border-border/80 rounded-2xl p-8 md:p-10 shadow-2xl relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

          <h2 className="text-2xl font-bold text-foreground font-serif text-center mb-8">
            Create Collector Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3.5 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="reg-name" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Alexander Wright"
                className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition duration-300"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="reg-email" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="collector@starcast.id"
                  className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition duration-300"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-phone" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Phone Number
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +62812345678"
                  className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition duration-300"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition duration-300 pr-12"
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

            <div className="space-y-1.5">
              <label htmlFor="reg-address" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Shipping Address
              </label>
              <textarea
                id="reg-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                placeholder="Enter your complete home address for shipping fee estimates (e.g. Jl. Thamrin No. 10, Kebon Melati, Jakarta Pusat)"
                className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition duration-300 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-primary text-background font-bold py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:-translate-y-0.5 transition duration-300 disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? "Registering..." : "Create Account"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/40 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-semibold ml-1">
                Login here
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
