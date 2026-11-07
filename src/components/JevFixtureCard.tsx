// One Jev fixture card: the fixture and date, when the news was fetched, the
// model's probabilities next to Jev's adjusted ones, the shift in points, and
// the team news for both sides. Server component: pure display.

import JevComparisonBars from "@/components/JevComparisonBars";
import JevTeamNews from "@/components/JevTeamNews";
import { formatFixtureDate, formatMelbourne } from "@/lib/format";
import { shiftGlyph, shiftLabel, shiftTone } from "@/lib/jev";
import type { JevPrediction } from "@/lib/types";

type JevFixtureCardProps = {
  fixture: JevPrediction;
};

export default function JevFixtureCard({ fixture }: JevFixtureCardProps) {
  const shift = shiftLabel(fixture.shift_points);
  const tone = shiftTone(fixture.shift_points);
  const shiftClasses = {
    better: "bg-better-soft text-better",
    worse: "bg-worse-soft text-worse",
    draw: "bg-draw-soft text-draw",
  } as const;

  return (
    <section className="border-t border-border py-8">
      <div className="rounded-card border-l-4 border-rule-strong bg-tint p-4 sm:p-5">
        <h2 className="font-heading text-3xl font-semibold lg:text-5xl">
          {fixture.home} v {fixture.away}
        </h2>
        <p className="mt-2 text-base text-muted">{formatFixtureDate(fixture.fixture_date)}</p>
      </div>
      <p className="mt-2 rounded-card border-l-4 border-open bg-open-soft px-4 py-2 text-sm text-muted">
        News fetched {formatMelbourne(fixture.generated_at)}
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-10">
        <div className="rounded-card border-l-4 border-better bg-better-soft p-4 sm:p-5">
          <JevComparisonBars fixture={fixture} />
          {shift && (
            <p className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${shiftClasses[tone]}`}>
              {shiftGlyph(fixture.shift_points) && <span aria-hidden="true">{shiftGlyph(fixture.shift_points)}</span>}
              {shift}
            </p>
          )}
        </div>
        <div className="grid gap-6 rounded-card border-l-4 border-draw bg-draw-soft p-4 sm:grid-cols-2 sm:p-5">
          <JevTeamNews teamName={fixture.home} news={fixture.news?.home ?? null} />
          <JevTeamNews teamName={fixture.away} news={fixture.news?.away ?? null} />
        </div>
      </div>
    </section>
  );
}
