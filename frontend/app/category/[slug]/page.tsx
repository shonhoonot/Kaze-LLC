"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Api } from "@/lib/api";
import type { Category, Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const search = useSearchParams();
  const initialBrand = search.get("brand") || "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState(initialBrand);
  const [q, setQ] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("new");

  const slug = params.slug;
  const category = categories.find((c) => c.slug === slug);

  useEffect(() => {
    Api.categories().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ category: slug, page: "1", page_size: "48", sort });
    if (brand) qs.set("brand", brand);
    if (q) qs.set("q", q);
    if (maxPrice) qs.set("max_price_jpy", maxPrice);
    Api.products(qs.toString())
      .then((list) => setProducts(list.items))
      .finally(() => setLoading(false));
  }, [slug, brand, q, maxPrice, sort]);

  const brands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean))) as string[];

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold">{category?.name_mn || "Бараа"}</h1>
      {category?.name_ja && <p className="text-sm text-muted">{category.name_ja}</p>}

      {/* filters */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="Хайх..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input max-w-[180px]" value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="">Бүх брэнд</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
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

      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-line" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-muted">Бараа олдсонгүй.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
