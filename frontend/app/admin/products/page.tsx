"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Api, AdminApi } from "@/lib/api";
import type { ImportResult, ScrapedProduct } from "@/lib/api";
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

const PAGE_SIZE = 20;

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // url sourcing
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeNote, setScrapeNote] = useState<string | null>(null);

  // list controls
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [active, setActive] = useState("all");
  const [page, setPage] = useState(1);

  // csv import
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<ImportResult | null>(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams({
      page: String(page),
      page_size: String(PAGE_SIZE),
      active,
    });
    if (q) qs.set("q", q);
    if (categoryId) qs.set("category_id", categoryId);
    const list = await AdminApi.products(qs.toString());
    setProducts(list.items);
    setTotal(list.total);
  }, [page, active, q, categoryId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    Api.categories().then(setCategories);
  }, []);

  // reset to first page whenever a filter changes
  useEffect(() => {
    setPage(1);
  }, [q, categoryId, active]);

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

  async function scrapeFromUrl() {
    const url = scrapeUrl.trim();
    if (!url) return;
    setScraping(true);
    setScrapeNote(null);
    try {
      const r: ScrapedProduct = await AdminApi.scrapeProduct(url);
      setForm((f) => ({
        ...f,
        title_mn: r.title_mn || f.title_mn,
        title_ja: r.title_ja || f.title_ja,
        brand: r.brand || f.brand,
        source: r.source || f.source,
        source_url: r.source_url || url,
        base_price_jpy: r.base_price_jpy != null ? String(r.base_price_jpy) : f.base_price_jpy,
        image_url: r.image_url || f.image_url,
      }));
      setScrapeNote(
        r.note ||
          (r.fetched
            ? "Мэдээлэл татагдлаа — доороос шалгаад нэрээ орчуулаад нэмнэ үү."
            : "Татаж чадсангүй — гараар бөглөнө үү.")
      );
    } catch {
      setScrapeNote("Холбоосыг боловсруулж чадсангүй.");
    } finally {
      setScraping(false);
    }
  }

  async function setActiveState(id: number, value: boolean) {
    await AdminApi.updateProduct(id, { is_active: value });
    await load();
  }

  async function setStockState(id: number, value: boolean) {
    await AdminApi.updateProduct(id, { in_stock: value });
    await load();
  }

  async function runImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const res = await AdminApi.importProductsCsv(file);
      setImportMsg(res);
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } finally {
      setImporting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* add form + csv import */}
      <div className="space-y-6 lg:col-span-1">
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Бараа нэмэх</h2>

          {/* URL sourcing */}
          <div className="mb-3 rounded-xl bg-[#FAFAFA] p-3">
            <label className="text-xs font-medium text-ink">Япон холбоосоор автоматаар татах</label>
            <div className="mt-2 flex gap-2">
              <input
                className="input flex-1"
                placeholder="https://www.amazon.co.jp/dp/..."
                value={scrapeUrl}
                onChange={(e) => setScrapeUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && scrapeFromUrl()}
              />
              <button className="btn-outline shrink-0 px-3 text-sm" onClick={scrapeFromUrl} disabled={scraping || !scrapeUrl.trim()}>
                {scraping ? "..." : "Татах"}
              </button>
            </div>
            {scrapeNote && <p className="mt-2 text-[11px] text-muted">{scrapeNote}</p>}
          </div>

          {form.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.image_url} alt="" className="mb-3 h-28 w-full rounded-lg object-cover" />
          )}

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
            <div>
              <label className="text-xs text-muted">эсвэл зураг оруулах</label>
              <input
                className="mt-1 block w-full text-xs"
                type="file"
                accept="image/*"
                disabled={uploadingImg}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingImg(true);
                  try {
                    const url = await AdminApi.uploadImage(file);
                    setForm((f) => ({ ...f, image_url: url }));
                  } finally {
                    setUploadingImg(false);
                  }
                }}
              />
              {uploadingImg && <p className="mt-1 text-xs text-muted">Зураг хуулж байна...</p>}
            </div>
            <button className="btn-primary w-full" onClick={create} disabled={saving || !form.title_mn || !form.base_price_jpy || !form.weight_grams}>
              {saving ? "Хадгалж байна..." : "Нэмэх"}
            </button>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-1 font-semibold">CSV-ээр олноор нэмэх</h2>
          <p className="mb-3 text-xs text-muted">
            Баганууд:{" "}
            <code className="text-[11px]">title_mn, title_ja, brand, source, source_url, sku, category_id, base_price_jpy, weight_grams, image_url</code>
          </p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="block w-full text-sm" />
          <button className="btn-outline mt-3 w-full py-2 text-sm" onClick={runImport} disabled={importing}>
            {importing ? "Импортолж байна..." : "Импортлох"}
          </button>
          {importMsg && (
            <div className="mt-3 text-xs">
              <div className="font-medium text-ink">{importMsg.created} бараа нэмэгдлээ</div>
              {importMsg.errors.length > 0 && (
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-accent">
                  {importMsg.errors.map((er, i) => (
                    <li key={i}>{er}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* list + filters */}
      <div className="lg:col-span-2">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            className="input max-w-[220px]"
            placeholder="Хайх (нэр, брэнд, SKU)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="input max-w-[160px]" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Бүх ангилал</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name_mn}</option>
            ))}
          </select>
          <select className="input max-w-[150px]" value={active} onChange={(e) => setActive(e.target.value)}>
            <option value="all">Бүгд</option>
            <option value="active">Идэвхтэй</option>
            <option value="inactive">Идэвхгүй</option>
          </select>
          <span className="ml-auto text-sm text-muted">{total} бараа</span>
        </div>

        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className={`card flex items-center gap-3 p-3 ${p.is_active ? "" : "opacity-60"}`}>
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#F5F5F5]">
                {p.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {p.title_mn}
                  {!p.is_active && (
                    <span className="rounded bg-line px-1.5 py-0.5 text-[10px] text-muted">Идэвхгүй</span>
                  )}
                  {p.is_active && !p.in_stock && (
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">Дууссан</span>
                  )}
                </div>
                <div className="text-xs text-muted">{p.brand} • {jpy(p.base_price_jpy)} • {p.weight_grams}г</div>
              </div>
              <button
                className="text-xs text-muted hover:text-ink"
                onClick={() => setStockState(p.id, !p.in_stock)}
              >
                {p.in_stock ? "Дууссан болгох" : "Нөөцтэй болгох"}
              </button>
              {p.is_active ? (
                <button className="text-xs text-accent" onClick={() => setActiveState(p.id, false)}>Идэвхгүй</button>
              ) : (
                <button className="text-xs text-emerald-600" onClick={() => setActiveState(p.id, true)}>Идэвхжүүлэх</button>
              )}
            </div>
          ))}
          {products.length === 0 && (
            <div className="py-10 text-center text-sm text-muted">Бараа олдсонгүй</div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <button className="btn-outline px-3 py-1.5 disabled:opacity-40" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
              ← Өмнөх
            </button>
            <span className="text-muted">{page} / {totalPages}</span>
            <button className="btn-outline px-3 py-1.5 disabled:opacity-40" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
              Дараах →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
