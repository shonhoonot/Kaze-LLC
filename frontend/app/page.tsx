"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Api } from "@/lib/api";
import type { Category, Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";

const BRANDS = ["Uniqlo", "GU", "Amazon JP", "Anker", "Sony"];

function WindLines({ color = "var(--violet-300)", style = {} }: { color?: string; style?: React.CSSProperties }) {
  return (
    <svg width="120" height="46" viewBox="0 0 120 46" fill="none" style={style} aria-hidden>
      <path d="M2 10 H86 a8 8 0 1 0 -8 -8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2 23 H102 a8 8 0 1 1 -8 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2 36 H70 a7 7 0 1 0 -7 -7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CategoryIcon({ slug }: { slug: string }) {
  const icons: Record<string, React.ReactNode> = {
    clothing: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.38 3.46 16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/>
      </svg>
    ),
    beauty: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 2v1M15 2v1M12 2v1M3 9h18M19 9v11a2 2 0 01-2 2H7a2 2 0 01-2-2V9"/><path d="M3 6a3 3 0 013-3h12a3 3 0 013 3v3H3V6z"/>
      </svg>
    ),
    electronics: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M8 10h.01M8 14h.01M12 6h4M12 10h4M12 14h4"/>
      </svg>
    ),
  };
  return (
    <span style={{ color: "var(--accent)" }}>
      {icons[slug] || (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        </svg>
      )}
    </span>
  );
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([Api.categories(), Api.products("page=1&page_size=8")])
      .then(([cats, list]) => { setCategories(cats); setProducts(list.items); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* ── Hero ── */}
      <section style={{ borderBottom: "1px solid var(--border-hair)" }}>
        <div className="container-app" style={{ paddingTop: "72px", paddingBottom: "64px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "48px", alignItems: "center" }}
            className="md-hero-grid">
            <div>
              {/* Eyebrow */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "16px" }}>
                <span style={{ fontFamily: "var(--font-head)", fontSize: "12px", fontWeight: 600, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: "var(--accent)" }}>
                  Жинхэнэ Япон бараа
                </span>
                <span style={{ fontFamily: "var(--font-jp)", fontSize: "11px", color: "var(--text-subtle)", letterSpacing: "0.1em" }}>
                  日本の本物
                </span>
              </div>

              <h1 style={{ margin: 0, fontFamily: "var(--font-head)", fontWeight: 700, fontSize: "clamp(2.2rem, 5vw, 3.5rem)", lineHeight: "var(--lh-tight)", letterSpacing: "var(--ls-tight)", color: "var(--text-strong)" }}>
                Япон <span style={{ color: "var(--accent)" }}>→</span> Монгол<br />
                бараа захиалга
              </h1>

              <p style={{ marginTop: "20px", maxWidth: "44ch", fontFamily: "var(--font-body)", fontSize: "var(--text-md)", lineHeight: "var(--lh-relaxed)", color: "var(--text-body)" }}>
                Amazon Japan, Uniqlo, GU болон бусад Япон дэлгүүрийн жинхэнэ бараа.
                Бид худалдан авч, савлаж, каргоор хүргэнэ.
              </p>

              <div style={{ display: "flex", gap: "12px", marginTop: "32px", flexWrap: "wrap" }}>
                <Link href="/category/clothing" className="btn-primary" style={{ height: "52px", padding: "0 28px", fontSize: "var(--text-base)" }}>
                  Бараа үзэх
                </Link>
                <Link href="/how-it-works" className="btn-outline" style={{ height: "52px", padding: "0 28px", fontSize: "var(--text-base)" }}>
                  Хэрхэн ажилладаг вэ?
                </Link>
              </div>

              <div style={{ display: "flex", gap: "28px", marginTop: "36px", flexWrap: "wrap" }}>
                {[
                  ["shield-check", "Жинхэнэ бараа", "баталгаатай"],
                  ["eye",          "Ил тод үнэ",    "нуугдмал төлбөргүй"],
                  ["map-pin",      "Захиалга хянах", "онлайнаар"],
                ].map(([, a, b]) => (
                  <div key={a} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", background: "var(--bg-wash)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </span>
                    <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                      <span style={{ fontFamily: "var(--font-head)", fontSize: "13px", fontWeight: 600, color: "var(--text-strong)" }}>{a}</span>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-muted)" }}>{b}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price card */}
            <div className="card" style={{ padding: 0, overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
              <div style={{ background: "linear-gradient(160deg, var(--violet-700), var(--violet-900))", padding: "28px 28px 24px", color: "#fff", position: "relative" }}>
                <WindLines color="rgba(255,255,255,0.25)" style={{ position: "absolute", top: 18, right: 16 }} />
                <span style={{ fontFamily: "var(--font-jp)", fontSize: "12px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.7)" }}>
                  標準料金 · Үндсэн тариф
                </span>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginTop: "14px" }}>
                  <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: "52px", lineHeight: 1 }}>4,000</span>
                  <span style={{ fontFamily: "var(--font-head)", fontSize: "22px", marginBottom: "6px" }}>¥</span>
                </div>
                <div style={{ marginTop: "6px", fontFamily: "var(--font-body)", fontSize: "15px", color: "rgba(255,255,255,0.85)" }}>
                  25кг хүртэлх нэг хайрцаг
                </div>
              </div>
              <div style={{ padding: "22px 28px 26px", display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  "25кг хүртэл нэг үнэ — нэмэлт комиссгүй",
                  "Олон хайрцаг автоматаар тооцогдоно",
                  "Төгрөгийн ханшаар шууд харагдана",
                ].map((t) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ width: "28px", height: "28px", flexShrink: 0, borderRadius: "var(--radius-sm)", background: "var(--bg-wash)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-body)" }}>{t}</span>
                  </div>
                ))}
                <Link href="/category/clothing" className="btn-primary" style={{ marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", height: "52px", fontSize: "var(--text-base)" }}>
                  Дэлгүүрлэж эхлэх
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3-step preview ── */}
      <section style={{ background: "var(--bg-sunken)", borderBottom: "1px solid var(--border-hair)", padding: "64px 0" }}>
        <div className="container-app">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap", marginBottom: "40px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "10px" }}>
                <span style={{ fontFamily: "var(--font-head)", fontSize: "12px", fontWeight: 600, letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: "var(--accent)" }}>Гурван алхам</span>
                <span style={{ fontFamily: "var(--font-jp)", fontSize: "11px", color: "var(--text-subtle)" }}>ご利用の流れ</span>
              </div>
              <h2 style={{ margin: 0, fontFamily: "var(--font-head)", fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text-strong)", lineHeight: "var(--lh-snug)", letterSpacing: "var(--ls-tight)" }}>
                Хэрхэн ажилладаг вэ
                <span style={{ fontFamily: "var(--font-jp)", fontSize: "var(--text-sm)", fontWeight: 400, color: "var(--text-jp)", marginLeft: "12px" }}>簡単3ステップ</span>
              </h2>
            </div>
            <Link href="/how-it-works" style={{ fontFamily: "var(--font-head)", fontSize: "14px", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
              Бүгдийг үзэх
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
            {[
              { num: "1", label: "Захиалга өгөх",      jp: "注文する",  desc: "Манай сайтаас Япон дэлгүүрийн бараа сонгоно." },
              { num: "2", label: "Бид худалдан авна",    jp: "購入する",  desc: "Манай Токиогийн агуулах руу хүлээн авч, савлана." },
              { num: "3", label: "Монголд хүргэнэ",     jp: "配達する",  desc: "7–10 хоногт далайн каргоор Улаанбаатарт хүргэгдэнэ." },
            ].map((s) => (
              <div key={s.num} className="card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "14px" }}>
                  <span style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-head)", fontWeight: 700, fontSize: "18px", flexShrink: 0 }}>
                    {s.num}
                  </span>
                  <div>
                    <div style={{ fontFamily: "var(--font-head)", fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-strong)" }}>{s.label}</div>
                    <div style={{ fontFamily: "var(--font-jp)", fontSize: "11px", color: "var(--text-jp)" }}>{s.jp}</div>
                  </div>
                </div>
                <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "14px", lineHeight: "var(--lh-relaxed)", color: "var(--text-muted)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <section className="container-app" style={{ paddingTop: "56px", paddingBottom: "16px" }}>
          <h2 style={{ margin: "0 0 20px", fontFamily: "var(--font-head)", fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text-strong)", letterSpacing: "var(--ls-tight)" }}>
            Ангилал
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px" }}>
            {categories.map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`}
                className="card"
                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", padding: "28px 16px", textAlign: "center", textDecoration: "none", transition: "var(--transition)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-xs)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
                <CategoryIcon slug={c.slug} />
                <span style={{ fontFamily: "var(--font-head)", fontSize: "14px", fontWeight: 600, color: "var(--text-strong)" }}>{c.name_mn}</span>
                <span style={{ fontFamily: "var(--font-jp)", fontSize: "11px", color: "var(--text-jp)" }}>{c.name_ja}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── New arrivals ── */}
      <section className="container-app" style={{ paddingTop: "40px", paddingBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-head)", fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text-strong)", letterSpacing: "var(--ls-tight)" }}>
            Шинээр ирсэн
          </h2>
          <Link href="/category/clothing" style={{ fontFamily: "var(--font-head)", fontSize: "14px", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
            Бүгдийг үзэх
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        </div>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: "1", borderRadius: "var(--radius-lg)", background: "var(--paper-200)", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* ── Brands ── */}
      <section className="container-app" style={{ paddingTop: "32px", paddingBottom: "64px" }}>
        <h2 style={{ margin: "0 0 16px", fontFamily: "var(--font-head)", fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text-strong)", letterSpacing: "var(--ls-tight)" }}>
          Онцлох брэндүүд
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {BRANDS.map((b) => (
            <Link key={b} href={`/category/clothing?brand=${encodeURIComponent(b)}`}
              style={{ display: "inline-block", padding: "8px 20px", border: "1px solid var(--border-hair)", borderRadius: "var(--radius-pill)", fontFamily: "var(--font-head)", fontSize: "14px", color: "var(--text-body)", textDecoration: "none", transition: "var(--transition)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLElement).style.color = "var(--accent)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hair)"; (e.currentTarget as HTMLElement).style.color = "var(--text-body)"; }}>
              {b}
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="container-app" style={{ paddingBottom: "80px" }}>
        <div style={{ background: "var(--bg-wash)", border: "1px solid var(--violet-100)", borderRadius: "var(--radius-xl)", padding: "48px 32px", textAlign: "center" }}>
          <h2 style={{ margin: "0 0 12px", fontFamily: "var(--font-head)", fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text-strong)" }}>
            Өнөөдөр дэлгүүрлэж эхлээрэй
            <span style={{ fontFamily: "var(--font-jp)", fontSize: "var(--text-sm)", fontWeight: 400, color: "var(--text-jp)", marginLeft: "12px" }}>今すぐ始める</span>
          </h2>
          <p style={{ margin: "0 auto 28px", maxWidth: "46ch", fontFamily: "var(--font-body)", fontSize: "var(--text-base)", lineHeight: "var(--lh-relaxed)", color: "var(--text-body)" }}>
            Японы жинхэнэ бараа, ил тод үнэ, найдвартай хүргэлт.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/category/clothing" className="btn-primary" style={{ height: "52px", padding: "0 32px", fontSize: "var(--text-base)" }}>
              Бараа үзэх
            </Link>
            <Link href="/how-it-works" className="btn-outline" style={{ height: "52px", padding: "0 32px", fontSize: "var(--text-base)" }}>
              Хэрхэн ажилладаг
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @media (min-width: 768px) {
          .md-hero-grid { grid-template-columns: 1.15fr 0.85fr !important; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
