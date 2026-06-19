"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Api, getToken } from "@/lib/api";
import type { CouponValidation } from "@/lib/api";
import type { Address, Cart } from "@/lib/types";
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

  // address book
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [label, setLabel] = useState("");
  const [saveNew, setSaveNew] = useState(true);

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponValidation | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login?next=/checkout");
      return;
    }
    Api.cart().then(setCart);
    Api.addresses().then((list) => {
      setAddresses(list);
      const def = list.find((a) => a.is_default) || list[0];
      if (def) setSelectedId(def.id);
      else setAddingNew(true);
    });
  }, [router]);

  // prefill phone from the profile once (don't fight the user if they clear it)
  useEffect(() => {
    if (user?.phone) setPhone((p) => p || user.phone || "");
  }, [user]);

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCheckingCoupon(true);
    try {
      const res = await Api.validateCoupon(code);
      setCoupon(res);
    } catch {
      setCoupon({ valid: false, code, discount_jpy: 0, discount_mnt: 0, message: "Купоныг шалгаж чадсангүй." });
    } finally {
      setCheckingCoupon(false);
    }
  }

  function clearCoupon() {
    setCoupon(null);
    setCouponInput("");
  }

  const usingSaved = !addingNew && selectedId != null;

  async function placeOrder() {
    setError("");
    let address: string;
    let deliveryPhone: string;

    if (usingSaved) {
      const picked = addresses.find((a) => a.id === selectedId);
      if (!picked) {
        setError("Хаягаа сонгоно уу.");
        return;
      }
      address = picked.formatted;
      deliveryPhone = picked.phone;
    } else {
      if (!city || !district || !phone) {
        setError("Хот, дүүрэг, утасны дугаараа бөглөнө үү.");
        return;
      }
      address = `${city}, ${district} дүүрэг, ${khoroo ? khoroo + "-р хороо, " : ""}${detail}`;
      deliveryPhone = phone;
    }

    setBusy(true);
    try {
      if (!usingSaved && saveNew) {
        await Api.createAddress({
          label: label || null,
          phone,
          city,
          district,
          khoroo: khoroo || null,
          detail: detail || null,
          is_default: addresses.length === 0,
        }).catch(() => null); // saving is best-effort; don't block the order
      }
      const code = coupon?.valid ? coupon.code : null;
      const order = await Api.createOrder(address, deliveryPhone, code);
      await refresh();
      router.push(`/orders/${order.id}?pay=1`);
    } catch (e) {
      setError("Захиалга үүсгэхэд алдаа гарлаа.");
    } finally {
      setBusy(false);
    }
  }

  const discountMnt = coupon?.valid ? coupon.discount_mnt : 0;
  const discountJpy = coupon?.valid ? coupon.discount_jpy : 0;

  if (!cart) return <div className="container-app py-20 text-center text-muted">Ачааллаж байна...</div>;

  return (
    <div className="container-app grid gap-8 py-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-5 text-2xl font-bold">Хүргэлтийн мэдээлэл</h1>

        {addresses.length > 0 && (
          <div className="mb-4 space-y-2">
            {addresses.map((a) => (
              <label
                key={a.id}
                className={`card flex cursor-pointer items-start gap-3 p-4 ${
                  usingSaved && selectedId === a.id ? "ring-2 ring-ink" : ""
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  className="mt-1"
                  checked={usingSaved && selectedId === a.id}
                  onChange={() => {
                    setSelectedId(a.id);
                    setAddingNew(false);
                  }}
                />
                <div className="flex-1 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    {a.label || "Хаяг"}
                    {a.is_default && (
                      <span className="rounded bg-line px-1.5 py-0.5 text-[10px] text-muted">Үндсэн</span>
                    )}
                  </div>
                  <div className="text-muted">{a.formatted}</div>
                  <div className="text-xs text-muted">📞 {a.phone}</div>
                </div>
              </label>
            ))}
            {!addingNew && (
              <button
                className="text-sm text-accent"
                onClick={() => {
                  setAddingNew(true);
                  setSelectedId(null);
                }}
              >
                + Шинэ хаяг нэмэх
              </button>
            )}
          </div>
        )}

        {(addingNew || addresses.length === 0) && (
        <div className="card space-y-3 p-5">
          {addresses.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Шинэ хаяг</span>
              <button className="text-xs text-muted underline" onClick={() => setAddingNew(false)}>
                Болих
              </button>
            </div>
          )}
          <input className="input" placeholder="Нэр (ж: Гэр, Ажил)" value={label} onChange={(e) => setLabel(e.target.value)} />
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
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={saveNew} onChange={(e) => setSaveNew(e.target.checked)} />
            Энэ хаягийг хадгалах
          </label>
        </div>
        )}

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
          {/* coupon */}
          <div className="mt-3 border-t border-line pt-3">
            {coupon?.valid ? (
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm">
                <span className="font-medium text-emerald-700">🎟 {coupon.code} — {coupon.message}</span>
                <button className="text-xs text-muted underline" onClick={clearCoupon}>Хасах</button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Купон код"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                  />
                  <button className="btn-outline shrink-0 px-3 text-sm" onClick={applyCoupon} disabled={checkingCoupon || !couponInput.trim()}>
                    {checkingCoupon ? "..." : "Хэрэглэх"}
                  </button>
                </div>
                {coupon && !coupon.valid && <p className="mt-1 text-xs text-accent">{coupon.message}</p>}
              </div>
            )}
          </div>

          {discountMnt > 0 && (
            <div className="mt-3 flex justify-between text-sm text-emerald-700">
              <span>Хөнгөлөлт</span>
              <span>−{mnt(discountMnt)}</span>
            </div>
          )}

          <div className="mt-3 flex justify-between border-t border-line pt-3">
            <span className="font-semibold">Нийт</span>
            <div className="text-right">
              <div className="text-lg font-bold">{mnt(cart.total_mnt - discountMnt)}</div>
              <div className="text-xs text-muted">{jpy(cart.total_jpy - discountJpy)}</div>
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
