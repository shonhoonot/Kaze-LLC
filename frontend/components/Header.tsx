"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCart } from "./CartProvider";
import { useNotifications } from "./NotificationProvider";

export default function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { unread } = useNotifications();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(term.trim() ? `/search?q=${encodeURIComponent(term.trim())}` : "/search");
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">風 Kaze</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          <Link href="/category/clothing" className="hover:text-ink">Хувцас</Link>
          <Link href="/category/beauty" className="hover:text-ink">Гоо сайхан</Link>
          <Link href="/category/electronics" className="hover:text-ink">Цахилгаан</Link>
          <Link href="/request" className="hover:text-ink">Захиалгат бараа</Link>
          <Link href="/contact" className="hover:text-ink">Тусламж</Link>
        </nav>

        <form onSubmit={submitSearch} className="hidden flex-1 max-w-xs lg:block">
          <input
            className="input h-10 w-full"
            placeholder="Бараа хайх..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-3">
          <Link href="/search" className="rounded-full p-2 text-lg hover:bg-line/50 lg:hidden" aria-label="Хайх">
            🔍
          </Link>
          {user && (
            <Link href="/notifications" className="relative rounded-full p-2 hover:bg-line/50" aria-label="Мэдэгдэл">
              🔔
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          )}
          <Link href="/wishlist" className="rounded-full p-2 text-lg hover:bg-line/50" aria-label="Хадгалсан">
            ♡
          </Link>
          <Link href="/cart" className="relative rounded-full p-2 hover:bg-line/50" aria-label="Сагс">
            🛒
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/account" className="btn-outline px-4 py-2 text-xs">
                {user.name || "Профайл"}
              </Link>
              <button onClick={logout} className="text-xs text-muted hover:text-ink">
                Гарах
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary px-4 py-2 text-xs">
              Нэвтрэх
            </Link>
          )}
          <button
            className="rounded-full p-2 hover:bg-line/50 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Цэс"
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line md:hidden">
          <div className="container-app flex flex-col py-2 text-sm">
            <form onSubmit={submitSearch} className="py-2">
              <input
                className="input w-full"
                placeholder="Бараа хайх..."
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              />
            </form>
            <Link href="/category/clothing" className="py-2" onClick={() => setOpen(false)}>Хувцас</Link>
            <Link href="/category/beauty" className="py-2" onClick={() => setOpen(false)}>Гоо сайхан</Link>
            <Link href="/category/electronics" className="py-2" onClick={() => setOpen(false)}>Цахилгаан</Link>
            <Link href="/request" className="py-2" onClick={() => setOpen(false)}>Захиалгат бараа</Link>
            <Link href="/contact" className="py-2" onClick={() => setOpen(false)}>Тусламж</Link>
            <Link href="/orders" className="py-2" onClick={() => setOpen(false)}>Миний захиалга</Link>
            {user && (
              <Link href="/notifications" className="py-2" onClick={() => setOpen(false)}>
                Мэдэгдэл{unread > 0 ? ` (${unread})` : ""}
              </Link>
            )}
            {!user && (
              <Link href="/login" className="py-2 font-medium text-accent" onClick={() => setOpen(false)}>
                Нэвтрэх
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
