"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { Api, getToken } from "@/lib/api";
import type { Cart } from "@/lib/types";
import { useAuth } from "@/lib/auth";

interface CartState {
  cart: Cart | null;
  count: number;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setCart(null);
      return;
    }
    try {
      setCart(await Api.cart());
    } catch {
      setCart(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [user, refresh]);

  const count = cart?.lines.reduce((n, l) => n + l.qty, 0) ?? 0;

  return (
    <CartContext.Provider value={{ cart, count, refresh }}>{children}</CartContext.Provider>
  );
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
