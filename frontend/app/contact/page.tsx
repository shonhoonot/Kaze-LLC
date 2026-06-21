"use client";

import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const inputBase: React.CSSProperties = {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    fontFamily: "var(--font-body)",
    fontSize: "15px",
    color: "var(--text-strong)",
    width: "100%",
  };

  const wrapBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    background: "var(--bg-app)",
    border: "1px solid var(--border-hair)",
    borderRadius: "10px",
    padding: "0 16px",
    height: "52px",
    transition: "var(--transition)",
  };

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "56px 24px 80px" }}>
      <div style={{ marginBottom: "36px" }}>
        <div style={{ fontFamily: "var(--font-head)", fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "10px" }}>
          Холбоо барих · お問い合わせ
        </div>
        <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: "26px", color: "var(--text-strong)", margin: 0, lineHeight: 1.25 }}>
          Бидэнд бичээрэй
        </h1>
        <p style={{ marginTop: "10px", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.65 }}>
          Асуулт, санал гомдолоо бидэнд илгээгээрэй. Ажлын цагт 2–4 цагийн дотор хариулна.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 0.85fr", gap: "24px", alignItems: "start" }}>
        {/* Form */}
        <div className="card" style={{ borderRadius: "20px", padding: "28px" }}>
          {sent ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(47,163,107,0.12)", border: "1px solid rgba(47,163,107,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2FA36B" strokeWidth="2" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: "18px", fontWeight: 600, color: "var(--text-strong)" }}>Хүсэлт хүлээн авлаа</div>
              <p style={{ margin: "8px 0 20px", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-muted)" }}>
                Бид удахгүй тантай холбогдоно. Баярлалаа!
              </p>
              <button
                onClick={() => { setSent(false); setForm({ name: "", phone: "", message: "" }); }}
                style={{ padding: "10px 20px", border: "1px solid var(--border-hair)", borderRadius: "10px", background: "transparent", color: "var(--text-strong)", fontFamily: "var(--font-head)", fontSize: "13px", cursor: "pointer" }}
              >
                Дахин бичих
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontFamily: "var(--font-head)", fontSize: "13px", fontWeight: 500, color: "var(--text-strong)" }}>Нэр</label>
                <div style={wrapBase}>
                  <input type="text" value={form.name} onChange={set("name")} placeholder="Таны нэр" style={inputBase} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontFamily: "var(--font-head)", fontSize: "13px", fontWeight: 500, color: "var(--text-strong)" }}>Утас</label>
                <div style={wrapBase}>
                  <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+976 ____ ____" style={inputBase} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontFamily: "var(--font-head)", fontSize: "13px", fontWeight: 500, color: "var(--text-strong)" }}>Зурвас</label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={set("message")}
                  placeholder="Юу илгээх вэ, асуулт байна уу?"
                  style={{ padding: "14px 16px", border: "1px solid var(--border-hair)", borderRadius: "10px", background: "var(--bg-app)", fontFamily: "var(--font-body)", fontSize: "15px", color: "var(--text-strong)", resize: "vertical", outline: "none" }}
                />
              </div>

              <button
                onClick={() => setSent(true)}
                className="btn-primary"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "48px", borderRadius: "12px", fontSize: "15px", border: "none", cursor: "pointer" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Илгээх
              </button>
            </div>
          )}
        </div>

        {/* Contact cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              ),
              label: "Facebook Messenger",
              sub: "fb.com/kazeexpress — хамгийн хурдан",
              color: "var(--accent)",
              bg: "rgba(124,58,237,0.1)",
              href: "https://m.me/kazeshop",
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.06 6.06l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
              ),
              label: "+976 7000 0000",
              sub: "Даваа–Бямба · 10:00–19:00",
              color: "#2CD4E1",
              bg: "rgba(44,212,225,0.1)",
              href: "tel:+97670000000",
            },
          ].map(({ icon, label, sub, color, bg, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="card"
              style={{ borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "16px", cursor: "pointer", textDecoration: "none", transition: "var(--transition)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
            >
              <span style={{ width: "44px", height: "44px", borderRadius: "10px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
                {icon}
              </span>
              <div>
                <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: "15px", color: "var(--text-strong)" }}>{label}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>{sub}</div>
              </div>
            </a>
          ))}

          <div className="card" style={{ borderRadius: "14px", padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: "13px", fontWeight: 600, color: "var(--text-strong)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2CD4E1" strokeWidth="2" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              Агуулахууд
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "13px", lineHeight: 1.75, color: "var(--text-muted)" }}>
              <div>🇯🇵 Tokyo, Adachi-ku — хүлээн авах агуулах</div>
              <div>🇲🇳 Улаанбаатар, ХУД — тараах төв</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .kz-contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
