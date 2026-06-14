"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Api } from "@/lib/api";
import type { Category, Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";

const PAGE_SIZE = 24;

function SearchInner() {
  const router = useRouter();
  const search = useSearchParams();
  const initialQ = search.get("q") || "";

  const [q, setQ] = useState(initialQ);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("new");
  const [maxPrice, setMaxPrice] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Api.categories().then(setCategories);
  }, []);

  const fetchPage = useCallback(
    async (targetPage: number, append: boolean) => {
      setLoading(true);
      const qs = new URLSearchParams({ page: String(targetPage), page_size: String(PAGE_SIZE), sort });
      if (q.trim()) qs.set("q", q.trim());
      if (category) qs.set("category", category);
      if (maxPrice) qs.set("max_price_jpy", maxPrice);
      try {
        const list = await Api.products(qs.toString());
        setTotal(list.total);
        setProducts((prev) => (append ? [...prev, ...list.items] : list.items));
      } finally {
        setLoading(false);
      }
    },
    [q, category, sort, maxPrice]
  );

  // Debounce query/filter changes -> reset to page 1.
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchPage(1, false);
      // keep the URL shareable
      const url = q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/search";
      router.replace(url);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category, sort, maxPrice]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchPage(next, true);
  }

  const hasMore = products.length < total;

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold">Хайлт</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          className="input max-w-sm flex-1"
          placeholder="Бараа, брэнд хайх..."
          value={q}
          autoFocus
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input max-w-[180px]" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Бүх ангилал</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name_mn}</option>
          ))}
        </select>
        <select className="input max-w-[200px]" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
          <option value="">Бүх үнэ</option>
          <option value="1000">¥1,000 хүртэл</option>
          <option value="3000">¥3,000 хүртэл</option>
          <option value="8000">¥8,000 хүртэл</option>
        </select>
        <select className="input max-w-[180px]" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="new">Шинэ нь эхэндээ</option>
          <option value="price_asc">Үнэ: бага → их</option>
          <option value="price_desc">Үнэ: их → бага</option>
        </select>
      </div>

      <p className="mt-4 text-sm text-muted">{total} бараа олдлоо</p>

      <div className="mt-4">
        {products.length === 0 && !loading ? (
          <div className="py-20 text-center text-muted">
            {q.trim() ? `"${q.trim()}" гэсэн хайлтад бараа олдсонгүй.` : "Хайх үгээ оруулна уу."}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <button className="btn-outline px-6 py-2.5" onClick={loadMore} disabled={loading}>
            {loading ? "Ачааллаж байна..." : "Цааш үзэх"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-app py-20 text-center text-muted">Ачааллаж байна...</div>}>
      <SearchInner />
    </Suspense>
  );
}
