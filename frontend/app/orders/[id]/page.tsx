"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Api, getToken } from "@/lib/api";
import type { Order } from "@/lib/types";
import { mnt, jpy, kg } from "@/lib/format";
import OrderTracker from "@/components/OrderTracker";
import { useCart } from "@/components/CartProvider";

interface Invoice {
  invoice_id: string;
  qr_text: string;
  qr_image: string | null;
  deeplink: string | null;
  amount_mnt: number;
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const shouldPay = search.get("pay") === "1";
  const { refresh } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const load = useCallback(async () => {
    const o = await Api.order(params.id);
    setOrder(o);
    return o;
  }, [params.id]);

  useEffect(() => {
    if (!getToken()) {
      router.push(`/login?next=/orders/${params.id}`);
      return;
    }
    load().then((o) => {
      const closed = o.status === "CANCELLED" || o.status === "REFUNDED";
      if (shouldPay && o.payment_status !== "paid" && !closed) startPayment(o.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function startPayment(orderId: number) {
    setBusy(true);
    try {
      setInvoice(await Api.createInvoice(orderId));
    } finally {
      setBusy(false);
    }
  }

  async function confirmPaid() {
    if (!invoice || !order) return;
    setBusy(true);
    try {
      await Api.confirmStubPayment(invoice.invoice_id, order.id);
      setInvoice(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function doCancel() {
    if (!order) return;
    setBusy(true);
    try {
      await Api.cancelOrder(order.id, cancelReason);
      setCancelling(false);
      setCancelReason("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function doReorder() {
    if (!order) return;
    setBusy(true);
    try {
      const res = await Api.reorder(order.id);
      await refresh();
      router.push(res.skipped > 0 ? `/cart?reordered=${res.added}&skipped=${res.skipped}` : "/cart");
    } finally {
      setBusy(false);
    }
  }

  if (!order) return <div className="container-app py-20 text-center text-muted">Ачааллаж байна...</div>;

  const cancellable = order.status === "PLACED" || order.status === "PAID";

  return (
    <div className="container-app grid gap-8 py-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Захиалга #{order.id}</h1>
            <p className="text-sm text-muted">{new Date(order.created_at).toLocaleString("mn-MN")}</p>
          </div>
          <button className="btn-outline shrink-0 px-4 py-2 text-sm" onClick={doReorder} disabled={busy}>
            ↻ Дахин захиалах
          </button>
        </div>

        {/* payment box */}
        {order.payment_status !== "paid" && order.status !== "CANCELLED" && order.status !== "REFUNDED" && (
          <div className="card mt-4 p-5">
            <h2 className="font-semibold">Төлбөр төлөх</h2>
            {invoice ? (
              <div className="mt-3">
                <div className="rounded-xl border border-dashed border-line p-4 text-center text-xs text-muted break-all">
                  {invoice.qr_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={invoice.qr_image} alt="QPay QR" className="mx-auto h-40 w-40" />
                  ) : (
                    <>
                      <div className="text-4xl">▦</div>
                      <div className="mt-2">{invoice.qr_text}</div>
                    </>
                  )}
                </div>
                <div className="mt-2 text-sm">Төлөх дүн: <b>{mnt(invoice.amount_mnt)}</b></div>
                <button className="btn-primary mt-3 w-full" onClick={confirmPaid} disabled={busy}>
                  Төлбөр төлсөн (демо баталгаажуулалт)
                </button>
              </div>
            ) : (
              <button className="btn-primary mt-3" onClick={() => startPayment(order.id)} disabled={busy}>
                {busy ? "Уншиж байна..." : "QPay-ээр төлөх"}
              </button>
            )}
          </div>
        )}

        {order.status === "CANCELLED" && (
          <div className="mt-4 rounded-xl bg-[#FAFAFA] px-4 py-3 text-sm text-muted">
            Энэ захиалга цуцлагдсан.
            {order.payment_status === "refunded" && " Төлбөрийг буцаан олгоно."}
          </div>
        )}

        {cancellable && (
          <div className="mt-4">
            {cancelling ? (
              <div className="card p-4">
                <div className="text-sm font-medium">Захиалгыг цуцлах уу?</div>
                <p className="mt-1 text-xs text-muted">
                  Бараа Японд худалдаж авахаас өмнө цуцлах боломжтой. Төлбөр төлсөн бол буцаан олгоно.
                </p>
                <textarea
                  className="input mt-2"
                  rows={2}
                  placeholder="Шалтгаан (заавал биш)"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <div className="mt-2 flex gap-2">
                  <button className="btn-primary px-4 py-2 text-sm" onClick={doCancel} disabled={busy}>
                    Тийм, цуцлах
                  </button>
                  <button className="btn-outline px-4 py-2 text-sm" onClick={() => setCancelling(false)} disabled={busy}>
                    Болих
                  </button>
                </div>
              </div>
            ) : (
              <button className="text-sm text-muted underline hover:text-accent" onClick={() => setCancelling(true)}>
                Захиалга цуцлах
              </button>
            )}
          </div>
        )}

        <h2 className="mb-3 mt-6 font-semibold">Хүргэлтийн төлөв</h2>
        <OrderTracker status={order.status} events={order.events} />

        {order.photos && order.photos.length > 0 && (
          <>
            <h2 className="mb-3 mt-6 font-semibold">Агуулахын зураг</h2>
            <div className="grid grid-cols-3 gap-2">
              {order.photos.map((ph) => (
                <a
                  key={ph.id}
                  href={ph.url}
                  target="_blank"
                  rel="noreferrer"
                  className="card group block overflow-hidden"
                  title={ph.caption || ""}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ph.url}
                    alt={ph.caption || "Захиалгын зураг"}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                  />
                  {ph.caption && (
                    <div className="truncate px-2 py-1 text-[11px] text-muted">{ph.caption}</div>
                  )}
                </a>
              ))}
            </div>
          </>
        )}
      </div>

      {/* summary */}
      <div>
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Бараа</h2>
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between py-1 text-sm">
              <span className="text-muted">{it.title_mn_snapshot} × {it.qty}</span>
              <span>{jpy(it.line_total_jpy)}</span>
            </div>
          ))}
          <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
            <Row label="Барааны үнэ" value={jpy(order.subtotal_jpy)} />
            <Row label="Үйлчилгээний шимтгэл" value={jpy(order.markup_jpy)} />
            <Row label="Бараа авах шимтгэл" value={jpy(order.service_fee_jpy)} />
            <Row label={`Хүргэлт (${kg(order.est_weight_grams)})`} value={jpy(order.shipping_fee_jpy)} />
            {order.discount_jpy > 0 && (
              <Row label={`Хөнгөлөлт${order.coupon_code ? ` (${order.coupon_code})` : ""}`} value={`−${jpy(order.discount_jpy)}`} />
            )}
          </div>
          <div className="mt-3 flex justify-between border-t border-line pt-3">
            <span className="font-semibold">Нийт</span>
            <div className="text-right">
              <div className="text-lg font-bold">{mnt(order.total_mnt)}</div>
              <div className="text-xs text-muted">{jpy(order.total_jpy)}</div>
            </div>
          </div>
          {order.delivery_address && (
            <div className="mt-4 text-xs text-muted">
              <div className="font-medium text-ink">Хүргэх хаяг</div>
              {order.delivery_address}
              <div>{order.delivery_phone}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted">
      <span>{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
