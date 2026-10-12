// "Next round" card: upcoming fixtures within four days of the earliest one.
// Clicking a row selects that matchup and scrolls back to the prediction.
// Used inside MatchupTool (client bundle).

import Card from "@/components/Card";
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
    <Card>
      <h2 className="font-heading text-xl font-semibold">Next round</h2>
      <ul className="mt-2 divide-y divide-border">
        {fixtures.map((f) => {
          const pct = toWholePercentages(f.p_home, f.p_draw, f.p_away);
          return (
            <li key={`${f.home}|${f.away}`}>
              <button
                type="button"
                onClick={() => onSelect(f)}
                className="-mx-2 flex w-full flex-wrap items-baseline gap-x-3 gap-y-1 rounded-card px-2 py-3 text-left transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span className="w-20 shrink-0 text-sm text-muted">
                  {formatFixtureDate(f.fixture_date)}
                </span>
                <span className="flex-1 font-medium">
                  {f.home} v {f.away}
                </span>
                <span className="text-sm tabular-nums text-muted">
                  H {pct.home}% · D {pct.draw}% · A {pct.away}%
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}