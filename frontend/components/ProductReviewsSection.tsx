"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Api, getToken } from "@/lib/api";
import type { ProductReviews } from "@/lib/types";
import { Stars, StarInput } from "./Stars";

export default function ProductReviewsSection({ productId }: { productId: number }) {
  const router = useRouter();
  const [data, setData] = useState<ProductReviews | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await Api.productReviews(productId);
    setData(res);
    if (res.my_review) {
      setRating(res.my_review.rating);
      setComment(res.my_review.comment || "");
    }
  }

  useEffect(() => {
    load();
  }, [productId]);

  async function submit() {
    if (!getToken()) {
      router.push(`/login?next=/product/${productId}`);
      return;
    }
    setBusy(true);
    try {
      await Api.submitReview(productId, rating, comment);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await Api.deleteReview(productId);
      setRating(5);
      setComment("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!data) return null;
  const { summary, items, my_review } = data;
  const total = summary.review_count;

  return (
    <div className="mt-12 border-t border-line pt-8">
      <h2 className="mb-5 text-xl font-bold">Үнэлгээ ба сэтгэгдэл</h2>

      <div className="grid gap-8 md:grid-cols-3">
        {/* summary */}
        <div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">{summary.avg_rating?.toFixed(1) ?? "—"}</span>
            <span className="pb-1 text-sm text-muted">/ 5</span>
          </div>
          {summary.avg_rating != null && <Stars value={summary.avg_rating} size="text-lg" />}
          <div className="mt-1 text-sm text-muted">{total} сэтгэгдэл</div>

          <div className="mt-4 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[String(star)] || 0;
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-muted">{star}</span>
                  <span className="text-amber-500">★</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right text-muted">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* write + list */}
        <div className="md:col-span-2">
          {/* write form */}
          <div className="card p-4">
            <div className="mb-2 text-sm font-medium">
              {my_review ? "Сэтгэгдлээ засах" : "Сэтгэгдэл үлдээх"}
            </div>
            <StarInput value={rating} onChange={setRating} />
            <textarea
              className="input mt-3"
              rows={2}
              placeholder="Бараа таны хүлээлтэд нийцсэн үү?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="mt-3 flex gap-2">
              <button className="btn-primary px-5 py-2 text-sm" onClick={submit} disabled={busy}>
                {my_review ? "Шинэчлэх" : "Илгээх"}
              </button>
              {my_review && (
                <button className="btn-outline px-4 py-2 text-sm text-muted" onClick={remove} disabled={busy}>
                  Устгах
                </button>
              )}
            </div>
          </div>

          {/* list */}
          <div className="mt-5 space-y-4">
            {items.length === 0 && <p className="text-sm text-muted">Одоогоор сэтгэгдэл алга. Эхний сэтгэгдлийг үлдээгээрэй!</p>}
            {items.map((r) => (
              <div key={r.id} className="border-b border-line pb-4 last:border-0">
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} />
                  <span className="text-sm font-medium">{r.author_name}</span>
                  {r.verified && (
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700">
                      ✓ Худалдан авсан
                    </span>
                  )}
                </div>
                {r.comment && <p className="mt-1 text-sm text-muted">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
