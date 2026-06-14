"use client";

import { useEffect, useState } from "react";
import { AdminApi, Dashboard } from "@/lib/api";
import { mnt, jpy } from "@/lib/format";
import { ORDER_STATUS_MN } from "@/lib/types";

export default function AdminDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    AdminApi.dashboard().then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <div className="text-muted">Ачааллаж байна...</div>;

  const cards = [
    { label: "Өнөөдрийн захиалга", value: data.orders_today },
    { label: "Өнөөдрийн орлого", value: mnt(data.revenue_today_mnt) },
    { label: "Энэ сарын орлого", value: mnt(data.revenue_month_mnt), accent: true },
    { label: "Төлбөр хүлээгдэж буй", value: data.pending_orders, warn: data.pending_orders > 0 },
    { label: "Энэ сарын захиалга", value: data.orders_this_month },
    { label: "Дундаж ашиг / захиалга", value: jpy(data.avg_margin_per_order_jpy) },
    { label: "Идэвхтэй бараа", value: data.active_products },
    { label: "Энэ сарын хайрцаг", value: data.boxes_this_month },
    { label: "Нээлттэй хайрцгийн дүүргэлт", value: `${data.open_box_fill_percent}%` },
  ];

  const totalInPipeline = data.status_counts.reduce((s, x) => s + x.count, 0);

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">Хяналтын самбар</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`card p-5 ${c.accent ? "border-accent/40" : ""} ${c.warn ? "border-amber-300 bg-amber-50/40" : ""}`}
          >
            <div className="text-sm text-muted">{c.label}</div>
            <div className={`mt-1 text-2xl font-bold ${c.warn ? "text-amber-600" : ""}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {data.status_counts.length > 0 && (
        <div className="card mt-6 p-5">
          <h2 className="mb-4 font-semibold">Захиалгын төлөвийн задаргаа</h2>
          <div className="space-y-2">
            {data.status_counts.map((s) => {
              const pct = totalInPipeline ? Math.round((s.count / totalInPipeline) * 100) : 0;
              return (
                <div key={s.status} className="flex items-center gap-3 text-sm">
                  <span className="w-44 shrink-0 text-muted">{ORDER_STATUS_MN[s.status] || s.status}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-right font-medium">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
