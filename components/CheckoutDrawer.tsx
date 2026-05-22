'use client';

import { Product } from '@/lib/products';
import { useState, useEffect } from 'react';

interface CheckoutDrawerProps {
  product: Product;
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

export default function CheckoutDrawer({ product, onClose }: CheckoutDrawerProps) {
  useScrollLock();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    quantity: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(onClose, 3000);
    }, 1000);
  };

  const price = product.price.split('-')[0].trim();
  const isSoldOut =
    product.status === 'Sold Out' ||
    (product.slots_total > 0 && product.slots_filled >= product.slots_total);
  const isPreOrder = product.status !== 'Ready Stock';
  const slotsLeft = product.slots_total > 0 ? product.slots_total - product.slots_filled : null;
  const fillPercent =
    product.slots_total > 0
      ? Math.min((product.slots_filled / product.slots_total) * 100, 100)
      : 0;

  return (
    <>
      {/* Scrim — dims the modal behind, click to close */}
      <div
        className="fixed inset-0 z-[55] bg-black/25 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 z-[60] w-full sm:w-[440px] bg-white shadow-2xl flex flex-col drawer-enter">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex-shrink-0">
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            {isPreOrder ? '📦 Pre-Order' : '🛒 Checkout'}
          </p>
          <h2 className="text-xs font-bold text-foreground mt-0.5 leading-snug line-clamp-2">
            {product.name}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{product.brand}</p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {success ? (
            /* Success state */
            <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Order Confirmed!</h3>
              <p className="text-sm text-muted-foreground mb-1">
                Thank you for your {isPreOrder ? 'pre-order' : 'purchase'}.
              </p>
              <p className="text-xs text-muted-foreground">
                Confirmation sent to <span className="font-semibold text-foreground">{formData.email}</span>
              </p>
            </div>
          ) : (
            <div className="px-6 py-6 space-y-6">
              {/* Product summary */}
              <div className="bg-secondary rounded-xl p-4 border border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{product.brand}</p>
                    <p className="text-sm font-semibold text-foreground leading-snug">{product.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {product.scale} &nbsp;·&nbsp; ETA {product.eta}
                    </p>
                  </div>
                  <p className="text-primary font-bold text-sm flex-shrink-0">{price}</p>
                </div>

                {product.slots_total > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Availability</span>
                      <span className="font-bold text-primary">
                        {slotsLeft} of {product.slots_total} slots left
                      </span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-amber-400 rounded-full transition-all duration-700"
                        style={{ width: `${fillPercent || 0.5}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* PO deadline */}
              {isPreOrder && product.po_deadline && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
                  <p className="text-xs font-semibold text-primary">
                    📅 Pre-order deadline:{' '}
                    {new Date(product.po_deadline).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-foreground uppercase tracking-[0.12em] mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full px-4 py-3 text-sm border border-border rounded-lg focus:outline-none focus:border-primary transition-colors duration-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-foreground uppercase tracking-[0.12em] mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 text-sm border border-border rounded-lg focus:outline-none focus:border-primary transition-colors duration-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-foreground uppercase tracking-[0.12em] mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+62 812 3456 7890"
                    className="w-full px-4 py-3 text-sm border border-border rounded-lg focus:outline-none focus:border-primary transition-colors duration-200 bg-white"
                  />
                </div>

                {!isPreOrder && (
                  <div>
                    <label className="block text-[10px] font-bold text-foreground uppercase tracking-[0.12em] mb-1.5">
                      Quantity *
                    </label>
                    <select
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="w-full px-4 py-3 text-sm border border-border rounded-lg focus:outline-none focus:border-primary transition-colors duration-200 bg-white"
                    >
                      {[1, 2, 3, 4, 5].map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || isSoldOut}
                  className={`w-full py-4 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-500 ${
                    isSubmitting || isSoldOut
                      ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                      : 'bg-foreground text-background hover:bg-primary hover:text-foreground hover:shadow-xl hover:-translate-y-0.5 active:scale-95'
                  }`}
                >
                  {isSubmitting
                    ? 'Processing...'
                    : isSoldOut
                    ? 'Sold Out'
                    : `Confirm ${isPreOrder ? 'Pre-Order' : 'Purchase'}`}
                </button>

                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes drawer-in {
          from { transform: translateX(100%); opacity: 0.6; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .drawer-enter {
          animation: drawer-in 0.42s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
      `}</style>
    </>
  );
}
