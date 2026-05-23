'use client';

import { useEffect, useState } from 'react';
import { adminApi, AdminDashboard } from '@/lib/api';
import { Loader2, Package, ShoppingCart, Users, DollarSign, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardView() {
  const [stats, setStats] = useState<AdminDashboard | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.getDashboard();
      setStats(data);

      const orders = await adminApi.getAdminOrders();
      setRecentOrders(orders.slice(0, 5));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load live dashboard analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatPrice = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const statCards = stats
    ? [
        {
          label: 'Total Revenue',
          value: formatPrice(stats.total_revenue),
          color: 'text-primary border-primary/20',
          icon: <DollarSign className="w-5 h-5 text-primary" />,
        },
        {
          label: 'Total Customers',
          value: stats.total_customers,
          color: 'text-blue-400 border-blue-500/20',
          icon: <Users className="w-5 h-5 text-blue-400" />,
        },
        {
          label: 'Active Products',
          value: stats.total_products,
          color: 'text-green-400 border-green-500/20',
          icon: <Package className="w-5 h-5 text-green-400" />,
        },
        {
          label: 'Paid Orders',
          value: `${stats.paid_orders} / ${stats.total_orders}`,
          color: 'text-yellow-400 border-yellow-500/20',
          icon: <ShoppingCart className="w-5 h-5 text-yellow-400" />,
        },
      ]
    : [];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold font-serif mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Real-time collectibles database logs</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="p-2 border border-border bg-secondary/30 rounded-xl hover:border-primary hover:text-primary transition cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-5 py-4">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-secondary/40 border border-border/80 rounded-2xl p-6 flex items-center justify-between shadow-lg">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</p>
              <p className={`text-2xl font-bold font-serif ${stat.color.split(' ')[0]}`}>{stat.value}</p>
            </div>
            <div className={`p-3 rounded-xl bg-background border ${stat.color.split(' ')[1]}`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders Table */}
      <div className="bg-secondary/40 border border-border/80 rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold font-serif text-foreground mb-6">Recent Customer Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Order Code</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Customer</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Courier</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Grand Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-border/40 hover:bg-background/20 transition duration-300">
                  <td className="py-3 px-4 font-mono font-semibold text-foreground">{order.order_code}</td>
                  <td className="py-3 px-4 text-foreground">{order.customer_name}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      order.order_status === 'paid' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                      order.order_status === 'pending' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                      'bg-secondary border-border text-muted-foreground'
                    }`}>
                      {order.order_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{order.courier || '-'}</td>
                  <td className="py-3 px-4 text-primary font-bold font-serif">{formatPrice(order.total)}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground italic">No recent order logs.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-secondary/40 border border-border/80 rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold font-serif text-foreground mb-6">Quick Database Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/admin/products"
            className="flex items-center justify-center gap-2 px-6 py-4 bg-primary text-background font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-primary/95 hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:-translate-y-0.5 transition duration-300 cursor-pointer"
          >
            Manage Products <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/admin/preorders"
            className="flex items-center justify-center gap-2 px-6 py-4 bg-secondary border border-border text-foreground font-bold uppercase tracking-widest text-xs rounded-xl hover:border-primary transition duration-300 cursor-pointer"
          >
            View Pre-Orders
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-4 bg-secondary border border-border text-primary font-bold uppercase tracking-widest text-xs rounded-xl hover:border-primary transition duration-300 cursor-pointer"
          >
            ← Exit to Showroom
          </Link>
        </div>
      </div>
    </div>
  );
}
