// A static probability bar for the Jev page: one rounded-full bar split into
// home/draw/away segments, reusing the site's outcome colours and the shared
// toWholePercentages helper. Server component (no animation, unlike the
// Predict page's PredictionCard).

import { toWholePercentages } from "@/lib/format";

type JevProbabilityBarProps = {
  label: string;
  pHome: number | null;
  pDraw: number | null;
  pAway: number | null;
};

const SEGMENTS = [
  { key: "home", color: "bg-home", barLabel: "Home" },
  { key: "draw", color: "bg-draw", barLabel: "Draw" },
  { key: "away", color: "bg-away", barLabel: "Away" },
] as const;

export default function JevProbabilityBar({
  label,
  pHome,
  pDraw,
  pAway,
}: JevProbabilityBarProps) {
  if (pHome === null || pDraw === null || pAway === null) {
    return (
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-sm text-muted">–</p>
      </div>
    );
  }

  const pct = toWholePercentages(pHome, pDraw, pAway);
  const values = [pct.home, pct.draw, pct.away];

  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-1 flex h-8 overflow-hidden rounded-full" aria-hidden="true">
        {SEGMENTS.map((s, i) => (
          <div
            key={s.key}
            className={`flex items-center justify-center overflow-hidden whitespace-nowrap text-xs font-semibold text-white ${s.color}`}
            style={{ width: `${values[i]}%` }}
          >
            {values[i] >= 15 ? `${s.barLabel} ${values[i]}%` : ""}
          </div>
        ))}
      </div>
      <p className="mt-1 text-sm tabular-nums text-muted">
        H {pct.home}% · D {pct.draw}% · A {pct.away}%
      </p>
    </div>
  );
}
