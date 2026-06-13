import { ORDER_PIPELINE, ORDER_STATUS_MN, OrderEvent } from "@/lib/types";

export default function OrderTracker({
  status,
  events,
}: {
  status: string;
  events?: OrderEvent[];
}) {
  if (status === "CANCELLED" || status === "REFUNDED") {
    return (
      <div className="card p-4 text-sm">
        Захиалгын төлөв:{" "}
        <span className="font-semibold text-accent">{ORDER_STATUS_MN[status]}</span>
      </div>
    );
  }

  const currentIdx = ORDER_PIPELINE.indexOf(status as (typeof ORDER_PIPELINE)[number]);

  return (
    <div className="card p-5">
      <ol className="space-y-0">
        {ORDER_PIPELINE.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const ev = events?.find((e) => e.status === step);
          return (
            <li key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                    done
                      ? "bg-accent text-white"
                      : active
                        ? "border-2 border-accent text-accent"
                        : "border border-line text-muted"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                {i < ORDER_PIPELINE.length - 1 && (
                  <span className={`w-px flex-1 ${done ? "bg-accent" : "bg-line"}`} style={{ minHeight: 24 }} />
                )}
              </div>
              <div className="pb-5">
                <div className={`text-sm ${active ? "font-semibold text-ink" : done ? "text-ink" : "text-muted"}`}>
                  {ORDER_STATUS_MN[step]}
                </div>
                {ev && (
                  <div className="text-xs text-muted">
                    {new Date(ev.created_at).toLocaleString("mn-MN")}
                    {ev.note ? ` — ${ev.note}` : ""}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
