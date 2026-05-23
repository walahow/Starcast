'use client';

import { use, useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { orderApi, ApiOrder } from "@/lib/api";
import { Loader2, Receipt, MapPin, Calendar, CreditCard, Package, Star, MessageSquare, AlertCircle } from "lucide-react";

export default function OrderInvoice({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = parseInt(resolvedParams.id);

  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Review states
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeReviewProductId, setActiveReviewProductId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState("");

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await orderApi.get(orderId);
      setOrder(data);

      // Load existing reviews
      const existingReviews = await orderApi.getReviews(orderId);
      setReviews(existingReviews);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load order invoice details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    } else if (isAuthenticated) {
      fetchOrderDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading, orderId]);

  const formatPrice = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCreateReview = async (productId: number) => {
    setReviewLoading(true);
    setReviewError("");
    setReviewSuccessMsg("");
    try {
      await orderApi.createReview(orderId, {
        product_id: productId,
        rating,
        comment: comment.trim() || undefined,
      });

      // Reload reviews
      const updated = await orderApi.getReviews(orderId);
      setReviews(updated);

      setReviewSuccessMsg("Review submitted successfully. Thank you for your feedback!");
      setComment("");
      setActiveReviewProductId(null);
    } catch (err: any) {
      setReviewError(err.response?.data?.error || "Failed to submit review.");
    } finally {
      setReviewLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="w-12 h-12 mx-auto text-red-400" />
          <h2 className="text-2xl font-bold font-serif text-foreground">Invoice Not Found</h2>
          <p className="text-muted-foreground text-sm">{error || "This order details could not be loaded."}</p>
          <Link href="/orders" className="inline-block px-6 py-3 bg-primary text-background font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-primary/95 transition duration-300">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <header className="border-b border-border bg-secondary/20 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/orders" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-xs uppercase font-bold tracking-widest transition duration-300">
            ← Back to Orders
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 group">
            <span className="text-2xl font-bold tracking-widest font-serif text-foreground">STARCAST</span>
            <div className="w-1.5 h-1.5 bg-primary rounded-full group-hover:scale-150 transition-transform" />
          </Link>
          <span className="text-xs uppercase font-mono text-primary font-bold">Official Invoice</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-8 animate-fade-in-up">
        {/* Invoice Header */}
        <div className="bg-secondary/20 border border-border/80 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative shadow-xl">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Receipt className="w-5 h-5 text-primary" />
              <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Log Code</span>
            </div>
            <h1 className="text-2xl font-bold font-serif text-foreground">{order.order_code}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(order.ordered_at)}</span>
            </div>
          </div>

          <div className="md:text-right space-y-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Order Status</p>
            <span className={`inline-block px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${
              order.order_status === "paid" ? "bg-green-500/10 border-green-500/20 text-green-500" :
              order.order_status === "pending" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" :
              "bg-secondary border-border text-foreground"
            }`}>
              {order.order_status}
            </span>
          </div>
        </div>

        {/* Purchase breakdown */}
        <div className="bg-secondary/10 border border-border/80 rounded-2xl p-6 md:p-8 space-y-6">
          <h2 className="text-xl font-bold font-serif text-foreground border-b border-border/40 pb-4">Ordered Collectibles</h2>

          <div className="divide-y divide-border/40">
            {order.items.map((item) => {
              const hasReview = reviews.some((r) => r.product_id === item.product_id);
              return (
                <div key={item.product_id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground font-serif">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.qty}x at {formatPrice(item.price)}
                    </p>
                    {item.eta_po && (
                      <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">
                        PO ETA: {item.eta_po}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <p className="text-base font-bold text-foreground font-serif">{formatPrice(item.price * item.qty)}</p>

                    {/* Review option */}
                    {order.order_status.toLowerCase() === "done" && (
                      <div className="flex-shrink-0">
                        {hasReview ? (
                          <span className="text-[10px] uppercase tracking-wider text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                            <Star className="w-3 h-3 fill-green-400" /> Reviewed
                          </span>
                        ) : activeReviewProductId === item.product_id ? (
                          <button
                            onClick={() => setActiveReviewProductId(null)}
                            className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground font-bold border border-border px-3 py-1.5 rounded-full"
                          >
                            Cancel
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveReviewProductId(item.product_id);
                              setRating(5);
                              setComment("");
                              setReviewError("");
                              setReviewSuccessMsg("");
                            }}
                            className="text-[10px] uppercase tracking-wider text-primary hover:bg-primary hover:text-background font-bold border border-primary px-3 py-1.5 rounded-full transition duration-300"
                          >
                            Add Review
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Rating expansion form */}
                  {activeReviewProductId === item.product_id && (
                    <div className="w-full mt-4 bg-secondary/30 border border-border/80 rounded-xl p-4 space-y-4 animate-fade-in-up">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-2">Score:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="text-primary hover:scale-110 transition cursor-pointer"
                          >
                            <Star className={`w-5 h-5 ${star <= rating ? "fill-primary text-primary" : "text-muted"}`} />
                          </button>
                        ))}
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Comments</label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={2}
                          placeholder="Your comments on the diecast detail, paint finish, premium packaging..."
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none"
                        />
                      </div>

                      {reviewError && <p className="text-xs text-red-400">{reviewError}</p>}

                      <button
                        onClick={() => handleCreateReview(item.product_id)}
                        disabled={reviewLoading}
                        className="flex items-center gap-1.5 bg-primary text-background text-xs uppercase font-bold tracking-widest px-4 py-2.5 rounded-lg hover:bg-primary/95 transition duration-300 cursor-pointer"
                      >
                        {reviewLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                        Submit Review
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {reviewSuccessMsg && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl px-4 py-3">
              {reviewSuccessMsg}
            </div>
          )}

          {/* Pricing summary */}
          <div className="border-t border-border/40 pt-6 space-y-3.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground font-semibold">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping Cost ({order.courier || "Standard Delivery"})</span>
              <span className="text-foreground font-semibold">{formatPrice(order.shipping_cost)}</span>
            </div>
            <div className="border-t border-border/40 pt-4 flex justify-between items-center">
              <span className="font-bold text-foreground font-serif text-lg">Grand Total</span>
              <span className="text-2xl font-bold text-primary font-serif">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping & Payment summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shipping Summary */}
          <div className="bg-secondary/10 border border-border/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm uppercase font-bold tracking-wider text-muted-foreground border-b border-border/30 pb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Shipping Destination
            </h3>
            <p className="text-sm text-foreground leading-relaxed">{order.shipping_address}</p>

            {order.shipping?.tracking_number && (
              <div className="bg-secondary/40 border border-border/60 p-4 rounded-xl space-y-2 mt-4">
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Courier tracking number</p>
                <p className="text-sm font-semibold text-primary font-mono">{order.shipping.tracking_number}</p>
                <p className="text-xs text-muted-foreground">
                  Status: <span className="font-semibold text-foreground uppercase">{order.shipping.ship_status}</span>
                </p>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="bg-secondary/10 border border-border/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm uppercase font-bold tracking-wider text-muted-foreground border-b border-border/30 pb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Payment Method
            </h3>
            <div className="space-y-3.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gateway</span>
                <span className="text-foreground font-medium">Midtrans Snap</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Status</span>
                <span className={`font-bold uppercase tracking-wider text-xs ${
                  order.payment_status?.toLowerCase() === "success" ? "text-green-400" :
                  order.payment_status?.toLowerCase() === "pending" ? "text-yellow-500" : "text-red-400"
                }`}>
                  {order.payment_status || "Unpaid"}
                </span>
              </div>
              {order.transaction_id && (
                <div className="border-t border-border/30 pt-3.5">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Transaction ID</p>
                  <p className="text-xs text-foreground truncate font-mono">{order.transaction_id}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
