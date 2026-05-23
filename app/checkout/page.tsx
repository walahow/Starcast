'use client';

import { useEffect, useState } from "react";
import { useCart } from "@/lib/context/CartContext";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { orderApi, paymentApi, shippingApi, ShippingResult } from "@/lib/api";
import QuantumRouteMap from "@/components/QuantumRouteMap";
import { ShoppingCart, Trash2, MapPin, CreditCard, ArrowLeft, Package, Loader2, Info } from "lucide-react";
import Script from "next/script";

export default function Checkout() {
  const { items, total, count, removeFromCart, updateQty, clearCart } = useCart();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<"cart" | "shipping" | "payment">("cart");
  const [address, setAddress] = useState("");
  const [shippingResult, setShippingResult] = useState<ShippingResult | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success" | "pending" | "error">("idle");

  // Load user address once authenticated
  useEffect(() => {
    if (user?.address && !address) {
      setAddress(user.address);
    }
  }, [user, address]);

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  const formatPrice = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  // Calculate shipping
  const handleCalculateShipping = async () => {
    if (!address.trim()) {
      setShippingError("Please enter your delivery address.");
      return;
    }
    setShippingLoading(true);
    setShippingError("");
    try {
      const result = await shippingApi.calculate({ address: address.trim() });
      setShippingResult(result);
    } catch (err: any) {
      setShippingError(err.response?.data?.error || "Failed to calculate shipping distance.");
    } finally {
      setShippingLoading(false);
    }
  };

  // Process payment
  const refreshPaymentStatus = async (orderCode: string) => {
    try {
      const payment = await paymentApi.getStatus(orderCode);
      if (payment.order_status === "paid") {
        setPaymentStatus("success");
      } else if (payment.payment_status === "pending") {
        setPaymentStatus("pending");
      }
    } catch (err) {
      console.error("Failed to refresh payment status:", err);
    }
  };

  const handlePayment = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (items.length === 0) {
      setPaymentError("Your cart is empty.");
      return;
    }
    if (!address.trim()) {
      setPaymentError("Please enter a shipping address.");
      return;
    }

    setPaymentLoading(true);
    setPaymentError("");
    try {
      const orderData = {
        items: items.map((i) => ({ product_id: i.product.id, qty: i.qty })),
        shipping_address: address.trim(),
        courier: "JNE",
        shipping_cost: shippingResult?.estimated_cost || 0,
      };

      const result = await orderApi.create(orderData);

      if (!result.order?.order_code) {
        throw new Error("No order code received from server.");
      }

      // Check if Midtrans Snap.js is loaded
      if (!(window as any).snap) {
        setPaymentError("Payment gateway is not ready. Please refresh the page and try again.");
        setPaymentLoading(false);
        return;
      }

      if (result.snap_token) {
        (window as any).snap.pay(result.snap_token, {
          onSuccess: async () => {
            if (result.order?.order_code) {
              await refreshPaymentStatus(result.order.order_code);
            }
            clearCart();
            router.push("/orders");
          },
          onPending: async () => {
            if (result.order?.order_code) {
              await refreshPaymentStatus(result.order.order_code);
            }
            clearCart();
            router.push("/orders");
          },
          onError: (err: any) => {
            const message = err?.message || "There was an error in transaction.";
            setPaymentError(`Payment failed: ${message}`);
            setPaymentLoading(false);
          },
          onClose: () => {
            setPaymentLoading(false);
          },
        });
      } else {
        setPaymentError("Snap token was not returned from the API.");
        setPaymentLoading(false);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Failed to place order. Please try again.";
      setPaymentError(msg);
      setPaymentLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  // Empty cart state
  if (items.length === 0 && paymentStatus === "idle") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-transparent pointer-events-none" />
        <div className="text-center space-y-5 max-w-sm z-10 animate-fade-in-up">
          <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground opacity-30" />
          <h2 className="text-3xl font-bold font-serif text-foreground">
            Your Cart is Empty
          </h2>
          <p className="text-muted-foreground text-sm">
            Select premium 1:64 scale diecast models from our collection showcase before initiating checkout.
          </p>
          <Link href="/" className="inline-block px-8 py-4 bg-primary text-background font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:-translate-y-0.5 transition duration-300 cursor-pointer">
            Explore Collection
          </Link>
        </div>
      </div>
    );
  }

  // Payment success state
  if (paymentStatus === "success" || paymentStatus === "pending") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 relative">
        <div className="text-center space-y-6 max-w-md animate-fade-in-up">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${paymentStatus === "success" ? "bg-green-500/10 border border-green-500/20" : "bg-yellow-500/10 border border-yellow-500/20"}`}>
            <Package className={`w-10 h-10 ${paymentStatus === "success" ? "text-green-500 animate-bounce" : "text-yellow-500"}`} />
          </div>
          <h2 className="text-4xl font-bold font-serif text-foreground">
            {paymentStatus === "success" ? "Order Confirmed" : "Order Awaiting Payment"}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {paymentStatus === "success"
              ? "Payment verified. Your premium collectibles order is being processed for shipping. Track it in your collector logs."
              : "Your payment token is initialized. Please complete the transaction using the Midtrans interface."}
          </p>
          <Link href="/orders" className="inline-block px-8 py-4 bg-primary text-background font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-primary/90 transition duration-300 cursor-pointer">
            View My Orders
          </Link>
        </div>
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
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 group">
            <span className="text-2xl font-bold tracking-widest font-serif text-foreground">STARCAST</span>
            <div className="w-1.5 h-1.5 bg-primary rounded-full group-hover:scale-150 transition-transform" />
          </Link>
          <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">{count} items</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {["Review Cart", "Shipping", "Confirmation"].map((label, i) => {
            const stepIdx = ["cart", "shipping", "payment"].indexOf(step);
            const isActive = i === stepIdx;
            const isDone = i < stepIdx;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                  isActive
                    ? "bg-primary text-background border-primary shadow-[0_0_12px_rgba(212,175,55,0.4)]"
                    : isDone
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "bg-secondary/40 text-muted-foreground border-border"
                }`}>
                  {isDone ? "✓" : i + 1}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest hidden sm:block ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {label}
                </span>
                {i < 2 && <div className={`w-8 h-px ${isDone ? "bg-primary" : "bg-border"}`} />}
              </div>
            );
          })}
        </div>

        {/* Step: Cart */}
        {step === "cart" && (
          <div className="space-y-8 animate-fade-in-up">
            <h2 className="text-3xl font-bold font-serif text-foreground mb-6">
              Shopping Cart
            </h2>

            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="bg-secondary/20 border border-border/80 rounded-2xl p-5 flex items-center gap-6 relative">
                  <div className="w-20 h-20 bg-background border border-border rounded-xl overflow-hidden flex-shrink-0 relative">
                    {item.product.image_url ? (
                      <img src={item.product.image_url} alt={item.product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">NO IMAGE</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-foreground truncate font-serif">{item.product.title}</h3>
                    <p className="text-primary text-[10px] font-bold uppercase tracking-wider mt-0.5">{item.product.scale || "1:64"}</p>
                    <p className="text-foreground font-bold text-sm mt-1.5">{formatPrice(item.product.price)}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-2 py-1">
                    <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="w-8 h-8 text-muted-foreground hover:text-foreground transition duration-300 font-bold cursor-pointer">−</button>
                    <span className="text-sm font-semibold w-6 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="w-8 h-8 text-muted-foreground hover:text-foreground transition duration-300 font-bold cursor-pointer">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-500 transition duration-300 p-2.5 cursor-pointer">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-secondary/40 border border-border/80 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({count} items)</span>
                <span className="text-foreground font-semibold">{formatPrice(total)}</span>
              </div>
              <div className="border-t border-border/60 pt-4 flex justify-between">
                <span className="font-bold text-foreground font-serif text-lg">Total</span>
                <span className="text-2xl font-bold text-primary font-serif">{formatPrice(total)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (!isAuthenticated) { router.push("/login"); return; }
                setStep("shipping");
              }}
              className="w-full flex items-center justify-center gap-3 bg-primary text-background font-bold py-4.5 rounded-xl uppercase tracking-widest text-xs hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:-translate-y-0.5 transition duration-300 cursor-pointer"
            >
              <MapPin className="w-4 h-4" /> Proceed to Shipping
            </button>
          </div>
        )}

        {/* Step: Shipping */}
        {step === "shipping" && (
          <div className="space-y-8 animate-fade-in-up">
            <h2 className="text-3xl font-bold font-serif text-foreground mb-6">
              Delivery Information
            </h2>

            <div className="space-y-6">
              <div className="space-y-2.5">
                <label htmlFor="checkout-address" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Complete Shipping Address
                </label>
                <textarea
                  id="checkout-address"
                  value={address}
                  onChange={(e) => { setAddress(e.target.value); setShippingResult(null); setShippingError(""); }}
                  rows={4}
                  placeholder="e.g. Apartment Suite B2, Jl. Sudirman No. 12, Kebayoran Baru, Jakarta Selatan"
                  className="w-full px-4 py-3.5 bg-secondary/30 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition duration-300 resize-none"
                />
                <div className="flex gap-2 text-xs text-muted-foreground mt-2 bg-secondary/20 p-3 rounded-lg border border-border/40">
                  <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Please provide a complete street name, house number, and city for accurate geocoded cost calculations.</span>
                </div>
              </div>

              <button
                onClick={handleCalculateShipping}
                disabled={shippingLoading || !address.trim()}
                className="w-full flex items-center justify-center gap-2 border border-primary text-primary hover:bg-primary hover:text-background py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] transition duration-300 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <MapPin className="w-4 h-4" />
                {shippingLoading ? "Calculating Route Map..." : "Calculate Shipping Fee"}
              </button>

              {shippingError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                  {shippingError}
                </div>
              )}

              {/* Quantum Route Map */}
              {shippingResult && (
                <div className="space-y-6">
                  <QuantumRouteMap
                    seller={shippingResult.seller}
                    buyer={shippingResult.buyer}
                    routeGeometry={shippingResult.route_geometry}
                    distanceKm={shippingResult.distance_km}
                    estimatedCost={shippingResult.estimated_cost}
                    durationText={shippingResult.duration_text}
                  />

                  {/* Summary */}
                  <div className="bg-secondary/40 border border-border/80 rounded-2xl p-6 space-y-4 shadow-xl">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Cost ({shippingResult.distance_km} km)</span>
                      <span className="text-foreground">{formatPrice(shippingResult.estimated_cost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Estimated Arrival</span>
                      <span className="text-primary font-medium">{shippingResult.estimated_arrival_text}</span>
                    </div>
                    <div className="border-t border-border/60 pt-4 flex justify-between">
                      <span className="font-bold text-foreground font-serif text-lg">Grand Total</span>
                      <span className="text-2xl font-bold text-primary font-serif">
                        {formatPrice(total + shippingResult.estimated_cost)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep("payment")}
                    className="w-full flex items-center justify-center gap-3 bg-primary text-background font-bold py-4.5 rounded-xl uppercase tracking-widest text-xs hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:-translate-y-0.5 transition duration-300 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" /> Proceed to Confirmation
                  </button>
                </div>
              )}

              <button onClick={() => setStep("cart")} className="w-full text-center text-xs uppercase font-bold tracking-wider text-muted-foreground hover:text-foreground transition duration-300 py-3 cursor-pointer">
                ← Back to Cart Review
              </button>
            </div>
          </div>
        )}

        {/* Step: Payment */}
        {step === "payment" && (
          <div className="space-y-8 animate-fade-in-up">
            <h2 className="text-3xl font-bold font-serif text-foreground mb-6">
              Order Confirmation
            </h2>

            {/* Order summary */}
            <div className="bg-secondary/20 border border-border/80 rounded-2xl divide-y divide-border/60 shadow-lg">
              {items.map((item) => (
                <div key={item.product.id} className="p-5 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-foreground font-serif">{item.product.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.qty}x {formatPrice(item.product.price)}</p>
                  </div>
                  <p className="text-sm font-bold text-foreground font-serif">{formatPrice(item.product.price * item.qty)}</p>
                </div>
              ))}
              <div className="p-5 flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Cost</span>
                <span className="font-medium text-foreground">{formatPrice(shippingResult?.estimated_cost || 0)}</span>
              </div>
              <div className="p-5 flex justify-between items-center">
                <span className="font-bold text-foreground font-serif text-base">GRAND TOTAL</span>
                <span className="text-3xl font-bold text-primary font-serif">
                  {formatPrice(total + (shippingResult?.estimated_cost || 0))}
                </span>
              </div>
            </div>

            <div className="bg-secondary/40 border border-border/80 rounded-xl p-5">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">Shipping Destination</p>
              <p className="text-sm text-foreground leading-relaxed">{address}</p>
            </div>

            {paymentError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3.5 flex items-start gap-3">
                <Info className="w-5 h-5 flex-shrink-0 text-red-500" />
                <span>{paymentError}</span>
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={paymentLoading}
              className="w-full flex items-center justify-center gap-3 bg-primary text-background font-bold py-5 rounded-xl uppercase tracking-widest text-xs hover:bg-primary/90 hover:shadow-[0_0_25px_rgba(212,175,55,0.35)] hover:-translate-y-0.5 transition duration-300 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {paymentLoading ? "Securing Payment Gateway..." : "Pay Now with Midtrans"}
            </button>

            <p className="text-center text-[10px] text-muted-foreground tracking-wide leading-relaxed">
              Transactions are securely routed and processed via Snap Midtrans Gateway. We do not store financial credentials.
            </p>

            <button onClick={() => setStep("shipping")} className="w-full text-center text-xs uppercase font-bold tracking-wider text-muted-foreground hover:text-foreground transition duration-300 py-3 cursor-pointer">
              ← Back to Shipping
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
