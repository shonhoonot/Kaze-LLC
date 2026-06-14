"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";
import { useNotifications } from "@/components/NotificationProvider";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "дөнгөж сая";
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} цаг`;
  const d = Math.floor(h / 24);
  return `${d} өдөр`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { items, unread, refresh, markRead, markAllRead } = useNotifications();

  useEffect(() => {
    if (!getToken()) {
      router.push("/login?next=/notifications");
      return;
    }
    refresh();
  }, [router, refresh]);

  return (
    <div className="container-app max-w-2xl py-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Мэдэгдэл</h1>
        {unread > 0 && (
          <button className="text-sm text-accent hover:underline" onClick={markAllRead}>
            Бүгдийг уншсан болгох
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-5xl">🔔</div>
          <p className="mt-3 text-muted">Танд одоогоор мэдэгдэл алга байна.</p>
          <Link href="/" className="btn-primary mt-5">Бараа үзэх</Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const body = (
              <div
                className={`card flex gap-3 p-4 ${n.is_read ? "" : "border-accent/40 bg-accent-light/40"}`}
              >
                <span className="text-xl">{n.order_id ? "📦" : "🔔"}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm ${n.is_read ? "text-ink" : "font-semibold text-ink"}`}>
                      {n.title}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted">{timeAgo(n.created_at)}</span>
                  </div>
                  {n.body && <p className="mt-0.5 text-sm text-muted">{n.body}</p>}
                </div>
                {!n.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />}
              </div>
            );
            return (
              <li key={n.id}>
                {n.order_id ? (
                  <Link href={`/orders/${n.order_id}`} onClick={() => !n.is_read && markRead(n.id)}>
                    {body}
                  </Link>
                ) : (
                  <button
                    className="w-full text-left"
                    onClick={() => !n.is_read && markRead(n.id)}
                  >
                    {body}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
