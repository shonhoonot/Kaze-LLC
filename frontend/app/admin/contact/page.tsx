"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminApi } from "@/lib/api";
import type { ContactMessage } from "@/lib/types";

const FILTERS = [
  { key: "open", label: "Хүлээгдэж буй", val: false as boolean | undefined },
  { key: "done", label: "Шийдсэн", val: true as boolean | undefined },
  { key: "all", label: "Бүгд", val: undefined },
];

export default function AdminContact() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filter, setFilter] = useState("open");

  const load = useCallback(async () => {
    const f = FILTERS.find((x) => x.key === filter);
    setMessages(await AdminApi.contactMessages(f?.val));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(m: ContactMessage) {
    await AdminApi.markContactHandled(m.id, !m.handled);
    await load();
  }

  return (
    <div>
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

      <div className="space-y-3">
        {messages.length === 0 && <p className="text-sm text-muted">Зурвас алга.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`card p-4 ${m.handled ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  {m.name || "Зочин"} • <span className="text-muted">{m.contact}</span>
                </div>
                <div className="text-xs text-muted">{new Date(m.created_at).toLocaleString("mn-MN")}</div>
              </div>
              <button
                className={`shrink-0 text-xs ${m.handled ? "text-muted" : "text-accent"}`}
                onClick={() => toggle(m)}
              >
                {m.handled ? "Дахин нээх" : "Шийдсэн болгох"}
              </button>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{m.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
