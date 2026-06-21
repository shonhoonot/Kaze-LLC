"use client";

import { useState } from "react";
import { TrackTimeline } from "@/components/TrackTimeline";

interface Step {
  label: string;
  jp?: string;
  state: "done" | "current" | "todo";
  time?: string;
  note?: string;
}

interface TrackResult {
  id: string;
  route: string;
  box: string;
  eta: string;
  steps: Step[];
}

export default function TrackingPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);

  const search = () => {
    const id = (code.trim() || "KZ-240615").toUpperCase();
    setResult({
      id,
      route: "Tokyo → Улаанбаатар",
      box: "25kg · 1 хайрцаг",
      eta: "06-24",
      steps: [
        { label: "Хүлээн авсан", jp: "受取済", state: "done", time: "06-12 · Tokyo агуулах" },
        { label: "Тээвэрлэж байна", jp: "輸送中", state: "current", time: "06-15", note: "Улаанбаатар руу гарсан" },
        { label: "Гаальд", jp: "通関中", state: "todo" },
        { label: "Хүргэгдсэн", jp: "配達完了", state: "todo" },
      ],
    });
  };

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "56px 24px 80px" }}>
      <div style={{ marginBottom: "36px" }}>
        <div style={{ fontFamily: "var(--font-head)", fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "10px" }}>
          Ачаа хянах · 追跡
        </div>
        <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: "26px", color: "var(--text-strong)", margin: 0, lineHeight: 1.25 }}>
          Хайрцагныхаа замыг хянаарай
        </h1>
        <p style={{ marginTop: "10px", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.65 }}>
          Захиалгын дугаараа оруулж байршлыг шалгаарай.
        </p>
      </div>

      <div className="card" style={{ borderRadius: "16px", padding: "24px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "stretch", flexWrap: "wrap" }}>
          <div
            style={{ flex: 1, minWidth: "200px", display: "flex", alignItems: "center", gap: "10px", background: "var(--bg-app)", border: "1px solid var(--border-hair)", borderRadius: "10px", padding: "0 16px", height: "52px" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="ж: KZ-240615"
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-body)", fontSize: "16px", color: "var(--text-strong)", width: "100%" }}
            />
          </div>
          <button
            onClick={search}
            className="btn-primary"
            style={{ padding: "0 24px", height: "52px", borderRadius: "10px", whiteSpace: "nowrap" }}
          >
            Хянах
          </button>
        </div>
        {!result && (
          <p style={{ margin: "12px 2px 0", fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-muted)" }}>
            Жишээ дугаар хоосон үлдээгээд "Хянах" дарж үзнэ үү.
          </p>
        )}
      </div>

      {result && (
        <div className="card" style={{ marginTop: "16px", borderRadius: "16px", overflow: "hidden", padding: 0 }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-hair)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: "20px", color: "var(--text-strong)" }}>
                {result.id}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
                {result.route} · {result.box}
              </div>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "999px", background: "rgba(44,212,225,0.1)", border: "1px solid rgba(44,212,225,0.3)" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2CD4E1", display: "inline-block" }} />
              <span style={{ fontFamily: "var(--font-head)", fontSize: "12px", color: "#2CD4E1", fontWeight: 600 }}>Тээвэрлэж байна</span>
            </div>
          </div>

          <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border-hair)", display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2CD4E1" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-strong)" }}>
              Хүргэх огноо: <strong>{result.eta}</strong>
            </span>
          </div>

          <div style={{ padding: "28px 24px" }}>
            <TrackTimeline steps={result.steps} />
          </div>
        </div>
      )}
    </div>
  );
}
