'use client';

import { useEffect, useState } from 'react';
import { adminApi, AdminOrder } from '@/lib/api';
import { Loader2, RefreshCw, Smartphone } from 'lucide-react';

export default function AdminPreOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.getAdminOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load pre-orders from database logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      setLoading(true);
      await adminApi.updateOrderStatus(id, newStatus);
      fetchOrders();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update order status.');
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
      paid: "bg-green-500/10 border-green-500/20 text-green-500",
      processing: "bg-blue-500/10 border-blue-500/20 text-blue-400",
      shipped: "bg-purple-500/10 border-purple-500/20 text-purple-400",
      done: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      cancelled: "bg-red-500/10 border-red-500/20 text-red-400",
    };
    return colorMap[status.toLowerCase()] || "bg-secondary border-border text-muted-foreground";
  };

  const formatPrice = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading && orders.length === 0) {
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
          <h1 className="text-4xl font-bold font-serif mb-2">Pre-Orders & Orders Log</h1>
          <p className="text-muted-foreground">Monitor and fulfill customer transaction logs</p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2.5 border border-border bg-secondary/30 rounded-xl hover:border-primary hover:text-primary transition cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-5 py-4">
          {error}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-secondary/40 border border-border/80 rounded-2xl p-6 shadow-lg">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Total Logged Orders</p>
          <p className="text-3xl font-bold text-primary font-serif">{orders.length}</p>
        </div>
        <div className="bg-secondary/40 border border-border/80 rounded-2xl p-6 shadow-lg">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Pending Invoices</p>
          <p className="text-3xl font-bold text-yellow-500 font-serif">
            {orders.filter(o => o.order_status.toLowerCase() === 'pending').length}
          </p>
        </div>
        <div className="bg-secondary/40 border border-border/80 rounded-2xl p-6 shadow-lg">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Paid / Confirmed</p>
          <p className="text-3xl font-bold text-green-500 font-serif">
            {orders.filter(o => o.order_status.toLowerCase() === 'paid').length}
          </p>
        </div>
        <div className="bg-secondary/40 border border-border/80 rounded-2xl p-6 shadow-lg">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Shipped Logs</p>
          <p className="text-3xl font-bold text-purple-500 font-serif">
            {orders.filter(o => o.order_status.toLowerCase() === 'shipped').length}
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-secondary/40 border border-border/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border/60">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Customer</th>
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Order Code</th>
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Models Ordered</th>
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Total Price</th>
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Fulfillment Status</th>
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Date</th>
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Direct Line</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border/40 hover:bg-background/25 transition duration-300">
                  <td className="py-4 px-6">
                    <p className="font-semibold text-foreground">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{order.customer_email}</p>
                  </td>
                  <td className="py-4 px-6 font-mono font-semibold text-foreground">{order.order_code}</td>
                  <td className="py-4 px-6 text-foreground max-w-xs truncate">
                    {order.order_items ? order.order_items.map((i) => `${i.title} (${i.qty}x)`).join(", ") : '-'}
                  </td>
                  <td className="py-4 px-6 text-primary font-bold font-serif">{formatPrice(order.total)}</td>
                  <td className="py-4 px-6">
                    <select
                      value={order.order_status}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold bg-background border border-border focus:outline-none focus:border-primary cursor-pointer uppercase ${getStatusColor(order.order_status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="done">Done</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="py-4 px-6 text-xs text-muted-foreground">{formatDate(order.ordered_at)}</td>
                  <td className="py-4 px-6">
                    {order.customer_phone ? (
                      <a
                        href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500 hover:text-background px-3 py-1.5 rounded-full text-xs font-bold transition duration-300"
                      >
                        <Smartphone className="w-3.5 h-3.5" /> WA Link
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">No Phone</span>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground italic">No pre-order records available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
