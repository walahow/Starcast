'use client';

import { PRODUCTS } from '@/lib/products';
import { useEffect, useRef, useState } from 'react';
import ProductModal from './ProductModal';

export default function Hero() {
  const [modalProduct, setModalProduct] = useState<typeof PRODUCTS[number] | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const stats = {
    total: PRODUCTS.length,
    openPo: PRODUCTS.filter(p => p.status === 'Open PO').length,
    readyStock: PRODUCTS.filter(p => p.status === 'Ready Stock').length,
  };

  const ticker = '◆  STARCAST ATELIER  ◆  1:64 SCALE  ◆  PREMIUM DIECAST  ◆  LIMITED SLOTS  ◆  COLLECTORS EDITION  ◆  EST. MMXXVI  ';

  // Subtle mouse-tracked parallax on the floating cars
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const { innerWidth: w, innerHeight: h } = window;
      const x = (e.clientX / w - 0.5) * 2; // -1..1
      const y = (e.clientY / h - 0.5) * 2;
      el.style.setProperty('--mx', String(x));
      el.style.setProperty('--my', String(y));
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Pick three visually distinct products to float around the headline
  const floaters = [PRODUCTS[0], PRODUCTS[4] ?? PRODUCTS[1], PRODUCTS[3] ?? PRODUCTS[2]];

  return (
    <>
      <section ref={heroRef} className="relative min-h-screen bg-background overflow-hidden flex flex-col">
        {/* ── Background layers ── */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          {/* Gold ambient washes */}
          <div className="absolute top-[20%] left-[10%] w-[55vw] h-[55vw] bg-primary/[0.05] rounded-full blur-[140px]" />
          <div className="absolute bottom-[10%] right-[5%] w-[40vw] h-[40vw] bg-primary/[0.04] rounded-full blur-[140px]" />
          {/* Editorial grid lines */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
              backgroundSize: '72px 72px',
            }}
          />
          {/* Edge vignette to focus the eye */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_white_100%)]" />
        </div>

        {/* ── Top editorial meta bar ── */}
        <div className="relative px-6 lg:px-12 pt-24 pb-2">
          <div className="max-w-[1600px] mx-auto flex justify-between items-center text-[10px] uppercase">
            <div className="flex items-center gap-2.5 reveal" style={{ animationDelay: '0.1s' }}>
              <span className="text-primary text-xs">◆</span>
              <span className="font-bold tracking-[0.25em] text-foreground">Starcast Atelier</span>
              <span className="text-border hidden sm:inline">/</span>
              <span className="text-muted-foreground tracking-[0.2em] hidden sm:inline">Est. MMXXVI</span>
            </div>
            <div className="flex items-center gap-4 reveal" style={{ animationDelay: '0.15s' }}>
              <span className="text-muted-foreground tracking-[0.25em] hidden md:inline">Vol. 01</span>
              <span className="text-border hidden md:inline">/</span>
              <span className="text-foreground font-bold tracking-[0.25em]">№ {String(stats.total).padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        {/* ── Hero typography (centerpiece) ── */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-12 py-6 relative">
          <div className="max-w-[1600px] w-full mx-auto text-center relative">

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-4 mb-8 reveal" style={{ animationDelay: '0.3s' }}>
              <div className="w-10 h-px bg-primary" />
              <span className="text-[10px] font-bold tracking-[0.35em] uppercase text-primary">For Serious Collectors</span>
              <div className="w-10 h-px bg-primary" />
            </div>

            {/* The Statement — masked line-by-line reveal */}
            <h1
              className="font-bold text-foreground leading-[0.88] tracking-[-0.035em]"
              style={{
                fontSize: 'clamp(3.5rem, 13.5vw, 13rem)',
                fontFamily: 'Playfair Display, serif',
              }}
            >
              <span className="reveal-mask block">
                <span className="reveal-up block" style={{ animationDelay: '0.4s' }}>Driven by</span>
              </span>
              <span className="reveal-mask block -mt-[0.05em]">
                <span className="reveal-up block italic text-primary" style={{ animationDelay: '0.55s' }}>
                  Obsession.
                </span>
              </span>
            </h1>

            {/* Manifesto */}
            <p className="max-w-md mx-auto mt-10 text-sm md:text-base text-muted-foreground leading-relaxed reveal" style={{ animationDelay: '0.85s' }}>
              A curated atelier of 1:64 scale diecast obsessions. Limited slots, manufacturer pre-orders, serious collectors only.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-10 reveal" style={{ animationDelay: '0.95s' }}>
              <a
                href="#showcase"
                className="group relative px-9 py-4 bg-foreground text-background text-[10px] font-bold uppercase tracking-[0.25em] rounded-full overflow-hidden hover:shadow-2xl active:scale-95 transition-all duration-500"
              >
                <span className="relative z-10 transition-colors duration-500 group-hover:text-foreground">Explore Collection</span>
                <span className="absolute inset-0 bg-primary scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out" />
              </a>
              <a
                href="#how-to"
                className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-foreground hover:text-primary pb-1 border-b border-foreground hover:border-primary transition-all duration-300"
              >
                How to Pre-Order
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
            </div>

            {/* ── Floating product punctuation (desktop only) ── */}
            <FloatingCard
              product={floaters[0]}
              className="-top-[2%] -left-[2%] w-[10vw] h-[10vw] max-w-[140px] max-h-[140px]"
              rotate={-12}
              parallax={[20, 25]}
              delay="1.1s"
              onClick={() => setModalProduct(floaters[0])}
            />
            <FloatingCard
              product={floaters[1]}
              className="top-[8%] -right-[3%] w-[11vw] h-[11vw] max-w-[160px] max-h-[160px]"
              rotate={9}
              parallax={[-18, -15]}
              delay="1.25s"
              onClick={() => setModalProduct(floaters[1])}
            />
            <FloatingCard
              product={floaters[2]}
              className="-bottom-[4%] left-[8%] w-[9vw] h-[9vw] max-w-[120px] max-h-[120px]"
              rotate={-7}
              parallax={[15, -20]}
              delay="1.4s"
              onClick={() => setModalProduct(floaters[2])}
            />
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="px-6 lg:px-12 reveal" style={{ animationDelay: '1s' }}>
          <div className="max-w-[1600px] mx-auto py-5 border-t border-border grid grid-cols-3 gap-4 lg:gap-12">
            <Stat label="Curated Pieces" value={stats.total} />
            <Stat label="Open Pre-Orders" value={stats.openPo} highlight />
            <Stat label="Ready Stock" value={stats.readyStock} />
          </div>
        </div>

        {/* ── Marquee ── */}
        <div className="border-t border-border overflow-hidden py-3.5 bg-background/80 backdrop-blur-sm">
          <div className="marquee-track flex whitespace-nowrap">
            {[...Array(4)].map((_, i) => (
              <span key={i} className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em] px-8 flex-shrink-0">
                {ticker}
              </span>
            ))}
          </div>
        </div>

        {/* ── Scroll indicator ── */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-2 reveal" style={{ animationDelay: '1.4s' }}>
          <span className="text-[9px] text-muted-foreground uppercase tracking-[0.3em]">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-primary to-transparent animate-pulse-slow" />
        </div>
      </section>

      {modalProduct && (
        <ProductModal product={modalProduct} onClose={() => setModalProduct(null)} />
      )}

      <style jsx>{`
        /* Line-mask reveal — translates content up from a clipped frame */
        .reveal-mask { overflow: hidden; }
        .reveal-up {
          transform: translateY(110%);
          animation: reveal-up 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes reveal-up { to { transform: translateY(0); } }

        /* Simple fade for non-text elements */
        .reveal {
          opacity: 0;
          transform: translateY(14px);
          animation: reveal 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes reveal { to { opacity: 1; transform: translateY(0); } }

        /* Marquee */
        .marquee-track { animation: marquee 32s linear infinite; }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        /* Scroll indicator pulse */
        .animate-pulse-slow { animation: pulse-line 2.4s ease-in-out infinite; }
        @keyframes pulse-line {
          0%, 100% { opacity: 0.3; transform: scaleY(0.6); transform-origin: top; }
          50% { opacity: 1; transform: scaleY(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .marquee-track, .animate-pulse-slow, .reveal-up, .reveal { animation: none !important; transform: none !important; opacity: 1 !important; }
        }
      `}</style>
    </>
  );
}

/* ── Floating card: gentle bob + cursor parallax + tilt-on-hover ── */
function FloatingCard({
  product,
  className,
  rotate,
  parallax,
  delay,
  onClick,
}: {
  product: typeof PRODUCTS[number];
  className: string;
  rotate: number;
  parallax: [number, number]; // px range for [x, y]
  delay: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`hidden lg:block absolute z-10 cursor-pointer group/float ${className}`}
      style={{
        animation: `floater-in 1.1s cubic-bezier(0.22, 1, 0.36, 1) both`,
        animationDelay: delay,
        transform: `translate(calc(var(--mx, 0) * ${parallax[0]}px), calc(var(--my, 0) * ${parallax[1]}px))`,
        transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
      aria-label={`View ${product.name}`}
    >
      <div className="relative w-full h-full animate-float">
        <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full opacity-0 group-hover/float:opacity-100 transition-opacity duration-500" />
        <div
          className="relative w-full h-full overflow-hidden rounded-2xl shadow-2xl border border-border bg-secondary transition-all duration-500 group-hover/float:rotate-0 group-hover/float:scale-105"
          style={{ transform: `rotate(${rotate}deg)` }}
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover/float:scale-110"
          />
        </div>
        {/* Label on hover */}
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/float:opacity-100 transition-opacity duration-500 whitespace-nowrap">
          <span className="text-[9px] font-bold text-foreground uppercase tracking-[0.2em] bg-white/90 backdrop-blur px-2.5 py-1 rounded-full shadow">
            {product.brand}
          </span>
        </div>
      </div>
      <style jsx>{`
        @keyframes floater-in {
          from { opacity: 0; transform: translateY(30px) scale(0.85); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-float { animation: float 5.5s ease-in-out infinite; }
      `}</style>
    </button>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="text-center group/stat cursor-default">
      <p className={`text-3xl lg:text-5xl font-bold transition-transform duration-300 group-hover/stat:scale-110 ${highlight ? 'text-primary' : 'text-foreground'}`}
         style={{ fontFamily: 'Playfair Display, serif' }}>
        {String(value).padStart(2, '0')}
      </p>
      <p className="text-[9px] text-muted-foreground uppercase tracking-[0.25em] mt-2">{label}</p>
    </div>
  );
}
