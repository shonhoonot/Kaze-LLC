"use client";

interface Step {
  label: string;
  jp?: string;
  state: "done" | "current" | "todo";
  time?: string;
  note?: string;
}

export function TrackTimeline({ steps = [], style = {} }: { steps: Step[]; style?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", ...style }}>
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const done = s.state === "done";
        const current = s.state === "current";
        const nodeColor = done || current ? "var(--accent)" : "var(--border-hair)";
        const lineColor = done ? "var(--accent)" : "var(--border-hair)";
        return (
          <div key={i} style={{ display: "flex", gap: "18px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: done ? "var(--accent)" : "var(--bg-surface)",
                  border: `2px solid ${nodeColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: current ? "0 0 0 4px rgba(124,58,237,0.15)" : "none",
                  transition: "var(--transition)",
                }}
              >
                {done && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6.2l2.2 2.2L9.5 3.6" stroke="var(--bg-app)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {current && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)", display: "block" }} />}
              </div>
              {!last && <div style={{ width: "2px", flex: 1, minHeight: "40px", background: lineColor }} />}
            </div>
            <div style={{ paddingBottom: last ? 0 : "24px", paddingTop: "0px", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: "var(--font-head)",
                    fontSize: "15px",
                    fontWeight: current ? 700 : 500,
                    color: done || current ? "var(--text-strong)" : "var(--text-muted)",
                  }}
                >
                  {s.label}
                </span>
                {s.jp && (
                  <span style={{ fontFamily: "var(--font-jp)", fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                    {s.jp}
                  </span>
                )}
              </div>
              {s.time && (
                <div style={{ marginTop: "3px", fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-muted)" }}>
                  {s.time}
                </div>
              )}
              {current && s.note && (
                <div style={{ marginTop: "8px", fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--accent)" }}>
                  {s.note}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
