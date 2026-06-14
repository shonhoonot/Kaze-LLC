"use client";

import { useEffect, useState } from "react";
import { AdminApi } from "@/lib/api";
import type { Coupon } from "@/lib/api";
import { jpy } from "@/lib/format";

const EMPTY = {
  code: "",
  discount_type: "percent",
  value: "",
  min_subtotal_jpy: "0",
  max_discount_jpy: "",
  usage_limit: "",
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setCoupons(await AdminApi.coupons());
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setError("");
    setSaving(true);
    try {
      await AdminApi.createCoupon({
        code: form.code,
        discount_type: form.discount_type,
        value: Number(form.value),
        min_subtotal_jpy: Number(form.min_subtotal_jpy) || 0,
        max_discount_jpy: form.max_discount_jpy ? Number(form.max_discount_jpy) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      });
      setForm({ ...EMPTY });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Купон үүсгэхэд алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(c: Coupon) {
    await AdminApi.updateCoupon(c.id, { is_active: !c.is_active });
    await load();
  }

  function describe(c: Coupon) {
    const base = c.discount_type === "percent" ? `${c.value}% хөнгөлөлт` : `${jpy(c.value)} хөнгөлөлт`;
    const cap = c.max_discount_jpy ? `, дээд ${jpy(c.max_discount_jpy)}` : "";
    const min = c.min_subtotal_jpy ? ` • доод ${jpy(c.min_subtotal_jpy)}` : "";
    const used = c.usage_limit ? ` • ${c.used_count}/${c.usage_limit} ашигласан` : ` • ${c.used_count} ашигласан`;
    return base + cap + min + used;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* create */}
      <div className="lg:col-span-1">
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Купон үүсгэх</h2>
          <div className="space-y-2">
            <input
              className="input uppercase"
              placeholder="Код (ж: WELCOME10)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
            <select className="input" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
              <option value="percent">Хувиар (%)</option>
              <option value="fixed_jpy">Тогтмол дүн (JPY)</option>
            </select>
            <input
              className="input"
              type="number"
              placeholder={form.discount_type === "percent" ? "Хувь (ж: 10)" : "Дүн JPY (ж: 500)"}
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
            {form.discount_type === "percent" && (
              <input
                className="input"
                type="number"
                placeholder="Дээд хөнгөлөлт JPY (заавал биш)"
                value={form.max_discount_jpy}
                onChange={(e) => setForm({ ...form, max_discount_jpy: e.target.value })}
              />
            )}
            <input
              className="input"
              type="number"
              placeholder="Доод захиалгын дүн JPY"
              value={form.min_subtotal_jpy}
              onChange={(e) => setForm({ ...form, min_subtotal_jpy: e.target.value })}
            />
            <input
              className="input"
              type="number"
              placeholder="Ашиглах хязгаар (заавал биш)"
              value={form.usage_limit}
              onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
            />
            <button className="btn-primary w-full" onClick={create} disabled={saving || !form.code || !form.value}>
              {saving ? "Хадгалж байна..." : "Үүсгэх"}
            </button>
            {error && <p className="text-xs text-accent">{error}</p>}
          </div>
        </div>
      </div>

      {/* list */}
      <div className="lg:col-span-2">
        <h2 className="mb-3 font-semibold">Купонууд ({coupons.length})</h2>
        <div className="space-y-2">
          {coupons.map((c) => (
            <div key={c.id} className={`card flex items-center gap-3 p-3 ${c.is_active ? "" : "opacity-60"}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {c.code}
                  {!c.is_active && <span className="rounded bg-line px-1.5 py-0.5 text-[10px] text-muted">Идэвхгүй</span>}
                </div>
                <div className="text-xs text-muted">{describe(c)}</div>
              </div>
              <button className={`text-xs ${c.is_active ? "text-accent" : "text-emerald-600"}`} onClick={() => toggle(c)}>
                {c.is_active ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
              </button>
            </div>
          ))}
          {coupons.length === 0 && <div className="py-10 text-center text-sm text-muted">Купон алга</div>}
        </div>
      </div>
    </div>
  );
}
