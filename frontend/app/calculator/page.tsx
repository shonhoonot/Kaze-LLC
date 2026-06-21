"use client";

import { useState } from "react";
import Link from "next/link";

const RATE_YEN = 4000;
const KG_PER_BOX = 25;
const FX = 22.5;

function Field({ label, value, onChange, suffix }: { label: string; value: string; onChange: (v: string) => void; suffix: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label style={{ fontFamily: "var(--font-head)", fontSize: "13px", fontWeight: 500, color: "var(--text-strong)" }}>
        {label}
      </label>
      <div
        style={{ display: "flex", alignItems: "center", background: "var(--bg-app)", border: "1px solid var(--border-hair)", borderRadius: "10px", padding: "0 16px", height: "52px", transition: "var(--transition)" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
      >
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min="0"
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-body)", fontSize: "16px", color: "var(--text-strong)", width: "100%" }}
        />
        <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-muted)", marginLeft: "8px" }}>{suffix}</span>
      </div>
    </div>
  );
}

export default function CalculatorPage() {
  const [weight, setWeight] = useState("30");
  const [boxes, setBoxes] = useState("1");

  const w = Math.max(0, parseFloat(weight) || 0);
  const b = Math.max(0, parseInt(boxes) || 0);
  const byWeight = Math.ceil(w / KG_PER_BOX) || 0;
  const billed = Math.max(b, byWeight);
  const totalYen = billed * RATE_YEN;
  const totalTug = Math.round(totalYen * FX);
  const fmt = (n: number) => n.toLocaleString("en-US");

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto", padding: "56px 24px 80px" }}>
      <div style={{ marginBottom: "36px" }}>
        <div style={{ fontFamily: "var(--font-head)", fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "10px" }}>
          Үнэ тооцоологч · 料金計算
        </div>
        <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: "26px", color: "var(--text-strong)", margin: 0, lineHeight: 1.25 }}>
          Ачаагаа хэдэд багтаах вэ?
        </h1>
        <p style={{ marginTop: "10px", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.65 }}>
          Жин, хайрцгийн тоо оруулж нийт төлбөрийг тооцоол.
        </p>
      </div>

      <div className="card" style={{ borderRadius: "20px", padding: "28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "18px" }}>
          <Field label="Нийт жин" value={weight} onChange={setWeight} suffix="kg" />
          <Field label="Хайрцгийн тоо" value={boxes} onChange={setBoxes} suffix="ш" />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 14px", background: "var(--bg-app)", border: "1px solid var(--border-hair)", borderRadius: "10px", marginBottom: "20px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-muted)" }}>
            Жингээр <strong style={{ color: "var(--text-strong)" }}>{byWeight}</strong> хайрцаг шаардлагатай
          </span>
        </div>

        <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(124,58,237,0.25)" }}>
          <div style={{ background: "linear-gradient(140deg, #7C3AED, #4C1D95)", padding: "24px 26px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: "-20px", top: "-20px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(44,212,225,0.15)", pointerEvents: "none" }} />
            <div style={{ fontFamily: "var(--font-jp)", fontSize: "11px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.6)", marginBottom: "10px" }}>
              料金 · Нийт төлбөр
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "6px" }}>
              <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: "52px", lineHeight: 1, color: "#fff" }}>
                {fmt(totalYen)}
              </span>
              <span style={{ fontFamily: "var(--font-head)", fontSize: "22px", color: "rgba(255,255,255,0.8)", marginBottom: "8px" }}>¥</span>
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "16px", color: "#2CD4E1", marginTop: "4px" }}>
              ≈ {fmt(totalTug)} ₮
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 26px", background: "var(--bg-app)", borderTop: "1px solid var(--border-hair)" }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-muted)" }}>Ханш: 1¥ ≈ {FX}₮</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-muted)" }}>{billed} хайрцаг × 4,000¥</span>
          </div>
        </div>

        <Link href="/category/clothing" className="btn-primary" style={{ marginTop: "18px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", height: "48px", borderRadius: "12px", fontSize: "15px", textDecoration: "none" }}>
          Захиалга өгөх →
        </Link>
        <p style={{ textAlign: "center", margin: "12px 0 0", fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-muted)" }}>
          * Эцсийн төлбөр захиалгын үед тогтоно.
        </p>
      </div>

      <div className="card" style={{ marginTop: "16px", borderRadius: "16px", padding: "20px 24px" }}>
        <div style={{ fontFamily: "var(--font-head)", fontSize: "13px", fontWeight: 600, color: "var(--text-strong)", marginBottom: "12px" }}>
          Тооцооллын дэлгэрэнгүй
        </div>
        {[
          { label: "1 хайрцаг (≤25 кг)", value: "4,000¥" },
          { label: "Ханш (ойролцоо)", value: `1¥ ≈ ${FX}₮` },
          { label: "Үйлчилгээний хугацаа", value: "4–6 долоо хоног" },
        ].map((row) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-hair)", fontFamily: "var(--font-body)", fontSize: "13px" }}>
            <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
            <span style={{ color: "var(--text-strong)", fontWeight: 500 }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
