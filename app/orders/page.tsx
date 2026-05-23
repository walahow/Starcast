'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { orderApi, ApiOrder } from "@/lib/api";
import { Loader2, Package, Calendar, Clock, Receipt, RefreshCw, CreditCard } from "lucide-react";
import Script from "next/script";

export default function Orders() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payLoadingId, setPayLoadingId] = useState<number | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await orderApi.list();
      setOrders(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load order history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    } else if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, authLoading, router]);

  const formatPrice = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
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

  const handlePayNow = async (orderId: number, orderCode: string) => {
    if (!(window as any).snap) {
      alert("Payment gateway is not ready yet. Please refresh the page and try again.");
      return;
    }
    
    setPayLoadingId(orderId);
    try {
      const result = await orderApi.pay(orderId);
      
      if (result.snap_token) {
        (window as any).snap.pay(result.snap_token, {
          onSuccess: () => {
            fetchOrders();
          },
          onPending: () => {
            fetchOrders();
          },
          onError: (err: any) => {
            alert(`Payment failed: ${err.message || "There was an error processing payment."}`);
          },
          onClose: () => {
            setPayLoadingId(null);
          }
        });
      } else {
        alert("Failed to retrieve payment token.");
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to initialize payment. Please try again.");
    } finally {
      setPayLoadingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Midtrans Snap script */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "Mid-client-NubSk2M8JK6ZeBUo"}
        strategy="lazyOnload"
      />

      {/* Header */}
      <header className="border-b border-border bg-secondary/20 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-xs uppercase font-bold tracking-widest transition duration-300">
            ← Back to Store
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 group">
            <span className="text-2xl font-bold tracking-widest font-serif text-foreground">STARCAST</span>
            <div className="w-1.5 h-1.5 bg-primary rounded-full group-hover:scale-150 transition-transform" />
          </Link>
          <button
            onClick={fetchOrders}
            className="p-2 text-muted-foreground hover:text-foreground transition duration-300 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-2">◆ COLLECTOR PROFILE</p>
            <h1 className="text-4xl font-bold font-serif text-foreground">My Order History</h1>
          </div>
          <span className="text-xs uppercase font-mono bg-secondary/50 border border-border px-3 py-1.5 rounded-full text-muted-foreground">
            {orders.length} Logged Transactions
          </span>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-5 py-4 mb-8">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-secondary/15 border border-border rounded-2xl p-12 text-center space-y-4">
            <Package className="w-12 h-12 mx-auto text-muted-foreground opacity-30" />
            <h3 className="text-xl font-serif font-bold text-foreground">No Orders Found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              You haven't ordered any premium diecast models yet. Explore the showcase to make your first purchase.
            </p>
            <Link href="/" className="inline-block mt-2 px-6 py-3 bg-primary text-background font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-primary/95 transition duration-300">
              View Showcase
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-secondary/10 border border-border/80 rounded-2xl p-6 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(212,175,55,0.03)] transition duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3.5 flex-1 min-w-0">
                  <div className="flex items-center gap-3.5 flex-wrap">
                    <span className="text-sm font-bold font-serif tracking-wide text-foreground">
                      {order.order_code}
                    </span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full border ${getStatusColor(order.order_status)}`}>
                      {order.order_status}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary/80" />
                      <span>{formatDate(order.ordered_at)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary/80" />
                      <span>{order.items.reduce((acc, i) => acc + i.qty, 0)} Items</span>
                    </div>
                  </div>

                  {/* Snippet of products */}
                  <div className="text-xs text-muted-foreground truncate border-t border-border/40 pt-3 flex items-center gap-2">
                    <span className="font-bold text-foreground">Models:</span>
                    <span>{order.items.map((i) => `${i.title} (${i.qty}x)`).join(", ")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 justify-between md:justify-end border-t border-border/40 md:border-t-0 pt-4 md:pt-0">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Grand Total</p>
                    <p className="text-xl font-bold text-primary font-serif">{formatPrice(order.total)}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {order.order_status === "pending" && (
                      <button
                        onClick={() => handlePayNow(order.id, order.order_code)}
                        disabled={payLoadingId === order.id}
                        className="flex items-center gap-2 bg-primary text-background border border-primary px-5 py-3 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-primary/90 hover:shadow-[0_0_12px_rgba(212,175,55,0.2)] transition duration-300 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {payLoadingId === order.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CreditCard className="w-3.5 h-3.5" />
                        )}
                        Pay Now
                      </button>
                    )}
                    <Link
                      href={`/orders/${order.id}/invoice`}
                      className="flex items-center gap-2 border border-border bg-background px-5 py-3 rounded-xl text-xs uppercase font-bold tracking-widest hover:border-primary hover:shadow-[0_0_12px_rgba(212,175,55,0.1)] transition duration-300"
                    >
                      <Receipt className="w-3.5 h-3.5 text-primary" /> Invoice
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
