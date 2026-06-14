"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Api, getToken } from "@/lib/api";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/components/WishlistProvider";

export default function WishlistPage() {
  const router = useRouter();
  const { ids } = useWishlist();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login?next=/wishlist");
      return;
    }
    Api.wishlist()
      .then((w) => setItems(w.items))
      .finally(() => setLoading(false));
  }, [router]);

  // keep in sync when items are removed via the heart toggle
  useEffect(() => {
    setItems((prev) => prev.filter((p) => ids.has(p.id)));
  }, [ids]);

  if (loading) return <div className="container-app py-20 text-center text-muted">Ачааллаж байна...</div>;

  return (
    <div className="container-app py-8">
      <h1 className="mb-5 text-2xl font-bold">Хадгалсан бараа</h1>
      {items.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-5xl">♡</div>
          <p className="mt-3 text-muted">Та одоогоор бараа хадгалаагүй байна.</p>
          <Link href="/" className="btn-primary mt-5">Бараа үзэх</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
