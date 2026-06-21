import Link from "next/link";
import { ProcessStep } from "@/components/ProcessStep";

export const metadata = { title: "Хэрхэн ажилладаг вэ? — Kaze Shop" };

const STEPS = [
  {
    n: 1,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
    label: "Бараа сонгох",
    jp: "商品を選ぶ",
    description: "Amazon JP, Uniqlo, GU болон бусад дэлгүүрүүдээс хүссэн бараагаа сонгож, Kaze сагсандаа нэм.",
  },
  {
    n: 2,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
      </svg>
    ),
    label: "Бид Японоос авна",
    jp: "日本で購入",
    description: "Kaze LLC таны захиалгыг Японд худалдан авч, нэрийн дор тус агуулахад хүлээн авна.",
  },
  {
    n: 3,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    label: "Монголд хүргэнэ",
    jp: "モンゴルへ配送",
    description: "Уутнуудыг 25 кг хайрцагт нэгтгэж далайн каргоор Монгол руу илгээн, хаалганд хүргэнэ.",
  },
  {
    n: 4,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    label: "Хүлээн авах",
    jp: "受け取り",
    description: "SMS мэдэгдэл авна. Хаяг дээрээ хүргүүлэх эсвэл манай агуулахаас авах боломжтой.",
  },
];

export default function HowItWorksPage() {
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "56px 24px 80px" }}>
      <div style={{ marginBottom: "48px" }}>
        <div style={{ fontFamily: "var(--font-head)", fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "10px" }}>
          Хэрхэн ажилладаг вэ? · 仕組み
        </div>
        <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: "32px", color: "var(--text-strong)", margin: 0, lineHeight: 1.2 }}>
          Гурван алхамаар<br />
          <span style={{ color: "var(--accent)" }}>Японоос Монгол</span> руу
        </h1>
        <p style={{ marginTop: "14px", fontFamily: "var(--font-body)", fontSize: "15px", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: "52ch" }}>
          Та бараагаа Kaze-д захиалаад, бид Японоос авч, далайн каргоор аюулгүй хүргэнэ.
        </p>
      </div>

      {/* Timeline */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: "27px", top: "56px", bottom: "56px", width: "2px", background: "linear-gradient(to bottom, var(--accent), var(--border-hair))", zIndex: 0 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display: "flex", gap: "28px", paddingBottom: i < STEPS.length - 1 ? "48px" : 0 }}>
              <ProcessStep
                number={s.n}
                icon={s.icon}
                label={s.label}
                jp={s.jp}
                description={s.description}
                layout="horizontal"
                style={{ zIndex: 1 }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Pricing info */}
      <div className="card" style={{ marginTop: "56px", borderRadius: "20px", padding: "28px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "14px" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-head)", fontSize: "18px", fontWeight: 700, color: "var(--text-strong)" }}>
            Үнэ хэрхэн тооцогддог вэ?
          </h2>
          <span style={{ fontFamily: "var(--font-jp)", fontSize: "12px", color: "var(--text-muted)" }}>料金体系</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            { label: "1 хайрцаг (≤25 кг)", value: "4,000¥" },
            { label: "Үйлчилгээний шимтгэл", value: "Барааны үнийн 10%" },
            { label: "Хүргэлтийн хугацаа", value: "4–6 долоо хоног" },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-hair)", fontFamily: "var(--font-body)", fontSize: "14px" }}>
              <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
              <span style={{ color: "var(--text-strong)", fontWeight: 600 }}>{row.value}</span>
            </div>
          ))}
        </div>
        <p style={{ margin: "14px 0 0", fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.65 }}>
          Бүх төлбөр ил тод — барааны хуудсан дээр харагдана. Нэмэлт нуугдмал төлбөр байхгүй.
        </p>
      </div>

      {/* CTA row */}
      <div style={{ marginTop: "40px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <Link href="/" className="btn-primary" style={{ height: "44px", padding: "0 24px", display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
          Бараа үзэх →
        </Link>
        <Link href="/calculator" className="btn-outline" style={{ height: "44px", padding: "0 24px", display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
          Үнэ тооцоолох
        </Link>
      </div>
    </div>
  );
}
