function colorFor(pct: number) {
  if (pct >= 75) return "#16803C";
  if (pct >= 45) return "#B45309";
  return "#B91C1C";
}

export function ReadinessSeal({ pct, size = 96 }: { pct: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div
      className="readiness-seal"
      style={{ "--pct": clamped, "--seal-color": colorFor(clamped), width: size, height: size } as React.CSSProperties}
      role="img"
      aria-label={`Tender readiness score: ${clamped}%`}
    >
      <span className="readiness-seal__value">{clamped}%</span>
    </div>
  );
}
