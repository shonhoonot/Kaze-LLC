import React from "react";

interface ProcessStepProps {
  number?: number;
  icon?: React.ReactNode;
  label: string;
  jp?: string;
  description?: string;
  layout?: "vertical" | "horizontal";
  style?: React.CSSProperties;
}

export function ProcessStep({ number, icon, label, jp, description, layout = "vertical", style = {} }: ProcessStepProps) {
  const horizontal = layout === "horizontal";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: horizontal ? "row" : "column",
        alignItems: "flex-start",
        gap: "16px",
        ...style,
      }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            border: "1px solid var(--border-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent)",
            background: "var(--bg-surface)",
          }}
        >
          {icon}
        </div>
        {number != null && (
          <span
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              minWidth: "22px",
              height: "22px",
              padding: "0 5px",
              borderRadius: "999px",
              background: "var(--accent)",
              color: "#FAF8F3",
              fontFamily: "var(--font-head)",
              fontSize: "11px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {number}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-head)", fontSize: "16px", fontWeight: 500, color: "var(--text-strong)" }}>
            {label}
          </span>
          {jp && (
            <span style={{ fontFamily: "var(--font-jp)", fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
              {jp}
            </span>
          )}
        </div>
        {description && (
          <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "14px", lineHeight: 1.65, color: "var(--text-muted)", maxWidth: "26ch" }}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
