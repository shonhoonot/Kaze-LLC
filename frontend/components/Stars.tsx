"use client";

/** Read-only star rating display (supports halves). */
export function Stars({ value, size = "text-sm" }: { value: number; size?: string }) {
  return (
    <span className={`inline-flex ${size} leading-none text-amber-500`} aria-label={`${value} оноо`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative inline-block">
            <span className="text-line">★</span>
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              ★
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Interactive star picker for writing a review. */
export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <span className="inline-flex gap-1 text-2xl leading-none">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          aria-label={`${i} оноо`}
          className={i <= value ? "text-amber-500" : "text-line hover:text-amber-300"}
        >
          ★
        </button>
      ))}
    </span>
  );
}
