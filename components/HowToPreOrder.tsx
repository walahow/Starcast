'use client';

import { PRODUCTS } from '@/lib/products';

const steps = [
  {
    number: '01',
    label: 'First',
    title: 'Discover',
    description: 'Browse the curated atelier. Study every piece — slots, deadlines, finishes — and find the obsession worth waiting for.',
    timing: 'Take your time',
    mark: '◆',
    image: PRODUCTS[0]?.image,
  },
  {
    number: '02',
    label: 'Then',
    title: 'Reserve',
    description: 'Tap pre-order, complete the brief checkout, and your slot is locked into the current edition. No deposit games.',
    timing: 'Under 60 seconds',
    mark: '✦',
    image: PRODUCTS[3]?.image,
  },
  {
    number: '03',
    label: 'Finally',
    title: 'Receive',
    description: 'We coordinate manufacturer production, packaging, and tracked shipping. You unbox the piece at home.',
    timing: 'Q2 – Q3 delivery',
    mark: '◊',
    image: PRODUCTS[6]?.image,
  },
];

export default function HowToPreOrder() {
  return (
    <section id="how-to" className="relative py-24 md:py-36 bg-background overflow-hidden">
      {/* ── Background ── */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[15%] -left-[10%] w-[45vw] h-[45vw] bg-primary/[0.04] rounded-full blur-[150px]" />
        <div className="absolute bottom-[10%] -right-[10%] w-[40vw] h-[40vw] bg-primary/[0.05] rounded-full blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* ── Section Header ── */}
        <div className="max-w-3xl mb-20 md:mb-32" data-scroll>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-px bg-primary" />
            <span className="text-[10px] font-bold tracking-[0.35em] uppercase text-primary">The Process</span>
          </div>
          <h2
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground leading-[0.92] tracking-[-0.035em]"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            <span className="block">Three steps to</span>
            <span className="block italic text-primary">obsession.</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mt-8 max-w-xl leading-relaxed">
            From discovery to doorstep — a deliberately simple process built for collectors who already know what they want.
          </p>
        </div>

        {/* ── Steps ── */}
        <div className="relative space-y-24 md:space-y-40">
          {/* Vertical thread connecting the steps */}
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-16 bottom-16 w-px overflow-hidden pointer-events-none">
            <div className="thread-dash w-px h-full" />
          </div>

          {steps.map((step, i) => {
            const isOdd = i % 2 === 1;
            return (
              <article
                key={i}
                className="relative grid md:grid-cols-12 gap-8 md:gap-12 items-center"
                data-scroll
              >
                {/* ── Number side ── */}
                <div
                  className={`relative md:col-span-7 ${
                    isOdd ? 'md:order-2 md:justify-self-end md:text-right' : 'md:order-1 md:justify-self-start'
                  }`}
                >
                  {/* Small product image floating near the number */}
                  {step.image && (
                    <div
                      className={`hidden md:block absolute z-20 w-[12vw] h-[12vw] max-w-[170px] max-h-[170px] rounded-2xl overflow-hidden border border-border shadow-2xl transition-transform duration-700 hover:scale-105 group/img ${
                        isOdd
                          ? 'top-[10%] left-[5%] -rotate-[8deg] hover:rotate-0'
                          : 'top-[10%] right-[5%] rotate-[8deg] hover:rotate-0'
                      }`}
                    >
                      <div className="absolute inset-0 bg-primary/0 group-hover/img:bg-primary/20 transition-colors duration-500 z-10" />
                      <img src={step.image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* The giant outlined number */}
                  <div
                    className="number-outline relative leading-[0.8] tracking-[-0.05em] font-bold select-none"
                    style={{
                      fontSize: 'clamp(9rem, 24vw, 22rem)',
                      fontFamily: 'Playfair Display, serif',
                    }}
                  >
                    {step.number}
                  </div>
                </div>

                {/* ── Content side ── */}
                <div
                  className={`relative md:col-span-5 ${
                    isOdd ? 'md:order-1 md:text-left' : 'md:order-2 md:text-left'
                  }`}
                >
                  <div className="max-w-md">
                    {/* Step marker */}
                    <div className="flex items-center gap-3 mb-5">
                      <span className="text-primary text-base">{step.mark}</span>
                      <span className="text-[10px] font-bold tracking-[0.35em] uppercase text-primary">
                        {step.label}
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-primary/40 to-transparent" />
                    </div>

                    {/* Title */}
                    <h3
                      className="text-5xl md:text-6xl font-bold text-foreground leading-[0.95] tracking-[-0.025em] mb-5"
                      style={{ fontFamily: 'Playfair Display, serif' }}
                    >
                      {step.title}.
                    </h3>

                    {/* Description */}
                    <p className="text-base text-muted-foreground leading-relaxed mb-6">
                      {step.description}
                    </p>

                    {/* Timing badge */}
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-secondary border border-border">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-foreground">
                        {step.timing}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* ── CTA Card ── */}
        <div className="mt-24 md:mt-40 relative" data-scroll>
          <div className="relative overflow-hidden bg-foreground rounded-3xl px-8 py-16 md:px-16 md:py-24">
            {/* Background ambient */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
              <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
            </div>

            {/* Decorative corner marks */}
            <span className="absolute top-6 left-6 text-primary text-xs">+</span>
            <span className="absolute top-6 right-6 text-primary text-xs">+</span>
            <span className="absolute bottom-6 left-6 text-primary text-xs">+</span>
            <span className="absolute bottom-6 right-6 text-primary text-xs">+</span>

            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-10 h-px bg-primary" />
                <span className="text-[10px] font-bold tracking-[0.35em] uppercase text-primary">Begin</span>
                <div className="w-10 h-px bg-primary" />
              </div>

              <h3
                className="text-5xl md:text-7xl font-bold text-background leading-[0.95] tracking-[-0.025em] mb-6"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Your obsession
                <br />
                <span className="italic text-primary">awaits.</span>
              </h3>

              <p className="text-background/65 mb-10 text-base md:text-lg max-w-md mx-auto leading-relaxed">
                Step into the atelier and reserve your slot from the current edition. Limited pieces. Serious collectors only.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
                <a
                  href="#showcase"
                  className="group relative px-9 py-4 bg-background text-foreground text-[10px] font-bold uppercase tracking-[0.25em] rounded-full overflow-hidden hover:shadow-2xl active:scale-95 transition-all duration-500"
                >
                  <span className="relative z-10 transition-colors duration-500 group-hover:text-foreground">
                    Browse the Collection
                  </span>
                  <span className="absolute inset-0 bg-primary scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out" />
                </a>
                <a
                  href="https://www.instagram.com/starcast.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-background hover:text-primary pb-1 border-b border-background hover:border-primary transition-all duration-300"
                >
                  Follow @starcast.id
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Outlined editorial number — gold stroke, transparent fill */
        .number-outline {
          -webkit-text-stroke: 2px var(--primary);
          color: transparent;
          transition: color 0.5s ease, -webkit-text-stroke-width 0.5s ease;
        }
        article:hover .number-outline {
          color: var(--primary);
          opacity: 0.95;
        }

        /* Vertical dashed gold thread */
        .thread-dash {
          background-image: linear-gradient(
            to bottom,
            var(--primary) 0,
            var(--primary) 6px,
            transparent 6px,
            transparent 14px
          );
          background-size: 1px 14px;
          background-repeat: repeat-y;
          opacity: 0.35;
        }

        @media (prefers-reduced-motion: reduce) {
          .number-outline { transition: none; }
        }
      `}</style>
    </section>
  );
}
