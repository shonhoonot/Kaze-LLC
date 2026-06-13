"use client";

import { useEffect, useState } from "react";
import { AdminApi, Box } from "@/lib/api";
import type { Order } from "@/lib/types";
import { kg } from "@/lib/format";

export default function AdminBoxes() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [paidOrders, setPaidOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Record<number, string>>({});

  async function load() {
    const [bx, paid] = await Promise.all([AdminApi.boxes(), AdminApi.orders("PAID")]);
    setBoxes(bx);
    setPaidOrders(paid);
  }
  useEffect(() => {
    load();
  }, []);

  async function newBox() {
    await AdminApi.createBox();
    await load();
  }

  async function addToBox(boxId: number) {
    const orderId = Number(selected[boxId]);
    if (!orderId) return;
    await AdminApi.addBoxItem(boxId, orderId);
    await load();
  }

  async function ship(boxId: number) {
    await AdminApi.shipBox(boxId);
    await load();
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Хайрцаг нэгтгэх</h1>
        <button className="btn-primary" onClick={newBox}>+ Шинэ хайрцаг</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {boxes.map((box) => {
          const pct = Math.min((box.current_weight_grams / box.capacity_grams) * 100, 100);
          const over = box.current_weight_grams > box.capacity_grams;
          return (
            <div key={box.id} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{box.code}</div>
                  <div className="text-xs text-muted">{box.status}</div>
                </div>
                <div className="text-sm">{kg(box.current_weight_grams)} / {kg(box.capacity_grams)}</div>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-line">
                <div className={`h-full rounded-full ${over ? "bg-red-600" : "bg-accent"}`} style={{ width: `${pct}%` }} />
              </div>

              {box.status !== "SHIPPED" && (
                <div className="mt-4 space-y-2">
                  <div className="flex gap-2">
                    <select
                      className="input text-sm"
                      value={selected[box.id] || ""}
                      onChange={(e) => setSelected({ ...selected, [box.id]: e.target.value })}
                    >
                      <option value="">Төлсөн захиалга сонгох</option>
                      {paidOrders.map((o) => (
                        <option key={o.id} value={o.id}>
                          #{o.id} — {kg(o.est_weight_grams)}
                        </option>
                      ))}
                    </select>
                    <button className="btn-outline px-4 py-2 text-sm" onClick={() => addToBox(box.id)}>Нэмэх</button>
                  </div>
                  <button className="btn-primary w-full" onClick={() => ship(box.id)}>
                    Хайрцгийг ачих (SHIPPED)
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
