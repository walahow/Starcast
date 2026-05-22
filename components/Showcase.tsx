'use client';

import { PRODUCTS, Product, ProductStatus } from '@/lib/products';
import { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import CheckoutDrawer from './CheckoutDrawer';

type FilterTab = 'All' | ProductStatus;

const STATUS_ORDER: ProductStatus[] = ['Open PO', 'Ready Stock', 'Coming Soon', 'Sold Out'];

const STATUS_STYLES: Record<ProductStatus, string> = {
  'Open PO': 'bg-primary text-foreground',
  'Ready Stock': 'bg-blue-500 text-white',
  'Coming Soon': 'bg-amber-500 text-white',
  'Sold Out': 'bg-red-500 text-white',
};

function statusDot(status: ProductStatus) {
  const colors: Record<ProductStatus, string> = {
    'Open PO': 'bg-primary',
    'Ready Stock': 'bg-blue-500',
    'Coming Soon': 'bg-amber-500',
    'Sold Out': 'bg-red-500',
  };
  return colors[status];
}

export default function Showcase() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

  const counts = useMemo<Record<FilterTab, number>>(() => ({
    All: PRODUCTS.length,
    'Open PO': PRODUCTS.filter(p => p.status === 'Open PO').length,
    'Ready Stock': PRODUCTS.filter(p => p.status === 'Ready Stock').length,
    'Coming Soon': PRODUCTS.filter(p => p.status === 'Coming Soon').length,
    'Sold Out': PRODUCTS.filter(p => p.status === 'Sold Out').length,
  }), []);

  // Tabs — only render status tabs that have at least one product
  const visibleTabs: FilterTab[] = [
    'All',
    ...STATUS_ORDER.filter(s => counts[s] > 0),
  ];

  // Filtered flat list (for non-All tabs)
  const filtered = useMemo(
    () => (activeTab === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.status === activeTab)),
    [activeTab],
  );

  // Grouped sections for All view
  const sections = useMemo(
    () =>
      STATUS_ORDER
        .map(status => ({ status, products: PRODUCTS.filter(p => p.status === status) }))
        .filter(g => g.products.length > 0),
    [],
  );

  return (
    <>
      <section id="showcase" className="py-20 md:py-32 bg-background relative">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/2 right-0 w-1/3 h-1/3 bg-primary/3 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="space-y-3">
                <p className="text-xs font-bold text-primary uppercase tracking-[0.15em]">◆ COLLECTION</p>
                <h2 className="text-5xl md:text-6xl font-bold text-foreground">
                  Curated for Collectors
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Handpicked 1:64 scale diecast models from premium manufacturers.
                </p>
              </div>

              {/* Compact stats */}
              <div className="flex gap-6 flex-shrink-0">
                {STATUS_ORDER.filter(s => counts[s] > 0).map(s => (
                  <div key={s} className="text-right">
                    <p className={`text-2xl font-bold ${s === 'Open PO' ? 'text-primary' : 'text-foreground'}`}>
                      {counts[s]}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 flex-wrap mb-10 pb-5 border-b border-border">
            {visibleTabs.map(tab => {
              const isActive = activeTab === tab;
              const isStatus = tab !== 'All';
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    isActive
                      ? 'bg-foreground text-background shadow-md'
                      : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-border/80'
                  }`}
                >
                  {/* Status color dot */}
                  {isStatus && (
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      isActive ? 'bg-primary' : statusDot(tab as ProductStatus)
                    }`} />
                  )}
                  {tab}
                  <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-bold transition-colors duration-300 ${
                    isActive ? 'bg-primary text-foreground' : 'bg-border text-muted-foreground'
                  }`}>
                    {counts[tab]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content — keyed on activeTab to re-trigger enter animations */}
          <div key={activeTab}>
            {activeTab === 'All' ? (
              /* Sectioned view */
              <div className="space-y-20">
                {sections.map(({ status, products }, sectionIdx) => (
                  <div key={status} data-scroll>
                    {/* Section label */}
                    <div className="flex items-center gap-4 mb-8">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_STYLES[status]}`}>
                        {status}
                      </span>
                      <span className="text-sm text-muted-foreground font-medium">
                        {products.length} item{products.length !== 1 ? 's' : ''}
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                    </div>

                    {/* Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {products.map((product, i) => (
                        <div
                          key={product.id}
                          className="card-enter cursor-pointer"
                          style={{ '--delay': `${(sectionIdx * 3 + i) * 60}ms` } as React.CSSProperties}
                          onClick={() => setSelectedProduct(product)}
                        >
                          <ProductCard
                            product={product}
                            onCheckout={() => setCheckoutProduct(product)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length > 0 ? (
              /* Flat filtered grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.map((product, i) => (
                  <div
                    key={product.id}
                    className="card-enter cursor-pointer"
                    style={{ '--delay': `${i * 60}ms` } as React.CSSProperties}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <ProductCard
                      product={product}
                      onCheckout={() => setCheckoutProduct(product)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <p className="text-5xl mb-4">🔍</p>
                <p className="text-lg font-semibold text-foreground mb-2">Nothing here yet</p>
                <p className="text-sm text-muted-foreground mb-8">Check back soon for updates in this category</p>
                <button
                  onClick={() => setActiveTab('All')}
                  className="px-6 py-3 bg-foreground text-background text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-primary hover:text-foreground transition-all duration-300"
                >
                  View All Products
                </button>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          @keyframes card-in {
            from { opacity: 0; transform: translateY(18px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .card-enter {
            animation: card-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
            animation-delay: var(--delay, 0ms);
          }
        `}</style>
      </section>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {checkoutProduct && (
        <CheckoutDrawer
          product={checkoutProduct}
          onClose={() => setCheckoutProduct(null)}
        />
      )}
    </>
  );
}
