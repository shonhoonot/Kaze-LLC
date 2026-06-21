import Link from "next/link";
import Image from "next/image";

const LINKS = [
  { href: "/category/clothing",  label: "Дэлгүүр" },
  { href: "/how-it-works",       label: "Хэрхэн ажилладаг" },
  { href: "/shipping-info",      label: "Хүргэлтийн мэдээлэл" },
  { href: "/faq",                label: "Түгээмэл асуулт" },
  { href: "/orders",             label: "Миний захиалга" },
];

export default function Footer() {
  return (
    <footer style={{ background: "var(--charcoal-900)", marginTop: "80px" }}>
      <div className="container-app" style={{ padding: "56px 24px", display: "flex", flexWrap: "wrap", gap: "40px", justifyContent: "space-between" }}>
        <div style={{ maxWidth: "300px" }}>
          <Image src="/kaze-logo-full.jpg" alt="Kaze Shop" width={160} height={48}
            style={{ borderRadius: "6px", display: "block" }} />
          <p style={{ marginTop: "18px", fontFamily: "var(--font-body)", fontSize: "14px", lineHeight: 1.7, color: "rgba(248,249,251,0.6)" }}>
            Японоос Монгол руу найдвартай прокси худалдан авалт ба далайн карго.
            Amazon JP, Uniqlo, GU болон бусад дэлгүүрүүд.
          </p>
        </div>

        <div style={{ display: "flex", gap: "56px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontFamily: "var(--font-head)", fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-2)", marginBottom: "4px" }}>
              Цэс
            </span>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href}
                style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "rgba(248,249,251,0.8)", textDecoration: "none", transition: "var(--transition)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(248,249,251,0.8)")}>
                {l.label}
              </Link>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontFamily: "var(--font-head)", fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-2)", marginBottom: "4px" }}>
              Холбоо
            </span>
            {[
              { href: "https://wa.me/97699000000", label: "WhatsApp" },
              { href: "https://m.me/kazeshop",    label: "Messenger" },
              { href: "https://t.me/kazeshop",    label: "Telegram" },
            ].map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "rgba(248,249,251,0.8)", textDecoration: "none" }}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--charcoal-700)", padding: "18px 24px", textAlign: "center", fontFamily: "var(--font-body)", fontSize: "12px", color: "rgba(248,249,251,0.4)" }}>
        © {new Date().getFullYear()} Kaze LLC · 日本 → モンゴル
      </div>
    </footer>
  );
}
