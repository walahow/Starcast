'use client';

import { Product } from '@/lib/products';
import { useState } from 'react';

interface CheckoutFormProps {
  product: Product;
  onClose: () => void;
}

export default function CheckoutForm({ product, onClose }: CheckoutFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    quantity: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

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

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage(true);

      // Show success for 3 seconds then close
      setTimeout(() => {
        onClose();
      }, 3000);
    }, 1000);
  };

  const totalPrice = product.price.split('-')[0].trim();
  const isSoldOut = product.status === 'Sold Out' ||
    (product.slots_total > 0 && product.slots_filled >= product.slots_total);

  if (successMessage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Order Confirmed!</h2>
          <p className="text-muted-foreground mb-2">
            Thank you for your {product.status === 'Ready Stock' ? 'purchase' : 'pre-order'}
          </p>
          <p className="text-sm text-muted-foreground">
            A confirmation email has been sent to {formData.email}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-md transition-opacity duration-500"
        onClick={onClose}
      />

      {/* Form Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
        <div
          className="bg-white rounded-3xl w-full shadow-2xl transform transition-all duration-500 animate-slide-up flex flex-col"
          style={{
            height: 'min(90vh, calc(100vh - 2rem))',
            maxWidth: 'min(90vw, 700px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center bg-secondary border border-border hover:bg-foreground hover:text-white transition-all duration-500 rounded-full group"
          >
            <svg className="w-6 h-6 transition-transform duration-500 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
              <p className="text-xs font-bold text-primary uppercase tracking-[0.15em] mb-2">
                {product.status === 'Ready Stock' ? '🛒 Checkout' : '📦 Pre-Order'}
              </p>
              <h2 className="text-3xl font-bold text-foreground">
                {product.name}
              </h2>
              <p className="text-muted-foreground mt-2">
                Brand: <span className="font-semibold text-foreground">{product.brand}</span>
              </p>
            </div>

            {/* Product Summary */}
            <div className="bg-secondary rounded-xl p-4 mb-8 border border-border">
              <div className="flex justify-between items-center mb-3">
                <span className="text-foreground font-semibold">{product.name}</span>
                <span className="text-primary font-bold">{totalPrice}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{product.scale} • {product.eta}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary transition-colors duration-300 bg-white"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary transition-colors duration-300 bg-white"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+62 812 3456 7890"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary transition-colors duration-300 bg-white"
                />
              </div>

              {/* Quantity */}
              {product.status === 'Ready Stock' && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Quantity *
                  </label>
                  <select
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary transition-colors duration-300 bg-white"
                  >
                    {[1, 2, 3, 4, 5].map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Info Message */}
              {product.status !== 'Ready Stock' && (
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <p className="text-sm text-primary font-semibold">
                    ✓ Pre-order deadline: {new Date(product.po_deadline).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-primary/80 mt-1">
                    {product.slots_total - product.slots_filled} slots remaining
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isSoldOut}
                className={`w-full py-4 px-6 text-center text-sm font-bold uppercase tracking-widest rounded-lg transition-all duration-500 ${
                  isSubmitting || isSoldOut
                    ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                    : 'bg-foreground text-background hover:bg-primary hover:text-foreground hover:shadow-xl hover:-translate-y-1'
                }`}
              >
                {isSubmitting ? 'Processing...' : isSoldOut ? 'Sold Out' : `Confirm ${product.status === 'Ready Stock' ? 'Purchase' : 'Pre-Order'}`}
              </button>

              {/* Terms */}
              <p className="text-xs text-muted-foreground text-center">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </>
  );
}
