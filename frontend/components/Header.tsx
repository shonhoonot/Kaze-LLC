"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCart } from "./CartProvider";

const NAV = [
  { href: "/category/clothing",  label: "Дэлгүүр",      jp: "商品" },
  { href: "/calculator",         label: "Үнэ тооцоол",  jp: "計算" },
  { href: "/tracking",           label: "Ачаа хянах",   jp: "追跡" },
  { href: "/how-it-works",       label: "Хэрхэн",       jp: "流れ" },
  { href: "/contact",            label: "Холбоо",        jp: "連絡" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 40,
      background: "color-mix(in srgb, var(--bg-app) 88%, transparent)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid var(--border-hair)",
    }}>
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3" style={{ textDecoration: "none" }}>
          <Image src="/kaze-mark.png" alt="Kaze" width={32} height={32} />
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: "16px", color: "var(--text-strong)", letterSpacing: "0.01em" }}>
              Kaze Shop
            </span>
            <span style={{ fontFamily: "var(--font-jp)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.18em" }}>
              日本 → モンゴル
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} style={{
              fontFamily: "var(--font-head)", fontSize: "14px", fontWeight: 500,
              color: "var(--text-body)", textDecoration: "none", transition: "var(--transition)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-body)")}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-md"
            style={{ border: "1px solid var(--border-hair)" }} aria-label="Сагс">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
                style={{ background: "var(--accent)", fontFamily: "var(--font-head)" }}>
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/account" className="btn-outline" style={{ height: "36px", padding: "0 14px", fontSize: "13px" }}>
                {user.name || "Профайл"}
              </Link>
              <button onClick={logout} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                Гарах
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary hidden sm:inline-flex" style={{ height: "36px", padding: "0 16px", fontSize: "13px" }}>
              Нэвтрэх
            </Link>
          )}

          <button className="flex h-10 w-10 items-center justify-center rounded-md md:hidden"
            style={{ border: "1px solid var(--border-hair)", background: "none", cursor: "pointer" }}
            onClick={() => setOpen((o) => !o)} aria-label="Цэс">
            {open
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
        </div>
      </div>

      {open && (
        <div style={{ borderTop: "1px solid var(--border-hair)", background: "var(--bg-surface)" }}>
          <div className="container-app flex flex-col py-3">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
                style={{ display: "flex", alignItems: "baseline", gap: "10px", padding: "13px 4px", textDecoration: "none", fontFamily: "var(--font-head)", fontSize: "16px", fontWeight: 500, color: "var(--text-body)", borderBottom: "1px solid var(--border-hair)" }}>
                {n.label}
                <span style={{ fontFamily: "var(--font-jp)", fontSize: "11px", color: "var(--text-muted)" }}>{n.jp}</span>
              </Link>
            ))}
            <Link href="/orders" onClick={() => setOpen(false)}
              style={{ display: "flex", alignItems: "baseline", gap: "10px", padding: "13px 4px", textDecoration: "none", fontFamily: "var(--font-head)", fontSize: "16px", fontWeight: 500, color: "var(--text-body)", borderBottom: "1px solid var(--border-hair)" }}>
              Миний захиалга
              <span style={{ fontFamily: "var(--font-jp)", fontSize: "11px", color: "var(--text-muted)" }}>注文</span>
            </Link>
            <div className="flex gap-3 pb-2 pt-4">
              {user ? (
                <>
                  <Link href="/account" onClick={() => setOpen(false)} className="btn-outline flex-1" style={{ height: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>Профайл</Link>
                  <button onClick={() => { logout(); setOpen(false); }} className="btn-outline flex-1" style={{ height: "44px" }}>Гарах</button>
                </>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="btn-primary w-full" style={{ height: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>Нэвтрэх</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
