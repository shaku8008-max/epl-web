// One Jev fixture card: the fixture and date, when the news was fetched, the
// model's probabilities next to Jev's adjusted ones, the shift in points, and
// the team news for both sides. Server component: pure display.

import JevProbabilityBar from "@/components/JevProbabilityBar";
import JevTeamNews from "@/components/JevTeamNews";
import { formatFixtureDate, formatMelbourne } from "@/lib/format";
import { shiftLabel } from "@/lib/jev";
import type { JevPrediction } from "@/lib/types";

type JevFixtureCardProps = {
  fixture: JevPrediction;
};

export default function JevFixtureCard({ fixture }: JevFixtureCardProps) {
  const shift = shiftLabel(fixture.shift_points);

  return (
    <section className="border-t border-border py-8">
      <h2 className="font-heading text-xl font-semibold">
        {fixture.home} v {fixture.away}
      </h2>
      <div className="mt-2 space-y-1 text-sm text-muted">
        <p>{formatFixtureDate(fixture.fixture_date)}</p>
        <p>News fetched {formatMelbourne(fixture.generated_at)}</p>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-10">
        <div className="space-y-5">
          <JevProbabilityBar label="Model" pHome={fixture.p_home} pDraw={fixture.p_draw} pAway={fixture.p_away} />
          <JevProbabilityBar label="Jev" pHome={fixture.adj_home} pDraw={fixture.adj_draw} pAway={fixture.adj_away} />
          {shift && <p className="text-sm font-medium">{shift}</p>}
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <JevTeamNews teamName={fixture.home} news={fixture.news?.home ?? null} />
          <JevTeamNews teamName={fixture.away} news={fixture.news?.away ?? null} />
        </div>
      </div>
    </section>
  );
}
