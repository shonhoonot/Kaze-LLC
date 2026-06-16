"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Api, getToken } from "@/lib/api";
import type { Order } from "@/lib/types";
import { ORDER_STATUS_MN } from "@/lib/types";
import { mnt } from "@/lib/format";
import { useCart } from "@/components/CartProvider";

const CLOSED = ["CANCELLED", "REFUNDED"];
const FILTERS = [
  { key: "all", label: "Бүгд" },
  { key: "active", label: "Идэвхтэй" },
  { key: "delivered", label: "Хүргэгдсэн" },
  { key: "closed", label: "Цуцлагдсан" },
];

export default function OrdersPage() {
  const router = useRouter();
  const { refresh } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login?next=/orders");
      return;
    }
    Api.orders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [router]);

  async function reorder(id: number) {
    setBusyId(id);
    try {
      const res = await Api.reorder(id);
      await refresh();
      const msg = res.skipped > 0 ? `?reordered=${res.added}&skipped=${res.skipped}` : "";
      router.push(`/cart${msg}`);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="container-app py-20 text-center text-muted">Ачааллаж байна...</div>;

  const shown = orders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "delivered") return o.status === "DELIVERED";
    if (filter === "closed") return CLOSED.includes(o.status);
    return o.status !== "DELIVERED" && !CLOSED.includes(o.status); // active
  });

  return (
    <div className="container-app py-8">
      <h1 className="mb-5 text-2xl font-bold">Миний захиалга</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              filter === f.key ? "bg-ink text-white" : "text-muted hover:bg-line/50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="py-16 text-center text-muted">Захиалга байхгүй байна.</div>
      ) : (
        <div className="space-y-3">
          {shown.map((o) => (
            <div key={o.id} className="card flex items-center justify-between gap-3 p-4">
              <Link href={`/orders/${o.id}`} className="flex-1">
                <div className="font-medium">Захиалга #{o.id}</div>
                <div className="text-xs text-muted">
                  {new Date(o.created_at).toLocaleDateString("mn-MN")} • {o.items.length} бараа
                </div>
              </Link>
              <div className="text-right">
                <div className="inline-block rounded-full bg-accent-light px-3 py-1 text-xs font-medium text-accent-dark">
                  {ORDER_STATUS_MN[o.status]}
                </div>
                <div className="mt-1 font-semibold">{mnt(o.total_mnt)}</div>
                <button
                  className="mt-1 text-xs text-accent hover:underline disabled:opacity-50"
                  onClick={() => reorder(o.id)}
                  disabled={busyId === o.id}
                >
                  {busyId === o.id ? "..." : "↻ Дахин захиалах"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
