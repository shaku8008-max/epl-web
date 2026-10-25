// "Next round" card: upcoming fixtures within four days of the earliest one.
// Clicking a row selects that matchup and scrolls back to the prediction.
// Used inside MatchupTool (client bundle).

import { nextRoundFixtures } from "@/lib/fixtures";
import { formatFixtureDate, toWholePercentages } from "@/lib/format";
import type { Fixture, Prediction } from "@/lib/types";

type NextRoundListProps = {
  predictions: Prediction[];
  onSelect: (fixture: Fixture) => void;
};

export default function NextRoundList({
  predictions,
  onSelect,
}: NextRoundListProps) {
  const fixtures = nextRoundFixtures(predictions);

  // Hide the card entirely when there are no upcoming fixtures.
  if (fixtures.length === 0) return null;

  return (
    <section className="border-y border-border py-4" aria-labelledby="next-round-heading">
      <h2 id="next-round-heading" className="font-heading text-xl font-semibold lg:text-2xl">
        Next round
      </h2>
      <ul className="mt-2 divide-y divide-border">
        {fixtures.map((f) => {
          const pct = toWholePercentages(f.p_home, f.p_draw, f.p_away);
          const highest = Math.max(pct.home, pct.draw, pct.away);
          return (
            <li key={`${f.home}|${f.away}`}>
              <button
                type="button"
                onClick={() => onSelect(f)}
                className="flex min-h-11 w-full flex-wrap items-baseline gap-x-3 gap-y-1 px-2 py-3 text-left transition-colors hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label={`Select ${f.home} at home against ${f.away}`}
              >
                <span className="w-20 shrink-0 font-tabular text-sm text-muted">
                  {formatFixtureDate(f.fixture_date)}
                </span>
                <span className="flex-1 font-medium">
                  {f.home} v {f.away}
                </span>
                <span className="font-tabular text-sm text-muted">
                  <span className={pct.home === highest ? "font-semibold text-ink" : undefined}>
                    H {pct.home}%
                  </span>{" "}
                  ·{" "}
                  <span className={pct.draw === highest ? "font-semibold text-ink" : undefined}>
                    D {pct.draw}%
                  </span>{" "}
                  ·{" "}
                  <span className={pct.away === highest ? "font-semibold text-ink" : undefined}>
                    A {pct.away}%
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
