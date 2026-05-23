'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/context/CartContext';
import { useAuth } from '@/lib/context/AuthContext';
import { productApi, ApiProduct } from '@/lib/api';
import { Product, ProductStatus } from '@/lib/products';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import { Loader2 } from 'lucide-react';

type FilterTab = 'All' | ProductStatus;

const STATUS_ORDER: ProductStatus[] = ['Open PO', 'Ready Stock', 'Coming Soon', 'Sold Out'];

const STATUS_STYLES: Record<ProductStatus, string> = {
  'Open PO': 'bg-primary text-background',
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
  const router = useRouter();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [rawProducts, setRawProducts] = useState<ApiProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

  // Fetch from Express API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const list = await productApi.list();
      setRawProducts(list);

      // Map to frontend-compatible Product format
      const mapped = list.map((p) => {
        let status: ProductStatus = 'Ready Stock';
        if (p.status === 'PO') {
          status = !p.slot_po ? 'Coming Soon' : 'Open PO';
        } else if (p.status === 'PO_closed') {
          status = 'Sold Out';
        }

        return {
          id: p.id,
          name: p.title,
          brand: p.order_description || 'Starcast Brand',
          scale: p.scale || '1:64',
          price: `Rp ${parseFloat(p.price as any).toLocaleString('id-ID')}`,
          image: p.image_url || '/images/placeholder.jpg',
          status: status,
          slots_total: p.slot_po || 0,
          slots_filled: p.slot_filled || 0,
          po_deadline: p.eta_po ? p.eta_po.split('T')[0] : '',
          eta: p.eta_po ? 'Q3' : 'Ready',
          note: p.description || '',
          whatsapp_msg: p.order_description || '',
        };
      });

      setProducts(mapped);
    } catch (err) {
      console.error("Failed to load products from database:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const counts = useMemo<Record<FilterTab, number>>(() => ({
    All: products.length,
    'Open PO': products.filter(p => p.status === 'Open PO').length,
    'Ready Stock': products.filter(p => p.status === 'Ready Stock').length,
    'Coming Soon': products.filter(p => p.status === 'Coming Soon').length,
    'Sold Out': products.filter(p => p.status === 'Sold Out').length,
  }), [products]);

  // Tabs — only render status tabs that have at least one product
  const visibleTabs: FilterTab[] = [
    'All',
    ...STATUS_ORDER.filter(s => counts[s] > 0),
  ];

  // Filtered flat list
  const filtered = useMemo(
    () => (activeTab === 'All' ? products : products.filter(p => p.status === activeTab)),
    [activeTab, products],
  );

  // Grouped sections for All view
  const sections = useMemo(
    () =>
      STATUS_ORDER
        .map(status => ({ status, products: products.filter(p => p.status === status) }))
        .filter(g => g.products.length > 0),
    [products],
  );

  // Handle actual cart addition and checkout redirection
  const handleCheckout = (productId: number) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const raw = rawProducts.find(p => p.id === productId);
    if (raw) {
      addToCart(raw, 1);
      router.push('/checkout');
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-mono tracking-widest text-primary uppercase animate-pulse">◆ Connecting Showroom Database ◆</p>
        </div>
      </div>
    );
  }

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
                <h2 className="text-5xl md:text-6xl font-bold text-foreground font-serif">
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
                    <p className={`text-2xl font-bold font-serif ${s === 'Open PO' ? 'text-primary' : 'text-foreground'}`}>
                      {counts[s]}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold whitespace-nowrap">{s}</p>
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
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-foreground text-background shadow-md'
                      : 'bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/80'
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
                    isActive ? 'bg-primary text-background' : 'bg-secondary border border-border text-muted-foreground'
                  }`}>
                    {counts[tab]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div key={activeTab}>
            {activeTab === 'All' ? (
              /* Sectioned view */
              <div className="space-y-20">
                {sections.map(({ status, products }, sectionIdx) => (
                  <div key={status} data-scroll>
                    {/* Section label */}
                    <div className="flex items-center gap-4 mb-8">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_STYLES[status]}`}>
                        {status}
                      </span>
                      <span className="text-xs text-muted-foreground font-bold tracking-wider uppercase">
                        {products.length} item{products.length !== 1 ? 's' : ''}
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent" />
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
                            onCheckout={() => handleCheckout(product.id)}
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
                      onCheckout={() => handleCheckout(product.id)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <p className="text-5xl mb-4">🔍</p>
                <p className="text-lg font-bold text-foreground mb-2">Nothing here yet</p>
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
          onCheckout={() => handleCheckout(selectedProduct.id)}
        />
      )}
    </>
  );
}
