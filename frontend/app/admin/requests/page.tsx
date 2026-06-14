"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminApi } from "@/lib/api";
import type { ProductRequest } from "@/lib/types";
import { mnt, jpy } from "@/lib/format";

const FILTERS = [
  { value: "", label: "Бүгд" },
  { value: "pending", label: "Хүлээгдэж буй" },
  { value: "quoted", label: "Үнэ гарсан" },
  { value: "rejected", label: "Боломжгүй" },
  { value: "fulfilled", label: "Бэлэн болсон" },
];

export default function AdminRequests() {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [filter, setFilter] = useState("pending");
  const [drafts, setDrafts] = useState<Record<number, { admin_note: string; quoted_price_mnt: string }>>({});

  const load = useCallback(async () => {
    setRequests(await AdminApi.requests(filter || undefined));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  function draft(r: ProductRequest) {
    return drafts[r.id] ?? {
      admin_note: r.admin_note || "",
      quoted_price_mnt: r.quoted_price_mnt != null ? String(r.quoted_price_mnt) : "",
    };
  }

  function setDraft(r: ProductRequest, patch: Partial<{ admin_note: string; quoted_price_mnt: string }>) {
    setDrafts((d) => ({ ...d, [r.id]: { ...draft(r), ...patch } }));
  }

  async function respond(r: ProductRequest, status: string) {
    const d = draft(r);
    await AdminApi.updateRequest(r.id, {
      status,
      admin_note: d.admin_note || null,
      quoted_price_mnt: d.quoted_price_mnt ? Number(d.quoted_price_mnt) : null,
    });
    await load();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              filter === f.value ? "bg-ink text-white" : "text-muted hover:bg-line/50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {requests.length === 0 && <p className="text-sm text-muted">Хүсэлт алга.</p>}
        {requests.map((r) => {
          const d = draft(r);
          return (
            <div key={r.id} className="card p-4">
              <div className="flex gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#F5F5F5]">
                  {r.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs uppercase tracking-wide text-muted">{r.source} • {r.status}</div>
                  <div className="truncate text-sm font-medium">{r.title || r.url}</div>
                  {r.est_price_jpy && <div className="text-xs text-muted">Тооцоолсон үнэ ~{jpy(r.est_price_jpy)}</div>}
                  {r.note && <div className="text-xs text-muted">Хэрэглэгчийн тэмдэглэл: {r.note}</div>}
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-[11px] text-accent underline">
                    Эх холбоос нээх
                  </a>
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_160px]">
                <input
                  className="input"
                  placeholder="Хариу / тэмдэглэл"
                  value={d.admin_note}
                  onChange={(e) => setDraft(r, { admin_note: e.target.value })}
                />
                <input
                  className="input"
                  type="number"
                  placeholder="Үнэ (₮)"
                  value={d.quoted_price_mnt}
                  onChange={(e) => setDraft(r, { quoted_price_mnt: e.target.value })}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button className="btn-primary px-4 py-1.5 text-sm" onClick={() => respond(r, "quoted")}>
                  Үнэ илгээх{d.quoted_price_mnt ? ` (${mnt(Number(d.quoted_price_mnt))})` : ""}
                </button>
                <button className="btn-outline px-4 py-1.5 text-sm" onClick={() => respond(r, "fulfilled")}>
                  Бэлэн болсон
                </button>
                <button className="btn-outline px-4 py-1.5 text-sm text-accent" onClick={() => respond(r, "rejected")}>
                  Татгалзах
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
