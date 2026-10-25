// One Jev fixture card: the fixture and date, when the news was fetched, the
// model's probabilities next to Jev's adjusted ones, the shift in points, and
// the team news for both sides. Server component: pure display.

import Card from "@/components/Card";
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
    <Card variant="white">
      <h2 className="font-heading text-xl font-semibold">
        {fixture.home} v {fixture.away}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {formatFixtureDate(fixture.fixture_date)} · News fetched{" "}
        {formatMelbourne(fixture.generated_at)}
      </p>

      <div className="mt-4 space-y-4">
        <JevProbabilityBar
          label="Model"
          pHome={fixture.p_home}
          pDraw={fixture.p_draw}
          pAway={fixture.p_away}
        />
        <JevProbabilityBar
          label="Jev"
          pHome={fixture.adj_home}
          pDraw={fixture.adj_draw}
          pAway={fixture.adj_away}
        />
      </div>

      {shift && <p className="mt-3 text-sm font-medium">{shift}</p>}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <JevTeamNews teamName={fixture.home} news={fixture.news?.home ?? null} />
        <JevTeamNews teamName={fixture.away} news={fixture.news?.away ?? null} />
      </div>
    </Card>
  );
}
