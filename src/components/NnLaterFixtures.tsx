// Compact list for neural fixtures outside the next round. Rows are grouped by
// fixture date so a long list stays scannable on a phone.

import OutcomeKey from "@/components/OutcomeKey";
import { probabilityColour } from "@/lib/colour";
import { formatFixtureDate, formatXg, toWholePercentages } from "@/lib/format";
import type { NnPrediction } from "@/lib/types";

type NnLaterFixturesProps = {
  fixtures: (NnPrediction & { fixture_date: string })[];
};

export default function NnLaterFixtures({ fixtures }: NnLaterFixturesProps) {
  const groups = fixtures.reduce<Map<string, typeof fixtures>>((result, fixture) => {
    const group = result.get(fixture.fixture_date) ?? [];
    group.push(fixture);
    result.set(fixture.fixture_date, group);
    return result;
  }, new Map());

  return (
    <details className="mt-10 border-y border-border">
          <summary className="flex min-h-12 cursor-pointer items-center py-3 font-heading text-2xl font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
        Later fixtures
      </summary>
      <div className="pb-5">
        <p className="mb-3 text-xs text-muted">Green = home, red = away, grey = draw.</p>
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
           <OutcomeKey label="H" color="bg-better" />
          <OutcomeKey label="D" color="bg-draw" />
           <OutcomeKey label="A" color="bg-worse" />
        </div>
        {[...groups.entries()].map(([date, dateFixtures]) => (
          <div key={date} className="border-t border-border py-4 first:border-t-0">
            <h3 className="font-semibold">{formatFixtureDate(date)}</h3>
            <ul className="mt-2 divide-y divide-border">
              {dateFixtures.map((fixture) => {
                const pct = toWholePercentages(
                  fixture.p_home,
                  fixture.p_draw,
                  fixture.p_away
                );
                return (
                  <li
                    key={`${fixture.home}|${fixture.away}|${fixture.fixture_date}`}
                    className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block break-words font-medium">
                        {fixture.home} v {fixture.away}
                      </span>
                       <span className="mt-1 block font-tabular text-sm text-ink">
                         <span className={probabilityColour("home", pct.home, pct.draw, pct.away)}>H {pct.home}%</span>{" "}
                         <span className={probabilityColour("draw", pct.home, pct.draw, pct.away)}>D {pct.draw}%</span>{" "}
                         <span className={probabilityColour("away", pct.home, pct.draw, pct.away)}>A {pct.away}%</span>
                      </span>
                    </span>
                    <span className="self-center whitespace-nowrap font-tabular text-sm text-muted">
                      {formatXg(fixture.xg_home)} &ndash; {formatXg(fixture.xg_away)} xG
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
