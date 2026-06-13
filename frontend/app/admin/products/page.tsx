"use client";

import { useEffect, useState } from "react";
import { Api, AdminApi } from "@/lib/api";
import type { Category, Product } from "@/lib/types";
import { jpy } from "@/lib/format";

const EMPTY = {
  title_mn: "",
  title_ja: "",
  brand: "",
  source: "amazon_jp",
  source_url: "",
  category_id: "",
  base_price_jpy: "",
  weight_grams: "500",
  image_url: "",
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  async function load() {
    const [list, cats] = await Promise.all([Api.products("page=1&page_size=100"), Api.categories()]);
    setProducts(list.items);
    setCategories(cats);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setSaving(true);
    try {
      await AdminApi.createProduct({
        title_mn: form.title_mn,
        title_ja: form.title_ja || null,
        brand: form.brand || null,
        source: form.source,
        source_url: form.source_url || null,
        category_id: form.category_id ? Number(form.category_id) : null,
        base_price_jpy: Number(form.base_price_jpy),
        weight_grams: Number(form.weight_grams),
        images: form.image_url ? [{ url: form.image_url, sort_order: 0 }] : [],
      });
      setForm({ ...EMPTY });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    await AdminApi.deleteProduct(id);
    await load();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* add form */}
      <div className="lg:col-span-1">
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Бараа нэмэх</h2>
          <p className="mb-3 text-xs text-muted">
            Amazon JP / Uniqlo / GU холбоосыг буулгаад гар аргаар нэр, үнэ, жин, зургаа оруулна.
          </p>
          <div className="space-y-2">
            <input className="input" placeholder="Гарчиг (MN)" value={form.title_mn} onChange={(e) => setForm({ ...form, title_mn: e.target.value })} />
            <input className="input" placeholder="Гарчиг (JA)" value={form.title_ja} onChange={(e) => setForm({ ...form, title_ja: e.target.value })} />
            <input className="input" placeholder="Брэнд" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <select className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              <option value="amazon_jp">Amazon JP</option>
              <option value="uniqlo">Uniqlo</option>
              <option value="gu">GU</option>
              <option value="other">Бусад</option>
            </select>
            <input className="input" placeholder="Эх сурвалжийн холбоос" value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} />
            <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Ангилал сонгох</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name_mn}</option>
              ))}
            </select>
            <input className="input" type="number" placeholder="Үнэ (JPY)" value={form.base_price_jpy} onChange={(e) => setForm({ ...form, base_price_jpy: e.target.value })} />
            <input className="input" type="number" placeholder="Жин (грамм)" value={form.weight_grams} onChange={(e) => setForm({ ...form, weight_grams: e.target.value })} />
            <input className="input" placeholder="Зургийн URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            <button className="btn-primary w-full" onClick={create} disabled={saving || !form.title_mn || !form.base_price_jpy}>
              {saving ? "Хадгалж байна..." : "Нэмэх"}
            </button>
          </div>
        </div>
      </div>

      {/* list */}
      <div className="lg:col-span-2">
        <h2 className="mb-3 font-semibold">Бараа ({products.length})</h2>
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="card flex items-center gap-3 p-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#F5F5F5]">
                {p.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{p.title_mn}</div>
                <div className="text-xs text-muted">{p.brand} • {jpy(p.base_price_jpy)} • {p.weight_grams}г</div>
              </div>
              <button className="text-xs text-accent" onClick={() => remove(p.id)}>Идэвхгүй</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
