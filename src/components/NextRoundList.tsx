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
    <section className="py-4" aria-labelledby="next-round-heading">
      <h2 id="next-round-heading" className="font-heading text-2xl font-semibold lg:text-3xl">
        Next round
      </h2>
      <ul className="mt-2 divide-y divide-border border-y border-border">
        <li
          aria-hidden="true"
          className="grid grid-cols-[minmax(0,1fr)_repeat(3,3.25rem)] items-end gap-x-2 px-2 py-2 text-right text-sm font-semibold text-ink"
        >
          <span className="text-left">Fixture</span>
          <span>Home</span>
          <span>Draw</span>
          <span>Away</span>
        </li>
        {fixtures.map((f) => {
          const pct = toWholePercentages(f.p_home, f.p_draw, f.p_away);
          const highest = Math.max(pct.home, pct.draw, pct.away);
          return (
            <li key={`${f.home}|${f.away}`}>
              <button
                type="button"
                onClick={() => onSelect(f)}
                className="grid min-h-12 w-full grid-cols-[minmax(0,1fr)_repeat(3,3.25rem)] items-center gap-x-2 px-2 py-3 text-left transition-colors hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                aria-label={`Select ${f.home} at home against ${f.away}`}
              >
                <span className="min-w-0">
                  <span className="block break-words font-medium">{f.home} v {f.away}</span>
                  <span className="mt-1 block text-sm text-muted">
                    {formatFixtureDate(f.fixture_date)}
                  </span>
                </span>
                <span className="text-right font-tabular text-base text-muted">
                  <span className="sr-only">Home </span>
                  <span className={pct.home === highest ? "font-semibold text-ink" : undefined}>
                    H {pct.home}%
                  </span>{" "}
                </span>
                <span className="text-right font-tabular text-base text-muted">
                  <span className="sr-only">Draw </span>
                  <span className={pct.draw === highest ? "font-semibold text-ink" : undefined}>
                    D {pct.draw}%
                  </span>
                </span>
                <span className="text-right font-tabular text-base text-muted">
                  <span className="sr-only">Away </span>
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
