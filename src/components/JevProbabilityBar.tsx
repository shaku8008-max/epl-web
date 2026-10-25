// A static probability ribbon for the Jev page. It follows the Predict page's
// bar and equal-width percentage columns without its counting animation.

import { toWholePercentages } from "@/lib/format";
import OutcomeKey from "@/components/OutcomeKey";

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
        <p className="text-base font-medium">{label}</p>
        <div className="mt-2 grid min-w-0 grid-cols-3 gap-2" aria-label={`${label} probabilities unavailable`}>
          {SEGMENTS.map((s) => (
            <div key={s.key} className="min-w-0 text-center">
              <span className="mt-2 block font-tabular text-3xl leading-none text-muted lg:text-4xl">-</span>
              <span className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted">
                <OutcomeKey label={s.barLabel} color={s.color} />
              </span>
            </div>
          ))}
        </div>
        <p className="sr-only">{label}: Home unavailable, Draw unavailable, Away unavailable.</p>
      </div>
    );
  }

  const pct = toWholePercentages(pHome, pDraw, pAway);
  const values = [pct.home, pct.draw, pct.away];

  return (
    <div>
      <p className="text-base font-medium">{label}</p>
      <div className="mt-2 flex h-8 overflow-hidden rounded-full lg:h-10" aria-hidden="true">
        {SEGMENTS.map((s, i) => (
          <div
            key={s.key}
            className={`flex min-w-0 items-center justify-center overflow-hidden whitespace-nowrap px-2 text-sm font-semibold text-white ${s.color}`}
            style={{ width: `${values[i]}%` }}
          >
            {values[i] >= 15 ? `${s.barLabel} ${values[i]}%` : ""}
          </div>
        ))}
      </div>
      <div className="mt-3 grid min-w-0 grid-cols-3 gap-2" aria-hidden="true">
        {SEGMENTS.map((s, i) => (
          <div key={s.key} className="min-w-0 text-center">
            <span className="mt-2 block font-tabular text-3xl leading-none text-ink lg:text-4xl">
              {values[i]}%
            </span>
            <span className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted">
              <OutcomeKey label={s.barLabel} color={s.color} />
            </span>
          </div>
        ))}
      </div>
      <p className="sr-only">
        {label}: Home {pct.home}%, Draw {pct.draw}%, Away {pct.away}%.
      </p>
    </div>
  );
}
