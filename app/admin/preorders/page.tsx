'use client';

import { PRODUCTS } from '@/lib/products';

interface PreOrder {
  id: number;
  productId: number;
  customerName: string;
  customerPhone: string;
  quantity: number;
  totalPrice: string;
  status: 'Pending' | 'Confirmed' | 'Paid' | 'Shipped';
  date: string;
}

// Mock data for demonstration
const mockPreOrders: PreOrder[] = [
  {
    id: 1,
    productId: 1,
    customerName: 'John Doe',
    customerPhone: '+62812345678',
    quantity: 1,
    totalPrice: 'Rp 375.000',
    status: 'Confirmed',
    date: '2026-05-15',
  },
  {
    id: 2,
    productId: 2,
    customerName: 'Jane Smith',
    customerPhone: '+62823456789',
    quantity: 2,
    totalPrice: 'Rp 780.000',
    status: 'Paid',
    date: '2026-05-16',
  },
  {
    id: 3,
    productId: 3,
    customerName: 'Collector X',
    customerPhone: '+62834567890',
    quantity: 1,
    totalPrice: 'Rp 250.000',
    status: 'Pending',
    date: '2026-05-17',
  },
];

export default function AdminPreOrders() {
  const [preOrders, setPreOrders] = useState<PreOrder[]>(mockPreOrders);

  const handleStatusUpdate = (id: number, newStatus: PreOrder['status']) => {
    setPreOrders(
      preOrders.map(po =>
        po.id === id ? { ...po, status: newStatus } : po
      )
    );
  };

  const getProductName = (productId: number) => {
    return PRODUCTS.find(p => p.id === productId)?.name || 'Unknown Product';
  };

  const statusConfig = {
    'Pending': 'bg-yellow-500/20 text-yellow-500',
    'Confirmed': 'bg-blue-500/20 text-blue-500',
    'Paid': 'bg-green-500/20 text-green-500',
    'Shipped': 'bg-purple-500/20 text-purple-500',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Pre-Orders</h1>
        <p className="text-muted-foreground">Track and manage customer pre-orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-secondary border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground mb-2">Total Pre-Orders</p>
          <p className="text-3xl font-bold text-primary">{preOrders.length}</p>
        </div>
        <div className="bg-secondary border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground mb-2">Pending</p>
          <p className="text-3xl font-bold text-yellow-500">
            {preOrders.filter(p => p.status === 'Pending').length}
          </p>
        </div>
        <div className="bg-secondary border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground mb-2">Confirmed</p>
          <p className="text-3xl font-bold text-blue-500">
            {preOrders.filter(p => p.status === 'Confirmed').length}
          </p>
        </div>
        <div className="bg-secondary border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground mb-2">Shipped</p>
          <p className="text-3xl font-bold text-purple-500">
            {preOrders.filter(p => p.status === 'Shipped').length}
          </p>
        </div>
      </div>

      {/* Pre-Orders Table */}
      <div className="bg-secondary border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-background border-b border-border">
            <tr>
              <th className="text-left py-4 px-6 font-semibold">Customer</th>
              <th className="text-left py-4 px-6 font-semibold">Product</th>
              <th className="text-left py-4 px-6 font-semibold">Qty</th>
              <th className="text-left py-4 px-6 font-semibold">Total</th>
              <th className="text-left py-4 px-6 font-semibold">Status</th>
              <th className="text-left py-4 px-6 font-semibold">Date</th>
              <th className="text-left py-4 px-6 font-semibold">Contact</th>
              <th className="text-left py-4 px-6 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {preOrders.map((preOrder) => (
              <tr key={preOrder.id} className="border-b border-border/50 hover:bg-background/50 transition">
                <td className="py-4 px-6">{preOrder.customerName}</td>
                <td className="py-4 px-6 text-sm">
                  {getProductName(preOrder.productId)}
                </td>
                <td className="py-4 px-6">{preOrder.quantity}</td>
                <td className="py-4 px-6 text-primary font-semibold">{preOrder.totalPrice}</td>
                <td className="py-4 px-6">
                  <select
                    value={preOrder.status}
                    onChange={(e) => handleStatusUpdate(preOrder.id, e.target.value as PreOrder['status'])}
                    className={`px-3 py-1 rounded text-xs font-semibold bg-background border border-border focus:outline-none focus:border-primary cursor-pointer ${statusConfig[preOrder.status]}`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Paid">Paid</option>
                    <option value="Shipped">Shipped</option>
                  </select>
                </td>
                <td className="py-4 px-6 text-xs text-muted-foreground">{preOrder.date}</td>
                <td className="py-4 px-6">
                  <a
                    href={`https://wa.me/${preOrder.customerPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    WhatsApp
                  </a>
                </td>
                <td className="py-4 px-6">
                  <button className="px-3 py-1 bg-primary/20 text-primary rounded text-xs hover:bg-primary/30 transition">
                    View
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

import { useState } from 'react';
