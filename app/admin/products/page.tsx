'use client';

import { useEffect, useState } from 'react';
import { adminApi, ApiProduct } from '@/lib/api';
import { Loader2, Plus, Edit2, Trash2, X, Check, RefreshCw } from 'lucide-react';

export default function AdminProducts() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    scale: '1:64',
    price: 0,
    image_url: '/images/placeholder.jpg',
    status: 'PO' as 'ready' | 'PO' | 'PO_closed',
    slot_po: 0,
    slot_filled: 0,
    eta_po: '',
    description: '',
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.getAdminProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch products from backend database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product: ApiProduct) => {
    setEditingId(product.id);
    setIsAdding(false);
    setFormData({
      title: product.title,
      brand: product.order_description || '',
      scale: product.scale || '1:64',
      price: product.price,
      image_url: product.image_url || '/images/placeholder.jpg',
      status: product.status,
      slot_po: product.slot_po || 0,
      slot_filled: product.slot_filled || 0,
      eta_po: product.eta_po ? product.eta_po.split('T')[0] : '',
      description: product.description || '',
    });
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      title: '',
      brand: '',
      scale: '1:64',
      price: 0,
      image_url: '/images/placeholder.jpg',
      status: 'PO',
      slot_po: 12,
      slot_filled: 0,
      eta_po: '',
      description: '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const postData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        image_url: formData.image_url.trim() || undefined,
        scale: formData.scale.trim() || undefined,
        price: parseFloat(formData.price as any) || 0,
        status: formData.status,
        slot_po: formData.slot_po || null,
        slot_filled: formData.slot_filled || 0,
        eta_po: formData.eta_po || null,
        order_description: formData.brand.trim() || undefined, // Map brand to order_description
      };

      if (isAdding) {
        await adminApi.createProduct(postData);
      } else if (editingId) {
        await adminApi.updateProduct(editingId, postData);
      }

      setEditingId(null);
      setIsAdding(false);
      fetchProducts();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save product changes.');
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        setLoading(true);
        await adminApi.deleteProduct(id);
        fetchProducts();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to delete product.');
        setLoading(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'slot_po' || name === 'slot_filled' ? parseInt(value) || 0 : value,
    }));
  };

  const formatPrice = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  if (loading && products.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold font-serif mb-2">Products Management</h1>
          <p className="text-muted-foreground">Manage active models inside the database</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            className="p-2.5 border border-border bg-secondary/30 rounded-xl hover:border-primary hover:text-primary transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {!editingId && !isAdding && (
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-background font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-primary/95 hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-5 py-4">
          {error}
        </div>
      )}

      {/* Add/Edit Form Card */}
      {(editingId || isAdding) && (
        <div className="bg-secondary/40 border border-border/80 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl relative animate-fade-in-up">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
          <h2 className="text-2xl font-bold font-serif text-foreground mb-6">
            {isAdding ? 'Add New Collectible Model' : 'Edit Collectible Details'}
          </h2>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. RWB 930 STELLA ARTOIS"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Manufacturer / Brand</label>
                <input
                  type="text"
                  name="brand"
                  required
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g. Almost Real"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Scale</label>
                <input
                  type="text"
                  name="scale"
                  required
                  value={formData.scale}
                  onChange={handleChange}
                  placeholder="e.g. 1:64"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Price (IDR)</label>
                <input
                  type="number"
                  name="price"
                  required
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="375000"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary transition cursor-pointer"
                >
                  <option value="PO">Open PO</option>
                  <option value="ready">Ready Stock</option>
                  <option value="PO_closed">Sold Out (PO Closed)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total PO Slots</label>
                <input
                  type="number"
                  name="slot_po"
                  value={formData.slot_po}
                  onChange={handleChange}
                  placeholder="12"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Filled Slots</label>
                <input
                  type="number"
                  name="slot_filled"
                  value={formData.slot_filled}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">PO Deadline</label>
                <input
                  type="date"
                  name="eta_po"
                  value={formData.eta_po}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Image URL Path</label>
                <input
                  type="text"
                  name="image_url"
                  required
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="/images/1/product.jpg"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary transition"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Model Notes / Descriptions</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Write description (e.g. Warna Black Chrome adalah Chase Car nya)"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary transition resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-6 py-3.5 bg-primary text-background font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-primary/95 transition duration-300 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Save Collectible
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setIsAdding(false);
                }}
                className="flex items-center gap-1.5 px-6 py-3.5 bg-secondary border border-border text-foreground font-bold uppercase tracking-widest text-xs rounded-xl hover:border-primary transition duration-300 cursor-pointer"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table Card */}
      <div className="bg-secondary/40 border border-border/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border/60">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Collectible Model</th>
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Brand</th>
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Price</th>
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Slots Filled</th>
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border/40 hover:bg-background/25 transition duration-300">
                  <td className="py-4 px-6 font-serif font-bold text-foreground text-base">{product.title}</td>
                  <td className="py-4 px-6 text-foreground">{product.order_description || '-'}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      product.status === 'PO' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                      product.status === 'ready' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                      'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      {product.status === 'PO' ? 'Open PO' : product.status === 'ready' ? 'Ready Stock' : 'Sold Out'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-primary font-bold font-serif">{formatPrice(product.price)}</td>
                  <td className="py-4 px-6 text-foreground font-mono">
                    {product.slot_po ? `${product.slot_filled} / ${product.slot_po}` : '-'}
                  </td>
                  <td className="py-4 px-6 flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary hover:text-background transition duration-300 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition duration-300 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground italic">No products available in the database logs.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
