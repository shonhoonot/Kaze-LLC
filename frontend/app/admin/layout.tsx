"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Хяналтын самбар" },
  { href: "/admin/products", label: "Бараа" },
  { href: "/admin/pricing", label: "Үнэ тооцоо" },
  { href: "/admin/orders", label: "Захиалга" },
  { href: "/admin/boxes", label: "Хайрцаг" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!getToken()) {
      router.push("/login?next=/admin");
    } else if (user && user.role === "customer") {
      router.push("/");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role === "customer") {
    return <div className="container-app py-20 text-center text-muted">Зөвшөөрөл шалгаж байна...</div>;
  }

  return (
    <div className="container-app py-6">
      <div className="mb-6 flex flex-wrap gap-2 border-b border-line pb-3">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`rounded-full px-4 py-2 text-sm ${
              pathname === n.href ? "bg-ink text-white" : "text-muted hover:bg-line/50"
            }`}
          >
            {n.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
