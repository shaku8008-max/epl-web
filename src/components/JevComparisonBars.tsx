import { toWholePercentages } from "@/lib/format";
import { playerLevel } from "@/lib/jev";
import type { JevPrediction, JevTeamNews } from "@/lib/types";

type Probabilities = {
  home: number;
  draw: number;
  away: number;
};

const segments = [
  { key: "home", label: "Home", colour: "bg-home" },
  { key: "draw", label: "Draw", colour: "bg-draw" },
  { key: "away", label: "Away", colour: "bg-away" },
] as const;

function validProbabilities(
  home: number | null,
  draw: number | null,
  away: number | null
): Probabilities | null {
  if (
    typeof home !== "number" ||
    typeof draw !== "number" ||
    typeof away !== "number" ||
    !Number.isFinite(home) ||
    !Number.isFinite(draw) ||
    !Number.isFinite(away)
  ) {
    return null;
  }

  return toWholePercentages(home, draw, away);
}

function countRelevantPlayers(news: JevTeamNews | null): number | null {
  if (!news?.players) return null;
  return news.players.filter((player) => playerLevel(player) !== null).length;
}

function comparisonSummary(fixture: JevPrediction): string {
  const shift = fixture.shift_points;
  if (typeof shift !== "number" || !Number.isFinite(shift)) {
    return "Jev's change is unavailable.";
  }
  if (Math.abs(shift) < 0.5) {
    return "Jev made no meaningful change.";
  }

  const direction = shift > 0 ? "raised" : "lowered";
  const points = Math.abs(shift).toFixed(1);
  const reasonTeam = shift > 0 ? fixture.away : fixture.home;
  const reasonCount = countRelevantPlayers(shift > 0 ? fixture.news?.away ?? null : fixture.news?.home ?? null);

  if (reasonCount === null || reasonCount === 0) {
    return `Jev ${direction} ${fixture.home}'s chance by ${points} points.`;
  }

  const playerWord = reasonCount === 1 ? "player is" : "players are";
  return `Jev ${direction} ${fixture.home}'s chance by ${points} points: ${reasonCount} ${reasonTeam} ${playerWord} out or doubtful.`;
}

function resultLabel(fixture: JevPrediction): string | null {
  if (fixture.result === "H") return `${fixture.home} win`;
  if (fixture.result === "A") return `${fixture.away} win`;
  if (fixture.result === "D") return "Draw";
  return null;
}

function resultDirection(fixture: JevPrediction): string {
  if (!fixture.result) return "The Jev comparison is unavailable.";
  const key = fixture.result === "H" ? "home" : fixture.result === "D" ? "draw" : "away";
  const outcome = fixture.result === "H" ? "home" : fixture.result === "D" ? "draw" : "away";
  const base = { home: fixture.p_home, draw: fixture.p_draw, away: fixture.p_away }[key];
  const adjusted = { home: fixture.adj_home, draw: fixture.adj_draw, away: fixture.adj_away }[key];
  if (
    typeof base !== "number" ||
    typeof adjusted !== "number" ||
    !Number.isFinite(base) ||
    !Number.isFinite(adjusted)
  ) {
    return "The Jev comparison is unavailable.";
  }
  if (adjusted === base) return `Jev did not change the ${outcome} chance.`;
  return adjusted > base
    ? `Jev moved the ${outcome} chance toward this result.`
    : `Jev moved the ${outcome} chance away from this result.`;
}

function Bar({ label, values }: { label: string; values: Probabilities | null }) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-2">
      <span className="text-sm font-medium text-muted">{label}</span>
      {values ? (
        <div className="flex h-3 overflow-hidden rounded-full" aria-hidden="true">
          {segments.map((segment) => (
            <span
              key={segment.key}
              className={segment.colour}
              style={{ width: `${values[segment.key]}%` }}
            />
          ))}
        </div>
      ) : (
        <span className="text-sm text-muted">Probabilities unavailable</span>
      )}
    </div>
  );
}

type JevComparisonBarsProps = {
  fixture: JevPrediction;
};

export default function JevComparisonBars({ fixture }: JevComparisonBarsProps) {
  const model = validProbabilities(fixture.p_home, fixture.p_draw, fixture.p_away);
  const withJev = validProbabilities(fixture.adj_home, fixture.adj_draw, fixture.adj_away);
  const result = resultLabel(fixture);

  return (
    <div role="group" aria-label="Model probabilities before and after Jev">
      <div className="space-y-2">
        <Bar label="Model" values={model} />
        <Bar label="With Jev" values={withJev} />
      </div>

      {model && withJev ? (
        <div className="mt-2 grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-2">
          <span aria-hidden="true" />
          <div className="grid grid-cols-3 gap-1 text-center font-tabular text-xs text-muted">
            {segments.map((segment) => (
              <span key={segment.key} className="min-w-0 whitespace-nowrap">
                <span className={segment.key === "draw" ? "hidden sm:inline" : ""}>
                  {segment.label}{" "}
                </span>
                {model[segment.key]}% → {withJev[segment.key]}%
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="sr-only">
          Model and Jev percentages are unavailable for home, draw and away.
        </p>
      )}

      <p className="mt-3 text-sm leading-relaxed text-muted">{comparisonSummary(fixture)}</p>

      {result && (
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Result: {result}. {resultDirection(fixture)}
        </p>
      )}

      <p className="sr-only">
        {model
          ? `Model: Home ${model.home}%, Draw ${model.draw}%, Away ${model.away}%.`
          : "Model percentages unavailable."}{" "}
        {withJev
          ? `With Jev: Home ${withJev.home}%, Draw ${withJev.draw}%, Away ${withJev.away}%.`
          : "With Jev percentages unavailable."}
      </p>
    </div>
  );
}
