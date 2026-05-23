'use client';

import { ReactNode } from "react";
import { AuthProvider } from "@/lib/context/AuthContext";
import { CartProvider } from "@/lib/context/CartContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </AuthProvider>
  );
}
