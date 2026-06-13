"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Api, getToken } from "@/lib/api";
import type { Order } from "@/lib/types";
import { mnt, jpy, kg } from "@/lib/format";
import OrderTracker from "@/components/OrderTracker";

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

  const [order, setOrder] = useState<Order | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [busy, setBusy] = useState(false);

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
      if (shouldPay && o.payment_status !== "paid") startPayment(o.id);
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

  if (!order) return <div className="container-app py-20 text-center text-muted">Ачааллаж байна...</div>;

  return (
    <div className="container-app grid gap-8 py-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-bold">Захиалга #{order.id}</h1>
        <p className="text-sm text-muted">{new Date(order.created_at).toLocaleString("mn-MN")}</p>

        {/* payment box */}
        {order.payment_status !== "paid" && (
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

        <h2 className="mb-3 mt-6 font-semibold">Хүргэлтийн төлөв</h2>
        <OrderTracker status={order.status} events={order.events} />
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
