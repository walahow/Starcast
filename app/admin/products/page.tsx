'use client';

import { useState } from 'react';
import { PRODUCTS, Product, ProductStatus } from '@/lib/products';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [isAdding, setIsAdding] = useState(false);

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData(product);
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      name: '',
      brand: '',
      scale: '1:64',
      price: '',
      image: '/images/placeholder.jpg',
      status: 'Coming Soon' as ProductStatus,
      slots_total: 0,
      slots_filled: 0,
      po_deadline: '',
      eta: '',
      note: '',
      whatsapp_msg: '',
    });
  };

  const handleSave = () => {
    if (isAdding) {
      const newId = Math.max(...products.map(p => p.id), 0) + 1;
      const newProduct: Product = {
        ...(formData as Product),
        id: newId,
      };
      setProducts([...products, newProduct]);
    } else if (editingId) {
      setProducts(
        products.map(p =>
          p.id === editingId ? { ...p, ...formData } : p
        )
      );
    }
    setEditingId(null);
    setIsAdding(false);
    setFormData({});
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'slots_total' || name === 'slots_filled' ? parseInt(value) : value,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Products</h1>
          <p className="text-muted-foreground">Manage your diecast collection</p>
        </div>
        {!editingId && !isAdding && (
          <button
            onClick={handleAdd}
            className="px-6 py-2 bg-primary text-background font-semibold rounded hover:bg-primary-dark transition"
          >
            + Add Product
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(editingId || isAdding) && (
        <div className="bg-secondary border border-border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">
            {isAdding ? 'Add New Product' : 'Edit Product'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form Fields */}
            <input
              type="text"
              name="name"
              placeholder="Product Name"
              value={formData.name || ''}
              onChange={handleChange}
              className="col-span-2 px-4 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              name="brand"
              placeholder="Brand"
              value={formData.brand || ''}
              onChange={handleChange}
              className="px-4 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              name="price"
              placeholder="Price"
              value={formData.price || ''}
              onChange={handleChange}
              className="px-4 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              name="scale"
              placeholder="Scale (e.g., 1:64)"
              value={formData.scale || ''}
              onChange={handleChange}
              className="px-4 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-primary"
            />
            <select
              name="status"
              value={formData.status || ''}
              onChange={handleChange}
              className="px-4 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-primary"
            >
              <option value="Open PO">Open PO</option>
              <option value="Ready Stock">Ready Stock</option>
              <option value="Coming Soon">Coming Soon</option>
              <option value="Sold Out">Sold Out</option>
            </select>
            <input
              type="number"
              name="slots_total"
              placeholder="Total Slots"
              value={formData.slots_total || 0}
              onChange={handleChange}
              className="px-4 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-primary"
            />
            <input
              type="number"
              name="slots_filled"
              placeholder="Slots Filled"
              value={formData.slots_filled || 0}
              onChange={handleChange}
              className="px-4 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-primary"
            />
            <input
              type="date"
              name="po_deadline"
              value={formData.po_deadline || ''}
              onChange={handleChange}
              className="px-4 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              name="eta"
              placeholder="ETA (e.g., Q2-Q3)"
              value={formData.eta || ''}
              onChange={handleChange}
              className="px-4 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-primary"
            />
            <textarea
              name="note"
              placeholder="Notes (optional)"
              value={formData.note || ''}
              onChange={handleChange}
              className="col-span-2 px-4 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-primary"
              rows={2}
            />
            <input
              type="text"
              name="image"
              placeholder="Image URL"
              value={formData.image || ''}
              onChange={handleChange}
              className="col-span-2 px-4 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-primary"
            />
            <textarea
              name="whatsapp_msg"
              placeholder="WhatsApp Message"
              value={formData.whatsapp_msg || ''}
              onChange={handleChange}
              className="col-span-2 px-4 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-primary"
              rows={2}
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-primary text-background font-semibold rounded hover:bg-primary-dark transition"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditingId(null);
                setIsAdding(false);
                setFormData({});
              }}
              className="px-6 py-2 bg-secondary border border-border text-foreground font-semibold rounded hover:border-primary transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-secondary border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-background border-b border-border">
            <tr>
              <th className="text-left py-4 px-6 font-semibold">Product</th>
              <th className="text-left py-4 px-6 font-semibold">Brand</th>
              <th className="text-left py-4 px-6 font-semibold">Status</th>
              <th className="text-left py-4 px-6 font-semibold">Price</th>
              <th className="text-left py-4 px-6 font-semibold">Slots</th>
              <th className="text-left py-4 px-6 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-border/50 hover:bg-background/50 transition">
                <td className="py-4 px-6">{product.name}</td>
                <td className="py-4 px-6">{product.brand}</td>
                <td className="py-4 px-6">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    product.status === 'Open PO' ? 'bg-green-500/20 text-green-500' :
                    product.status === 'Ready Stock' ? 'bg-blue-500/20 text-blue-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {product.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-primary font-semibold">{product.price}</td>
                <td className="py-4 px-6 text-xs">
                  {product.slots_total > 0 ? `${product.slots_filled}/${product.slots_total}` : '-'}
                </td>
                <td className="py-4 px-6 flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="px-3 py-1 bg-primary/20 text-primary rounded text-xs hover:bg-primary/30 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="px-3 py-1 bg-red-500/20 text-red-500 rounded text-xs hover:bg-red-500/30 transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
