"use client";

import { useEffect, useState } from "react";
import { Api } from "@/lib/api";
import type { Address } from "@/lib/types";

const EMPTY = { label: "", phone: "", city: "", district: "", khoroo: "", detail: "" };

export default function AddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  async function load() {
    setAddresses(await Api.addresses());
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setSaving(true);
    try {
      await Api.createAddress({
        label: form.label || null,
        phone: form.phone,
        city: form.city,
        district: form.district,
        khoroo: form.khoroo || null,
        detail: form.detail || null,
        is_default: addresses.length === 0,
      });
      setForm({ ...EMPTY });
      setAdding(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function makeDefault(id: number) {
    await Api.updateAddress(id, { is_default: true });
    await load();
  }

  async function remove(id: number) {
    await Api.deleteAddress(id);
    await load();
  }

  return (
    <div className="card mt-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Хаягийн дэвтэр</h2>
        {!adding && (
          <button className="text-sm text-accent" onClick={() => setAdding(true)}>
            + Хаяг нэмэх
          </button>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {addresses.map((a) => (
          <div key={a.id} className="rounded-xl border border-line p-3 text-sm">
            <div className="flex items-center gap-2 font-medium">
              {a.label || "Хаяг"}
              {a.is_default && <span className="rounded bg-line px-1.5 py-0.5 text-[10px] text-muted">Үндсэн</span>}
            </div>
            <div className="text-muted">{a.formatted}</div>
            <div className="text-xs text-muted">📞 {a.phone}</div>
            <div className="mt-2 flex gap-3 text-xs">
              {!a.is_default && (
                <button className="text-accent" onClick={() => makeDefault(a.id)}>Үндсэн болгох</button>
              )}
              <button className="text-muted hover:text-accent" onClick={() => remove(a.id)}>Устгах</button>
            </div>
          </div>
        ))}
        {addresses.length === 0 && !adding && (
          <p className="text-sm text-muted">Хадгалсан хаяг алга.</p>
        )}
      </div>

      {adding && (
        <div className="mt-3 space-y-2 border-t border-line pt-3">
          <input className="input" placeholder="Нэр (ж: Гэр, Ажил)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" placeholder="Хот / аймаг" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input className="input" placeholder="Дүүрэг" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            <input className="input" placeholder="Хороо" value={form.khoroo} onChange={(e) => setForm({ ...form, khoroo: e.target.value })} />
            <input className="input" placeholder="Утас" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <textarea className="input" rows={2} placeholder="Байр, орц, тоот..." value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
          <div className="flex gap-2">
            <button className="btn-primary flex-1 py-2 text-sm" onClick={create} disabled={saving || !form.city || !form.district || !form.phone}>
              {saving ? "Хадгалж байна..." : "Хадгалах"}
            </button>
            <button className="btn-outline px-4 py-2 text-sm" onClick={() => { setAdding(false); setForm({ ...EMPTY }); }}>
              Болих
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
