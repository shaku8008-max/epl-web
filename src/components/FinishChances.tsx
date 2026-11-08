"use client";

import { useState } from "react";
import { barHeights, ordinal } from "@/lib/outlook";

type FinishChancesProps = { probabilities: number[] | null; team: string };

export default function FinishChances({ probabilities, team }: FinishChancesProps) {
  const [active, setActive] = useState<number | null>(null);
  const heights = barHeights(probabilities);
  const valid = probabilities?.length === 20;

  function move(event: React.KeyboardEvent<HTMLButtonElement>, position: number) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = Math.max(0, Math.min(19, position + (event.key === "ArrowRight" ? 1 : -1)));
    document.getElementById(`${team}-finish-${next}`)?.focus();
    setActive(next);
  }

  if (!valid) return <span className="text-xs text-muted">Unavailable</span>;

  return (
    <div className="relative min-w-56" onMouseLeave={() => setActive(null)}>
      <div className="flex h-12 items-end gap-px" aria-label={`${team} finishing position chances`}>
        {probabilities.map((probability, index) => (
          <button
            key={index}
            id={`${team}-finish-${index}`}
            type="button"
            aria-label={`${ordinal(index + 1)}: ${(probability * 100).toFixed(1)}%`}
            className={`relative min-w-1 flex-1 rounded-t-sm outline-offset-2 transition-[filter] hover:brightness-90 focus:brightness-75 focus-visible:outline-2 focus-visible:outline-ink ${index < 4 ? "bg-better" : index >= 17 ? "bg-worse" : "bg-rule-strong"} ${index === 4 || index === 17 ? "before:absolute before:inset-y-0 before:-left-px before:border-l before:border-rule-strong" : ""}`}
            style={{ height: `${Math.max(heights[index], probability > 0 ? 5 : 2)}%` }}
            onFocus={() => setActive(index)}
            onBlur={() => setActive(null)}
            onMouseEnter={() => setActive(index)}
            onClick={() => setActive(active === index ? null : index)}
            onKeyDown={(event) => move(event, index)}
          />
        ))}
      </div>
      {active !== null && (
        <div className={`pointer-events-none absolute bottom-full z-10 mb-2 w-28 rounded-button border border-edge bg-white p-2 shadow-sm ${active < 3 ? "left-0" : active > 16 ? "right-0" : "-translate-x-1/2"}`} style={active >= 3 && active <= 16 ? { left: `${((active + 0.5) / 20) * 100}%` } : undefined}>
          <p className="font-tabular text-sm font-semibold">{ordinal(active + 1)}: {(probabilities[active] * 100).toFixed(1)}%</p>
        </div>
      )}
    </div>
  );
}
