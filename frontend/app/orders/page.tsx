"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Api, getToken } from "@/lib/api";
import type { Order } from "@/lib/types";
import { ORDER_STATUS_MN } from "@/lib/types";
import { mnt } from "@/lib/format";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login?next=/orders");
      return;
    }
    Api.orders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="container-app py-20 text-center text-muted">Ачааллаж байна...</div>;

  return (
    <div className="container-app py-8">
      <h1 className="mb-5 text-2xl font-bold">Миний захиалга</h1>
      {orders.length === 0 ? (
        <div className="py-16 text-center text-muted">Захиалга байхгүй байна.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="card flex items-center justify-between p-4 hover:border-ink">
              <div>
                <div className="font-medium">Захиалга #{o.id}</div>
                <div className="text-xs text-muted">{new Date(o.created_at).toLocaleDateString("mn-MN")} • {o.items.length} бараа</div>
              </div>
              <div className="text-right">
                <div className="rounded-full bg-accent-light px-3 py-1 text-xs font-medium text-accent-dark">
                  {ORDER_STATUS_MN[o.status]}
                </div>
                <div className="mt-1 font-semibold">{mnt(o.total_mnt)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
