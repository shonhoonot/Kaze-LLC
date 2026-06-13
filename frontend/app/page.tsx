"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Api } from "@/lib/api";
import type { BoxFill, Category, Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import BoxFillBar from "@/components/BoxFillBar";

const BRANDS = ["Uniqlo", "GU", "Amazon JP", "Anker", "Sony"];

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [fill, setFill] = useState<BoxFill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      Api.categories(),
      Api.products("page=1&page_size=8"),
      Api.boxFill(),
    ])
      .then(([cats, list, bf]) => {
        setCategories(cats);
        setProducts(list.items);
        setFill(bf);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-line bg-[#FAFAFA]">
        <div className="container-app grid items-center gap-8 py-14 md:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-accent-light px-3 py-1 text-xs font-medium text-accent-dark">
              Японоос Монгол руу
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
              Япон бараагаа гэрээсээ захиал
            </h1>
            <p className="mt-4 max-w-md text-muted">
              Amazon Japan, Uniqlo, GU болон бусад Япон дэлгүүрийн жинхэнэ бараа.
              Бид Японоос худалдан авч, савлаж, далайн каргоор Монголд хүргэнэ.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/category/clothing" className="btn-primary">Бараа үзэх</Link>
              <Link href="/how-it-works" className="btn-outline">Хэрхэн ажилладаг вэ?</Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted">
              <span>✓ Жинхэнэ Япон бараа</span>
              <span>✓ Ил тод үнэ</span>
              <span>✓ Захиалгын дугаар хөтлөлт</span>
            </div>
          </div>
          <div>{fill && <BoxFillBar fill={fill} />}</div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-app py-12">
        <h2 className="mb-5 text-xl font-bold">Ангилал</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="card flex flex-col items-center justify-center gap-2 p-6 text-center hover:border-ink"
            >
              <span className="text-2xl">{iconFor(c.slug)}</span>
              <span className="text-sm font-medium">{c.name_mn}</span>
              <span className="text-xs text-muted">{c.name_ja}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section className="container-app py-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Шинээр ирсэн</h2>
          <Link href="/category/clothing" className="text-sm text-accent">Бүгдийг үзэх →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-line" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Featured brands */}
      <section className="container-app py-12">
        <h2 className="mb-5 text-xl font-bold">Онцлох брэндүүд</h2>
        <div className="flex flex-wrap gap-3">
          {BRANDS.map((b) => (
            <Link
              key={b}
              href={`/category/clothing?brand=${encodeURIComponent(b)}`}
              className="rounded-full border border-line px-5 py-2 text-sm hover:border-ink"
            >
              {b}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function iconFor(slug: string): string {
  const map: Record<string, string> = {
    clothing: "👕",
    beauty: "🧴",
    electronics: "🎧",
  };
  return map[slug] || "📦";
}
