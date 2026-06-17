"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { getRecentlyViewed } from "@/lib/recentlyViewed";
import ProductCard from "./ProductCard";

/** Shows the visitor's recently-viewed products (from localStorage). */
export default function RecentlyViewed({ excludeId }: { excludeId?: number }) {
  const [items, setItems] = useState<Product[]>([]);

  // read in an effect to avoid SSR/client hydration mismatch
  useEffect(() => {
    setItems(getRecentlyViewed().filter((p) => p.id !== excludeId));
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section className="container-app py-6">
      <h2 className="mb-5 text-xl font-bold">Сүүлд үзсэн</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
