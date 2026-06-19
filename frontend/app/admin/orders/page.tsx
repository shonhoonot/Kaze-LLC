"use client";

import { useEffect, useState } from "react";
import { AdminApi } from "@/lib/api";
import type { Order } from "@/lib/types";
import { ORDER_PIPELINE, ORDER_STATUS_MN } from "@/lib/types";
import { mnt } from "@/lib/format";

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  async function load() {
    setOrders(await AdminApi.orders());
  }
  useEffect(() => {
    load();
  }, []);

  async function advance(o: Order) {
    const idx = ORDER_PIPELINE.indexOf(o.status as (typeof ORDER_PIPELINE)[number]);
    if (idx < 0 || idx >= ORDER_PIPELINE.length - 1) return;
    await AdminApi.updateOrderStatus(o.id, ORDER_PIPELINE[idx + 1]);
    await load();
  }

  async function attachPhoto(o: Order) {
    const url = window.prompt("Зургийн URL:");
    if (!url) return;
    const caption = window.prompt("Тайлбар (заавал биш):") || undefined;
    await AdminApi.addOrderPhoto(o.id, url, caption);
    await load();
  }

  // group by status (kanban)
  const columns = ORDER_PIPELINE.map((status) => ({
    status,
    orders: orders.filter((o) => o.status === status),
  }));
  // orders outside the pipeline (cancelled / refunded) — shown separately
  const closed = orders.filter(
    (o) => !ORDER_PIPELINE.includes(o.status as (typeof ORDER_PIPELINE)[number])
  );

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">Захиалгын самбар</h1>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div key={col.status} className="w-64 shrink-0">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{ORDER_STATUS_MN[col.status]}</h2>
              <span className="text-xs text-muted">{col.orders.length}</span>
            </div>
            <div className="space-y-2">
              {col.orders.map((o) => (
                <div key={o.id} className="card p-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span>#{o.id}</span>
                    <span>{mnt(o.total_mnt)}</span>
                  </div>
                  <div className="text-xs text-muted">{o.items.length} бараа • {(o.est_weight_grams / 1000).toFixed(1)}кг</div>
                  <div className="text-[11px] text-muted">{o.payment_status === "paid" ? "✓ Төлсөн" : "Төлбөр хүлээгдэж буй"}</div>
                  {o.photos && o.photos.length > 0 && (
                    <div className="mt-1 text-[11px] text-muted">📷 {o.photos.length} зураг</div>
                  )}
                  {col.status !== "DELIVERED" && (
                    <button className="btn-outline mt-2 w-full py-1.5 text-xs" onClick={() => advance(o)}>
                      Дараагийн төлөв →
                    </button>
                  )}
                  <button className="mt-1 w-full py-1 text-[11px] text-muted hover:text-ink" onClick={() => attachPhoto(o)}>
                    + Зураг нэмэх
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {closed.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-muted">Цуцлагдсан / Буцаагдсан</h2>
          <div className="flex flex-wrap gap-2">
            {closed.map((o) => (
              <div key={o.id} className="card p-3 text-sm opacity-70">
                <div className="flex gap-3">
                  <span className="font-medium">#{o.id}</span>
                  <span>{mnt(o.total_mnt)}</span>
                  <span className="text-xs text-muted">{ORDER_STATUS_MN[o.status]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
