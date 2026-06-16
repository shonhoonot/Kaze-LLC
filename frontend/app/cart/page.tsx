"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Api, getToken } from "@/lib/api";
import type { Cart } from "@/lib/types";
import { mnt, jpy, kg } from "@/lib/format";
import { useCart } from "@/components/CartProvider";
import BoxFillBar from "@/components/BoxFillBar";

export default function CartPage() {
  const router = useRouter();
  const { refresh } = useCart();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.push("/login?next=/cart");
      return;
    }
    Api.cart()
      .then(setCart)
      .finally(() => setLoading(false));
    const params = new URLSearchParams(window.location.search);
    if (params.has("reordered")) {
      const added = params.get("reordered");
      const skipped = Number(params.get("skipped") || 0);
      setNotice(
        `${added} бараа сагсанд нэмэгдлээ.` +
          (skipped > 0 ? ` ${skipped} бараа дууссан тул нэмэгдсэнгүй.` : "")
      );
    }
  }, [router]);

  async function setQty(id: number, qty: number) {
    if (qty < 1) return;
    setCart(await Api.updateCartItem(id, { qty }));
    refresh();
  }

  async function remove(id: number) {
    setCart(await Api.removeCartItem(id));
    refresh();
  }

  if (loading) return <div className="container-app py-20 text-center text-muted">Ачааллаж байна...</div>;

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="container-app py-20 text-center">
        <div className="text-5xl">🛒</div>
        <h1 className="mt-4 text-xl font-bold">Сагс хоосон байна</h1>
        <p className="mt-2 text-muted">Япон бараагаа сонгож эхлээрэй.</p>
        <Link href="/" className="btn-primary mt-6">Бараа үзэх</Link>
      </div>
    );
  }

  return (
    <div className="container-app grid gap-8 py-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-5 text-2xl font-bold">Миний сагс</h1>
        {notice && (
          <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>
        )}
        <div className="space-y-4">
          {cart.lines.map((line) => (
            <div key={line.id} className="card flex gap-4 p-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#F5F5F5]">
                {line.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={line.image_url} alt={line.title_mn} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <Link href={`/product/${line.product_id}`} className="font-medium hover:underline">
                  {line.title_mn}
                </Link>
                <div className="text-xs text-muted">{kg(line.weight_grams)}</div>
                {line.bag_note && <div className="mt-1 text-xs text-muted">Тэмдэглэл: {line.bag_note}</div>}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-line">
                    <button className="px-3 py-1" onClick={() => setQty(line.id, line.qty - 1)}>−</button>
                    <span className="w-6 text-center text-sm">{line.qty}</span>
                    <button className="px-3 py-1" onClick={() => setQty(line.id, line.qty + 1)}>+</button>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{mnt(line.price.line_total_mnt)}</div>
                    <button className="text-xs text-muted hover:text-accent" onClick={() => remove(line.id)}>
                      Устгах
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* summary */}
      <div className="space-y-4">
        {cart.box_fill && <BoxFillBar fill={cart.box_fill} />}
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Захиалгын дүн</h2>
          <Row label="Барааны үнэ" value={jpy(cart.subtotal_jpy)} />
          <Row label="Үйлчилгээний шимтгэл" value={jpy(cart.markup_jpy)} />
          <Row label="Бараа авах шимтгэл" value={jpy(cart.service_fee_jpy)} />
          <Row label={`Хүргэлт (${kg(cart.est_weight_grams)})`} value={jpy(cart.shipping_fee_jpy)} />
          <div className="mt-3 flex justify-between border-t border-line pt-3">
            <span className="font-semibold">Нийт</span>
            <div className="text-right">
              <div className="text-lg font-bold">{mnt(cart.total_mnt)}</div>
              <div className="text-xs text-muted">{jpy(cart.total_jpy)} • ханш {cart.fx_rate_used}</div>
            </div>
          </div>
          <Link href="/checkout" className="btn-primary mt-4 w-full">Захиалга баталгаажуулах</Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5 text-sm text-muted">
      <span>{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
