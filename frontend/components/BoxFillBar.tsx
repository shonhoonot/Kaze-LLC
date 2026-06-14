import type { BoxFill } from "@/lib/types";
import { kg } from "@/lib/format";

export default function BoxFillBar({ fill, compact }: { fill: BoxFill; compact?: boolean }) {
  const pct = Math.min(fill.fill_percent, 100);
  return (
    <div className={compact ? "" : "card p-5"}>
      {!compact && (
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">Дараагийн ачааны хайрцаг</span>
          <span className="text-muted">{pct}% дүүрсэн</span>
        </div>
      )}
      <div className="h-3 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 text-xs text-muted">
        {kg(fill.current_weight_grams)} / {kg(fill.capacity_grams)} —{" "}
        <span className="font-medium text-ink">{kg(fill.remaining_grams)} үлдсэн</span>
        {fill.remaining_grams > 0
          ? ". Хайрцаг дүүрмэгц Монгол руу явна — одоо захиалбал хурдан хүрнэ!"
          : ". Хайрцаг дүүрсэн — удахгүй явна!"}
      </div>
      {fill.est_arrival_date && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-accent-light px-3 py-2 text-xs text-accent-dark">
          🚢 <span>Ойролцоогоор <b>{fill.est_arrival_date}</b>-нд Монголд хүрнэ</span>
        </div>
      )}
    </div>
  );
}
