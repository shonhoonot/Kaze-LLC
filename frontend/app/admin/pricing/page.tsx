"use client";

import { useEffect, useState } from "react";
import { AdminApi, PricingRule } from "@/lib/api";

export default function AdminPricing() {
  const [rule, setRule] = useState<PricingRule | null>(null);
  const [saved, setSaved] = useState(false);
  const [fxBusy, setFxBusy] = useState(false);
  const [fxNote, setFxNote] = useState("");
  const [form, setForm] = useState({
    markup_percent: 0.1,
    service_fee_per_item_jpy: 400,
    shipping_fee_per_kg_jpy: 350,
    fx_rate_jpy_mnt: 22.5,
    fx_mode: "manual",
  });

  useEffect(() => {
    AdminApi.pricingRules().then((rules) => {
      const g = rules.find((r) => r.scope === "global");
      if (g) {
        setRule(g);
        setForm({
          markup_percent: g.markup_percent,
          service_fee_per_item_jpy: g.service_fee_per_item_jpy,
          shipping_fee_per_kg_jpy: g.shipping_fee_per_kg_jpy,
          fx_rate_jpy_mnt: g.fx_rate_jpy_mnt,
          fx_mode: g.fx_mode,
        });
      }
    });
  }, []);

  async function refreshFx() {
    setFxBusy(true);
    setFxNote("");
    try {
      const updated = await AdminApi.refreshFx();
      setForm((f) => ({ ...f, fx_rate_jpy_mnt: updated.fx_rate_jpy_mnt, fx_mode: updated.fx_mode }));
      setFxNote(`Шинэ ханш: ${updated.fx_rate_jpy_mnt} ₮/¥ (хадгалагдсан)`);
    } catch (e) {
      setFxNote(e instanceof Error && e.message ? e.message : "Ханш татаж чадсангүй.");
    } finally {
      setFxBusy(false);
    }
  }

  async function save() {
    const updated = await AdminApi.upsertPricingRule({ scope: "global", scope_ref: null, ...form });
    setRule(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-bold">Үнэ тооцооны дүрэм (Global)</h1>
      <p className="mb-5 text-sm text-muted">
        Бүх барааны үнэ эдгээр дүрмээр тооцогдоно. Ангилал / тус бүрийн бараанд тусдаа дүрэм нэмэх боломжтой (API).
      </p>

      <div className="card space-y-4 p-5">
        <Field label="Нэмэгдэл хувь (markup)" hint="0.10 = 10%">
          <input className="input" type="number" step="0.01" value={form.markup_percent}
            onChange={(e) => setForm({ ...form, markup_percent: Number(e.target.value) })} />
        </Field>
        <Field label="Бараа авах шимтгэл / ширхэг (JPY)">
          <input className="input" type="number" value={form.service_fee_per_item_jpy}
            onChange={(e) => setForm({ ...form, service_fee_per_item_jpy: Number(e.target.value) })} />
        </Field>
        <Field label="Хүргэлт / кг (JPY)" hint="Kaze өртөг ~160 JPY/кг">
          <input className="input" type="number" value={form.shipping_fee_per_kg_jpy}
            onChange={(e) => setForm({ ...form, shipping_fee_per_kg_jpy: Number(e.target.value) })} />
        </Field>
        <Field label="Ханш JPY→MNT">
          <div className="flex gap-2">
            <input className="input flex-1" type="number" step="0.1" value={form.fx_rate_jpy_mnt}
              onChange={(e) => setForm({ ...form, fx_rate_jpy_mnt: Number(e.target.value) })} />
            <button type="button" className="btn-outline shrink-0 px-3 text-sm" onClick={refreshFx} disabled={fxBusy}>
              {fxBusy ? "..." : "Амьд татах"}
            </button>
          </div>
          {fxNote && <p className="mt-1 text-xs text-muted">{fxNote}</p>}
        </Field>
        <Field label="Ханшийн горим">
          <select className="input" value={form.fx_mode} onChange={(e) => setForm({ ...form, fx_mode: e.target.value })}>
            <option value="manual">Гар (manual)</option>
            <option value="live">Шууд (live)</option>
          </select>
        </Field>

        <button className="btn-primary w-full" onClick={save}>
          {saved ? "Хадгалагдлаа ✓" : "Хадгалах"}
        </button>
        {rule && <p className="text-xs text-muted">Сүүлд шинэчилсэн: {new Date(rule.updated_at).toLocaleString("mn-MN")}</p>}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      {hint && <span className="ml-2 text-xs text-muted">{hint}</span>}
      <div className="mt-1">{children}</div>
    </div>
  );
}
