'use client';

import { Product } from '@/lib/products';
import { useState, useEffect } from 'react';

interface ProductCardProps {
  product: Product;
  onCheckout?: () => void;
}

function useCountdown(deadline: string) {
  const [remaining, setRemaining] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!deadline) return;
    const target = new Date(deadline + 'T23:59:59').getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setExpired(true); setRemaining(null); return; }
      setRemaining({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return { remaining, expired };
}

export default function ProductCard({ product, onCheckout }: ProductCardProps) {
  const { remaining, expired } = useCountdown(product.po_deadline);

  const isSoldOut =
    product.status === 'Sold Out' ||
    (product.slots_total > 0 && product.slots_filled >= product.slots_total);
  const effectiveStatus = isSoldOut ? 'Sold Out' : product.status;
  const isDisabled = effectiveStatus === 'Sold Out' || effectiveStatus === 'Coming Soon';
  const fillPercent =
    product.slots_total > 0 ? Math.min((product.slots_filled / product.slots_total) * 100, 100) : 0;

  const statusConfig = {
    'Open PO': 'bg-primary text-foreground',
    'Ready Stock': 'bg-blue-500 text-white',
    'Coming Soon': 'bg-amber-500 text-white',
    'Sold Out': 'bg-red-500 text-white',
  };

  const ctaLabel = isDisabled
    ? effectiveStatus
    : effectiveStatus === 'Ready Stock'
    ? '🛒 Buy Now'
    : '📦 Pre-Order';

  return (
    <div className="group flex flex-col h-full bg-secondary/40 backdrop-blur border border-border/80 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-primary hover:-translate-y-1 transition-all duration-500 ease-out transform">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-secondary group/image">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover/image:scale-[1.05] transition-transform duration-700 ease-out"
        />
        <div className="absolute top-4 right-4 z-10">
          <span className={`inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all duration-500 group-hover/image:scale-105 ${statusConfig[effectiveStatus]}`}>
            {effectiveStatus}
          </span>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/25 transition-all duration-700 ease-out" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-all duration-700 ease-out">
          <div className="text-center transform scale-95 group-hover/image:scale-100 transition-transform duration-700 ease-out">
            <div className="text-white font-bold text-lg">View Details</div>
            <div className="text-white/70 text-xs mt-1">Click to explore</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col gap-3">
        <div className="space-y-1">
          <p className="text-xs font-bold text-primary uppercase tracking-[0.15em]">{product.brand}</p>
          <h3 className={`text-base leading-snug font-semibold ${isSoldOut ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {product.name}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold">{product.scale}</span>
          <span>·</span>
          <span className="bg-secondary px-2.5 py-0.5 rounded-full text-primary">ETA: {product.eta}</span>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-2xl font-bold text-primary">
            {product.price.split('-')[0].trim()}
            {product.price.includes('-') && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                – {product.price.split('-')[1].trim()}
              </span>
            )}
          </p>
        </div>

        {product.note && (
          <p className="text-xs text-muted-foreground italic leading-relaxed">✦ {product.note}</p>
        )}

        {product.slots_total > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-semibold uppercase">Available</span>
              <span className="text-xs font-bold text-foreground">
                {product.slots_total - product.slots_filled}/{product.slots_total}
              </span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${fillPercent || 0.5}%` }}
              />
            </div>
          </div>
        )}

        {product.status === 'Open PO' && product.po_deadline && (
          <div className="text-xs">
            {expired ? (
              <span className="text-red-600 font-bold uppercase">PO Closed</span>
            ) : remaining ? (
              <span className="text-muted-foreground">
                ⏳ <span className="font-semibold">{remaining.d}d {remaining.h}h {remaining.m}m</span> remaining
              </span>
            ) : null}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-auto pt-1 flex flex-col gap-2">
          {/*
            Checkout button — stops propagation so the card wrapper click
            (which opens the detail modal) does NOT also fire.
          */}
          <button
            onClick={e => { e.stopPropagation(); if (!isDisabled) onCheckout?.(); }}
            disabled={isDisabled}
            className={`w-full py-3 px-4 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-500 ${
              isDisabled
                ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                : 'bg-foreground text-background hover:bg-primary hover:text-foreground hover:shadow-lg hover:-translate-y-0.5 active:scale-95'
            }`}
          >
            {ctaLabel}
          </button>

          {/*
            View details — no onClick; lets the click bubble up to the
            card wrapper div in Showcase, which opens the detail modal.
          */}
          {!isDisabled && (
            <button className="w-full py-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest rounded-lg border border-border hover:border-foreground hover:text-foreground transition-all duration-300">
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
