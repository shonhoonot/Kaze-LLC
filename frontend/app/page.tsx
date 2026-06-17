"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Api } from "@/lib/api";
import type { BoxFill, Category, Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import BoxFillBar from "@/components/BoxFillBar";
import RecentlyViewed from "@/components/RecentlyViewed";

const BRANDS = ["Uniqlo", "GU", "Amazon JP", "Anker", "Sony"];

const STEPS = [
  { icon: "🔗", title: "Захиал", text: "Каталогоос сонгох эсвэл Япон линкээ илгээ." },
  { icon: "🛍️", title: "Бид авна", text: "Японд худалдан авч, агуулахдаа савлана." },
  { icon: "🚢", title: "Хүргэнэ", text: "Далайн каргоор Монголд хүргэж өгнө." },
];

export default function HomePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [topRated, setTopRated] = useState<Product[]>([]);
  const [fill, setFill] = useState<BoxFill | null>(null);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState("");

  useEffect(() => {
    Promise.all([
      Api.categories(),
      Api.products("page=1&page_size=8"),
      Api.products("page=1&page_size=4&sort=rating"),
      Api.boxFill(),
    ])
      .then(([cats, list, rated, bf]) => {
        setCategories(cats);
        setProducts(list.items);
        setTopRated(rated.items.filter((p) => p.review_count > 0));
        setFill(bf);
      })
      .finally(() => setLoading(false));
  }, []);

  function search(e: React.FormEvent) {
    e.preventDefault();
    router.push(term.trim() ? `/search?q=${encodeURIComponent(term.trim())}` : "/search");
  }

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
            <form onSubmit={search} className="mt-6 flex max-w-md gap-2">
              <input
                className="input flex-1"
                placeholder="Бараа, брэнд хайх..."
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              />
              <button type="submit" className="btn-primary shrink-0">Хайх</button>
            </form>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/category/clothing" className="btn-outline">Бараа үзэх</Link>
              <Link href="/request" className="btn-outline">Линкээр захиалах</Link>
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

      {/* How it works */}
      <section className="border-b border-line">
        <div className="container-app grid gap-4 py-8 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex items-start gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <div className="text-sm font-semibold">{i + 1}. {s.title}</div>
                <div className="text-xs text-muted">{s.text}</div>
              </div>
            </div>
          ))}
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
          <Link href="/search" className="text-sm text-accent">Бүгдийг үзэх →</Link>
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

      {/* Top rated */}
      {topRated.length > 0 && (
        <section className="container-app py-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold">⭐ Шилдэг үнэлгээтэй</h2>
            <Link href="/search" className="text-sm text-accent">Цааш →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {topRated.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Recently viewed */}
      <RecentlyViewed />

      {/* Custom request banner */}
      <section className="container-app py-12">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-ink p-8 text-white sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold">Хайж буй бараагаа олсонгүй юу?</h2>
            <p className="mt-1 text-sm text-white/70">
              Япон сайтын холбоосоо илгээ — бид үнийг тооцоолж, танд авч өгнө.
            </p>
          </div>
          <Link href="/request" className="shrink-0 rounded-full bg-white px-6 py-3 text-sm font-medium text-ink hover:bg-white/90">
            Захиалгат бараа илгээх
          </Link>
        </div>
      </section>

      {/* Featured brands */}
      <section className="container-app pb-12">
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
