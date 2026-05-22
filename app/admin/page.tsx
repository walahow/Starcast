'use client';

import { PRODUCTS } from '@/lib/products';

export default function AdminDashboard() {
  const totalProducts = PRODUCTS.length;
  const openPOProducts = PRODUCTS.filter(p => p.status === 'Open PO').length;
  const readyStockProducts = PRODUCTS.filter(p => p.status === 'Ready Stock').length;
  const totalSlots = PRODUCTS.reduce((acc, p) => acc + p.slots_total, 0);
  const filledSlots = PRODUCTS.reduce((acc, p) => acc + p.slots_filled, 0);

  const stats = [
    {
      label: 'Total Products',
      value: totalProducts,
      color: 'text-primary',
    },
    {
      label: 'Open PO',
      value: openPOProducts,
      color: 'text-green-500',
    },
    {
      label: 'Ready Stock',
      value: readyStockProducts,
      color: 'text-blue-500',
    },
    {
      label: 'Slots Filled',
      value: `${filledSlots} / ${totalSlots}`,
      color: 'text-yellow-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Starcast Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-secondary border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Products */}
      <div className="bg-secondary border border-border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Recent Products</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Product</th>
                <th className="text-left py-3 px-4 font-semibold">Brand</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
                <th className="text-left py-3 px-4 font-semibold">Slots</th>
                <th className="text-left py-3 px-4 font-semibold">Price</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.slice(0, 5).map((product) => (
                <tr key={product.id} className="border-b border-border/50 hover:bg-background transition">
                  <td className="py-3 px-4">{product.name}</td>
                  <td className="py-3 px-4">{product.brand}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      product.status === 'Open PO' ? 'bg-green-500/20 text-green-500' :
                      product.status === 'Ready Stock' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {product.slots_total > 0 ? `${product.slots_filled} / ${product.slots_total}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-primary font-semibold">{product.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-secondary border border-border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/products"
            className="block px-6 py-3 bg-primary text-background font-semibold rounded hover:bg-primary-dark transition text-center"
          >
            Manage Products
          </a>
          <a
            href="/admin/preorders"
            className="block px-6 py-3 bg-primary/10 text-primary font-semibold rounded hover:bg-primary/20 transition text-center"
          >
            View Pre-Orders
          </a>
          <a
            href="/"
            className="block px-6 py-3 bg-primary/10 text-primary font-semibold rounded hover:bg-primary/20 transition text-center"
          >
            View Store
          </a>
        </div>
      </div>
    </div>
  );
}
