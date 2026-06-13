"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Api, getToken } from "@/lib/api";
import type { Cart } from "@/lib/types";
import { mnt, jpy } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/components/CartProvider";

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { refresh } = useCart();

  const [cart, setCart] = useState<Cart | null>(null);
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [khoroo, setKhoroo] = useState("");
  const [detail, setDetail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.push("/login?next=/checkout");
      return;
    }
    Api.cart().then(setCart);
  }, [router]);

  useEffect(() => {
    if (user) {
      setCity(user.city || "");
      setDistrict(user.district || "");
      setPhone(user.phone || "");
      if (user.default_address) setDetail(user.default_address);
    }
  }, [user]);

  async function placeOrder() {
    setError("");
    if (!city || !district || !phone) {
      setError("Хот, дүүрэг, утасны дугаараа бөглөнө үү.");
      return;
    }
    setBusy(true);
    try {
      const address = `${city}, ${district} дүүрэг, ${khoroo ? khoroo + "-р хороо, " : ""}${detail}`;
      const order = await Api.createOrder(address, phone);
      await refresh();
      router.push(`/orders/${order.id}?pay=1`);
    } catch (e) {
      setError("Захиалга үүсгэхэд алдаа гарлаа.");
    } finally {
      setBusy(false);
    }
  }

  if (!cart) return <div className="container-app py-20 text-center text-muted">Ачааллаж байна...</div>;

  return (
    <div className="container-app grid gap-8 py-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-5 text-2xl font-bold">Хүргэлтийн мэдээлэл</h1>
        <div className="card space-y-3 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted">Хот / аймаг</label>
              <input className="input mt-1" placeholder="Улаанбаатар" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted">Дүүрэг</label>
              <input className="input mt-1" placeholder="Сүхбаатар" value={district} onChange={(e) => setDistrict(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted">Хороо</label>
              <input className="input mt-1" placeholder="1" value={khoroo} onChange={(e) => setKhoroo(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted">Утас</label>
              <input className="input mt-1" placeholder="99112233" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted">Дэлгэрэнгүй хаяг</label>
            <textarea className="input mt-1" rows={2} placeholder="Байр, орц, тоот..." value={detail} onChange={(e) => setDetail(e.target.value)} />
          </div>
        </div>

        <h2 className="mb-3 mt-6 text-lg font-bold">Төлбөрийн хэлбэр</h2>
        <div className="card flex items-center gap-3 p-4">
          <span className="text-2xl">📱</span>
          <div>
            <div className="font-medium">QPay</div>
            <div className="text-xs text-muted">Захиалга баталгаажсаны дараа QR код үүснэ.</div>
          </div>
        </div>
        {error && <div className="mt-3 text-sm text-accent">{error}</div>}
      </div>

      <div>
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Захиалгын дүн</h2>
          {cart.lines.map((l) => (
            <div key={l.id} className="flex justify-between py-1 text-sm">
              <span className="text-muted">{l.title_mn} × {l.qty}</span>
              <span>{mnt(l.price.line_total_mnt)}</span>
            </div>
          ))}
          <div className="mt-3 flex justify-between border-t border-line pt-3">
            <span className="font-semibold">Нийт</span>
            <div className="text-right">
              <div className="text-lg font-bold">{mnt(cart.total_mnt)}</div>
              <div className="text-xs text-muted">{jpy(cart.total_jpy)}</div>
            </div>
          </div>
          <button className="btn-primary mt-4 w-full" onClick={placeOrder} disabled={busy}>
            {busy ? "Боловсруулж байна..." : "Захиалах"}
          </button>
        </div>
      </div>
    </div>
  );
}
