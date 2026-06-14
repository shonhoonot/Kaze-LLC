"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Api, getToken } from "@/lib/api";
import type { ProductRequest } from "@/lib/types";
import { mnt, jpy } from "@/lib/format";

const STATUS: Record<ProductRequest["status"], { label: string; cls: string }> = {
  pending: { label: "Хүлээгдэж буй", cls: "bg-line text-muted" },
  quoted: { label: "Үнэ гарсан", cls: "bg-amber-50 text-amber-700" },
  rejected: { label: "Боломжгүй", cls: "bg-red-50 text-red-600" },
  fulfilled: { label: "Бэлэн болсон", cls: "bg-emerald-50 text-emerald-700" },
};

export default function RequestPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState<ProductRequest[]>([]);

  async function load() {
    setRequests(await Api.myRequests());
  }

  useEffect(() => {
    if (!getToken()) {
      router.push("/login?next=/request");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    setError("");
    if (!url.trim()) return;
    setBusy(true);
    try {
      await Api.createRequest(url.trim(), note);
      setUrl("");
      setNote("");
      await load();
    } catch (e) {
      setError("Хүсэлт илгээхэд алдаа гарлаа. Холбоосоо шалгана уу.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-app max-w-2xl py-8">
      <h1 className="text-2xl font-bold">Захиалгат бараа</h1>
      <p className="mt-1 text-sm text-muted">
        Каталогт байхгүй барааг Amazon JP, Rakuten, Mercari зэрэг сайтын холбоосоор илгээгээрэй.
        Бид үнийг тооцоолж танд хариу өгнө.
      </p>

      <div className="card mt-5 space-y-3 p-5">
        <input
          className="input"
          placeholder="Барааны холбоос (https://...)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <textarea
          className="input"
          rows={2}
          placeholder="Тэмдэглэл: размер, өнгө, тоо хэмжээ..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button className="btn-primary w-full" onClick={submit} disabled={busy || !url.trim()}>
          {busy ? "Илгээж байна..." : "Хүсэлт илгээх"}
        </button>
        {error && <p className="text-sm text-accent">{error}</p>}
      </div>

      <h2 className="mb-3 mt-8 font-semibold">Миний хүсэлтүүд</h2>
      <div className="space-y-3">
        {requests.length === 0 && <p className="text-sm text-muted">Одоогоор хүсэлт алга.</p>}
        {requests.map((r) => {
          const s = STATUS[r.status];
          return (
            <div key={r.id} className="card flex gap-3 p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#F5F5F5]">
                {r.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[11px] ${s.cls}`}>{s.label}</span>
                  {r.est_price_jpy && <span className="text-xs text-muted">~{jpy(r.est_price_jpy)}</span>}
                </div>
                <div className="truncate text-sm font-medium">{r.title || r.url}</div>
                {r.note && <div className="text-xs text-muted">Тэмдэглэл: {r.note}</div>}
                {r.admin_note && (
                  <div className="mt-1 rounded-lg bg-[#FAFAFA] px-2 py-1 text-xs">
                    💬 {r.admin_note}
                    {r.quoted_price_mnt != null && (
                      <span className="ml-1 font-semibold text-ink">— {mnt(r.quoted_price_mnt)}</span>
                    )}
                  </div>
                )}
                <a href={r.url} target="_blank" rel="noreferrer" className="text-[11px] text-muted underline">
                  Эх холбоос
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
