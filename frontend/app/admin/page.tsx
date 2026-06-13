"use client";

import { useEffect, useState } from "react";
import { AdminApi, Dashboard } from "@/lib/api";
import { mnt, jpy } from "@/lib/format";

export default function AdminDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    AdminApi.dashboard().then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <div className="text-muted">Ачааллаж байна...</div>;

  const cards = [
    { label: "Өнөөдрийн захиалга", value: data.orders_today },
    { label: "Өнөөдрийн орлого", value: mnt(data.revenue_today_mnt) },
    { label: "Дундаж ашиг / захиалга", value: jpy(data.avg_margin_per_order_jpy) },
    { label: "Энэ сарын хайрцаг", value: data.boxes_this_month },
    { label: "Нээлттэй хайрцгийн дүүргэлт", value: `${data.open_box_fill_percent}%` },
  ];

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">Хяналтын самбар</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="text-sm text-muted">{c.label}</div>
            <div className="mt-1 text-2xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
