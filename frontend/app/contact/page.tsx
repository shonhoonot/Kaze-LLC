"use client";

import { useState } from "react";
import { Api } from "@/lib/api";

const FAQ = [
  {
    q: "Захиалга хэрхэн өгөх вэ?",
    a: "Каталогоос бараа сонгож сагсандаа нэмээд төлбөрөө төлнө. Каталогт байхгүй бол 'Захиалгат бараа' хэсгээс Япон линкээ илгээж болно.",
  },
  {
    q: "Хүргэлт хэр удах вэ?",
    a: "Японд худалдан авч, агуулахад савласны дараа далайн каргоор Монгол руу ачуулна. Нийт хугацаа ойролцоогоор 3-5 долоо хоног.",
  },
  {
    q: "Үнэ хэрхэн тооцогддог вэ?",
    a: "Барааны үнэ + үйлчилгээний шимтгэл + жингээр тооцсон хүргэлт. Бүх төлбөр ил тод, захиалга өгөхөөс өмнө харагдана.",
  },
  {
    q: "Төлбөрөө хэрхэн төлөх вэ?",
    a: "Захиалга баталгаажсаны дараа QPay-ийн QR код үүснэ. Та банкны аппаасаа уншуулж төлнө.",
  },
  {
    q: "Захиалгаа цуцалж болох уу?",
    a: "Бараа Японд худалдаж авахаас өмнө (захиалга хүлээгдэж буй эсвэл төлбөр төлсөн үед) цуцлах боломжтой. Төлсөн бол буцаан олгоно.",
  },
];

export default function ContactPage() {
  const [open, setOpen] = useState<number | null>(0);
  const [form, setForm] = useState({ name: "", contact: "", message: "" });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (!form.contact.trim() || !form.message.trim()) {
      setError("Холбоо барих мэдээлэл болон зурвасаа бөглөнө үү.");
      return;
    }
    setBusy(true);
    try {
      await Api.submitContact({ name: form.name || undefined, contact: form.contact, message: form.message });
      setSent(true);
      setForm({ name: "", contact: "", message: "" });
    } catch {
      setError("Илгээхэд алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-app max-w-2xl py-8">
      <h1 className="text-2xl font-bold">Тусламж ба холбоо барих</h1>

      {/* FAQ */}
      <h2 className="mb-3 mt-6 font-semibold">Түгээмэл асуултууд</h2>
      <div className="space-y-2">
        {FAQ.map((item, i) => (
          <div key={i} className="card overflow-hidden">
            <button
              className="flex w-full items-center justify-between p-4 text-left text-sm font-medium"
              onClick={() => setOpen(open === i ? null : i)}
            >
              {item.q}
              <span className="text-muted">{open === i ? "−" : "+"}</span>
            </button>
            {open === i && <div className="border-t border-line p-4 text-sm text-muted">{item.a}</div>}
          </div>
        ))}
      </div>

      {/* Contact form */}
      <h2 className="mb-3 mt-8 font-semibold">Бидэнтэй холбогдох</h2>
      {sent ? (
        <div className="card p-5 text-sm text-emerald-700">
          ✓ Таны зурвас илгээгдлээ. Бид удахгүй холбогдоно.
          <button className="ml-2 text-xs text-muted underline" onClick={() => setSent(false)}>
            Шинэ зурвас
          </button>
        </div>
      ) : (
        <div className="card space-y-3 p-5">
          <input className="input" placeholder="Нэр (заавал биш)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Утас эсвэл и-мэйл" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <textarea className="input" rows={4} placeholder="Таны зурвас..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <button className="btn-primary w-full" onClick={submit} disabled={busy || !form.contact.trim() || !form.message.trim()}>
            {busy ? "Илгээж байна..." : "Илгээх"}
          </button>
          {error && <p className="text-sm text-accent">{error}</p>}
        </div>
      )}
    </div>
  );
}
