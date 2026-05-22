'use client';

import { Product } from '@/lib/products';
import { useState, useEffect } from 'react';
import CheckoutDrawer from './CheckoutDrawer';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

function useScrollLock() {
  useEffect(() => {
    const n = Number(document.body.dataset.scrollLocks || 0) + 1;
    document.body.dataset.scrollLocks = String(n);
    document.body.style.overflow = 'hidden';
    return () => {
      const m = Number(document.body.dataset.scrollLocks || 1) - 1;
      document.body.dataset.scrollLocks = String(m);
      if (m <= 0) document.body.style.overflow = '';
    };
  }, []);
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  useScrollLock();

  if (!product) return null;

  const folderMatch = product.image.match(/\/images\/(\d+)\//);
  const folderId = folderMatch ? folderMatch[1] : '1';
  const gallery = [
    `/images/${folderId}/product.jpg`,
    `/images/${folderId}/product_2.jpg`,
    `/images/${folderId}/product_3.jpg`,
    `/images/${folderId}/product_4.jpg`,
    `/images/${folderId}/product_5.jpg`,
  ];

  const handlePrevImage = () => {
    setIsAnimating(true);
    setCurrentImageIndex(prev => (prev === 0 ? gallery.length - 1 : prev - 1));
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleNextImage = () => {
    setIsAnimating(true);
    setCurrentImageIndex(prev => (prev === gallery.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsAnimating(false), 300);
  };

  const isSoldOut =
    product.status === 'Sold Out' ||
    (product.slots_total > 0 && product.slots_filled >= product.slots_total);
  const isDisabled = product.status === 'Sold Out' || product.status === 'Coming Soon';

  const statusConfig = {
    'Open PO': 'bg-primary text-foreground',
    'Ready Stock': 'bg-blue-500 text-white',
    'Coming Soon': 'bg-amber-500 text-white',
    'Sold Out': 'bg-red-500 text-white',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal — centered, tightly fitted */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative bg-white rounded-2xl w-full shadow-2xl animate-slide-up overflow-hidden flex flex-col lg:flex-row"
          style={{
            maxWidth: 'min(92vw, 920px)',
            maxHeight: 'min(90vh, 700px)',
            height: 'min(90vh, 700px)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Left: Image gallery ── */}
          <div className="w-full lg:w-[46%] lg:flex-shrink-0 flex flex-col lg:flex-row h-[44%] lg:h-full overflow-hidden">

            {/*
              Thumbnail strip
              Mobile:  order-2 → sits below the main image, horizontal scroll
              Desktop: order-1 → sits LEFT of the main image, vertical stack
            */}
            <div className="order-2 lg:order-1 flex lg:flex-col gap-2 p-2.5 bg-white border-t lg:border-t-0 lg:border-r border-border overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto flex-shrink-0 lg:w-[72px]">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`flex-shrink-0 w-11 h-11 lg:w-full lg:aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    idx === currentImageIndex
                      ? 'border-primary shadow-md'
                      : 'border-transparent opacity-60 hover:opacity-100 hover:border-primary/40'
                  }`}
                >
                  <img
                    src={img}
                    alt={`View ${idx + 1}`}
                    className="w-full h-full object-contain p-0.5"
                    onError={e => { e.currentTarget.src = '/images/placeholder.jpg'; }}
                  />
                </button>
              ))}
            </div>

            {/* Main image — order-1 on mobile (top), order-2 on desktop (right of strip) */}
            <div className="order-1 lg:order-2 relative flex-1 overflow-hidden group bg-secondary min-h-0">
              {/* Padded image box — object-contain fits any aspect ratio */}
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <img
                  src={gallery[currentImageIndex]}
                  alt={product.name}
                  className={`max-w-full max-h-full object-contain transition-all duration-500 ${
                    isAnimating ? 'opacity-0 scale-[0.97]' : 'opacity-100 scale-100'
                  }`}
                  onError={e => { e.currentTarget.src = '/images/placeholder.jpg'; }}
                />
              </div>

              {/* Arrows — always visible on mobile, hover-only on desktop */}
              <button
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/85 hover:bg-primary hover:text-foreground text-foreground rounded-full flex items-center justify-center lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 backdrop-blur shadow"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/85 hover:bg-primary hover:text-foreground text-foreground rounded-full flex items-center justify-center lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 backdrop-blur shadow"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Counter pill */}
              <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur text-white px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide">
                {currentImageIndex + 1} / {gallery.length}
              </div>
            </div>
          </div>

          {/* ── Right: Product details ── */}
          <div className="flex-1 flex flex-col overflow-y-auto p-5 lg:border-l border-t lg:border-t-0 border-border min-h-0">

            {/* Brand + name + badge */}
            <div className="mb-3 pr-8">
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] mb-1">{product.brand}</p>
              <h2 className="text-base font-bold text-foreground leading-snug line-clamp-2 mb-2">
                {product.name}
              </h2>
              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig[product.status]}`}>
                {product.status}
              </span>
            </div>

            {/* Specs + price combined row */}
            <div className="flex items-center gap-4 py-2.5 border-y border-border mb-3">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Scale</p>
                <p className="text-xs font-bold text-foreground mt-0.5">{product.scale}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">ETA</p>
                <p className="text-xs font-bold text-primary mt-0.5">{product.eta}</p>
              </div>
              {product.slots_total > 0 && (
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Slots</p>
                  <p className="text-xs font-bold text-foreground mt-0.5">
                    {product.slots_total - product.slots_filled}/{product.slots_total}
                  </p>
                </div>
              )}
              <div className="ml-auto text-right">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Price</p>
                <p className="text-xl font-bold text-primary mt-0.5">{product.price.split('-')[0].trim()}</p>
              </div>
            </div>

            {/* Note */}
            {product.note && (
              <div className="bg-secondary rounded-lg px-3 py-2 border border-border mb-3">
                <p className="text-xs text-foreground leading-snug">✦ {product.note}</p>
              </div>
            )}

            {/* Slots progress */}
            {product.slots_total > 0 && (
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-semibold text-foreground uppercase tracking-wide">Availability</span>
                  <span className="text-[10px] font-bold text-primary">
                    {product.slots_total - product.slots_filled} of {product.slots_total} left
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((product.slots_filled / product.slots_total) * 100, 100) || 0.5}%` }}
                  />
                </div>
              </div>
            )}

            {/* PO deadline */}
            {product.status === 'Open PO' && product.po_deadline && (
              <div className="bg-primary/10 rounded-lg px-3 py-2 border border-primary/20 mb-3">
                <p className="text-xs text-primary font-semibold">
                  📅{' '}
                  {new Date(product.po_deadline).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="mt-auto pt-1">
              <button
                onClick={() => setShowCheckout(true)}
                disabled={isDisabled}
                className={`w-full py-3 px-4 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-500 ${
                  isDisabled
                    ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                    : 'bg-foreground text-background hover:bg-primary hover:text-foreground hover:shadow-xl hover:-translate-y-0.5 active:scale-95'
                }`}
              >
                {isDisabled ? product.status : product.status === 'Ready Stock' ? '🛒 Buy Now' : '📦 Pre-Order Now'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .animate-slide-up {
          animation: slide-up 0.42s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      {showCheckout && (
        <CheckoutDrawer product={product} onClose={() => setShowCheckout(false)} />
      )}
    </>
  );
}
