"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { Api, getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface WishlistState {
  ids: Set<number>;
  has: (id: number) => boolean;
  toggle: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistState | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<number>>(new Set());

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setIds(new Set());
      return;
    }
    try {
      const w = await Api.wishlist();
      setIds(new Set(w.product_ids));
    } catch {
      setIds(new Set());
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [user, refresh]);

  const has = (id: number) => ids.has(id);

  const toggle = useCallback(
    async (id: number) => {
      if (!getToken()) {
        window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
        return;
      }
      const next = new Set(ids);
      const adding = !next.has(id);
      // optimistic update
      if (adding) next.add(id);
      else next.delete(id);
      setIds(next);
      try {
        const w = adding ? await Api.addWishlist(id) : await Api.removeWishlist(id);
        setIds(new Set(w.product_ids));
      } catch {
        refresh();
      }
    },
    [ids, refresh]
  );

  return (
    <WishlistContext.Provider value={{ ids, has, toggle, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistState {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
