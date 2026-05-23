'use client';

import { createContext, useContext, useReducer, ReactNode, useEffect } from "react";
import { ApiProduct } from "@/lib/api";
import { useAuth } from "@/lib/context/AuthContext";

export interface CartItem {
  product: ApiProduct;
  qty: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  count: number;
}

type CartAction =
  | { type: "ADD"; product: ApiProduct; qty: number }
  | { type: "REMOVE"; productId: number }
  | { type: "UPDATE_QTY"; productId: number; qty: number }
  | { type: "CLEAR" }
  | { type: "LOAD"; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  let items: CartItem[];

  switch (action.type) {
    case "ADD": {
      const existing = state.items.find((i) => i.product.id === action.product.id);
      if (existing) {
        items = state.items.map((i) =>
          i.product.id === action.product.id ? { ...i, qty: i.qty + action.qty } : i
        );
      } else {
        items = [...state.items, { product: action.product, qty: action.qty }];
      }
      break;
    }
    case "REMOVE":
      items = state.items.filter((i) => i.product.id !== action.productId);
      break;
    case "UPDATE_QTY":
      items = state.items.map((i) =>
        i.product.id === action.productId ? { ...i, qty: Math.max(1, action.qty) } : i
      );
      break;
    case "CLEAR":
      items = [];
      break;
    case "LOAD":
      items = action.items;
      break;
    default:
      return state;
  }

  const total = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);
  return { items, total, count };
}

interface CartContextType extends CartState {
  addToCart: (product: ApiProduct, qty?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQty: (productId: number, qty: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0, count: 0 });

  const getCartKey = () => {
    if (user?.id) {
      return `starcast_cart_user_${user.id}`;
    }
    return "starcast_cart_guest";
  };

  // Restore cart from localStorage when auth state changes
  useEffect(() => {
    try {
      const key = getCartKey();
      const saved = localStorage.getItem(key);
      if (saved) {
        const items: CartItem[] = JSON.parse(saved);
        dispatch({ type: "LOAD", items });
      } else {
        dispatch({ type: "CLEAR" });
      }
    } catch {
      dispatch({ type: "CLEAR" });
    }
  }, [token, user?.id]);

  // Persist cart to localStorage per authenticated user or guest session
  useEffect(() => {
    try {
      localStorage.setItem(getCartKey(), JSON.stringify(state.items));
    } catch {}
  }, [state.items, token, user?.id]);

  const addToCart = (product: ApiProduct, qty = 1) => dispatch({ type: "ADD", product, qty });
  const removeFromCart = (productId: number) => dispatch({ type: "REMOVE", productId });
  const updateQty = (productId: number, qty: number) => dispatch({ type: "UPDATE_QTY", productId, qty });
  const clearCart = () => {
    const key = getCartKey();
    try {
      localStorage.removeItem(key);
    } catch {}
    dispatch({ type: "CLEAR" });
  };

  return (
    <CartContext.Provider value={{ ...state, addToCart, removeFromCart, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
