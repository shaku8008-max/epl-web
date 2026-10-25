"use client";

// Client component: owns the home/away selection so swapping teams updates
// instantly in the browser with no extra network requests. The server passes
// all 380 prediction rows and the 20 team_stats rows once when the page loads.

import { useEffect, useMemo, useState } from "react";
import NextRoundList from "@/components/NextRoundList";
import PredictionCard from "@/components/PredictionCard";
import TeamPicker from "@/components/TeamPicker";
import TeamStatsCard from "@/components/TeamStatsCard";
import type { Fixture, Prediction, TeamStats } from "@/lib/types";

type MatchupToolProps = {
  predictions: Prediction[];
  teams: string[];
  teamStats: TeamStats[];
  initialHome: string;
  initialAway: string;
};

export default function MatchupTool({
  predictions,
  teams,
  teamStats,
  initialHome,
  initialAway,
}: MatchupToolProps) {
  // A single state object, so the swap logic always works on fresh values.
  const [pair, setPair] = useState({ home: initialHome, away: initialAway });

  // Keep ?home=...&away=... in the address bar so a matchup can be shared or
  // bookmarked. history.replaceState updates the URL without reloading the
  // page and without adding a history entry on every change. (Next.js 16
  // stays in sync with these native history calls.)
  useEffect(() => {
    const params = new URLSearchParams({ home: pair.home, away: pair.away });
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [pair]);

  // Lookup table: "Home|Away" -> its prediction row.
  const lookup = useMemo(() => {
    const map = new Map<string, Prediction>();
    for (const row of predictions) map.set(`${row.home}|${row.away}`, row);
    return map;
  }, [predictions]);

  const prediction = lookup.get(`${pair.home}|${pair.away}`) ?? null;

  function chooseHome(team: string) {
    // Picking the team already chosen on the other side swaps the selections.
    setPair((p) =>
      team === p.away ? { home: team, away: p.home } : { home: team, away: p.away }
    );
  }

  function chooseAway(team: string) {
    setPair((p) =>
      team === p.home ? { home: p.away, away: team } : { home: p.home, away: team }
    );
  }

  function swap() {
    setPair((p) => ({ home: p.away, away: p.home }));
  }

  function selectFixture(fixture: Fixture) {
    setPair({ home: fixture.home, away: fixture.away });
    // A next-round row was clicked: scroll back up to the prediction card.
    document
      .getElementById("prediction-card")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mt-8 space-y-6 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] lg:gap-6 lg:space-y-0">
      <div className="lg:col-span-2">
        <TeamPicker
          teams={teams}
          home={pair.home}
          away={pair.away}
          onHomeChange={chooseHome}
          onAwayChange={chooseAway}
          onSwap={swap}
        />
      </div>

      <div className="lg:col-span-2">
        <PredictionCard home={pair.home} away={pair.away} prediction={prediction} />
      </div>

      <div>
        <TeamStatsCard home={pair.home} away={pair.away} teamStats={teamStats} />
      </div>

      <div>
        <NextRoundList predictions={predictions} onSelect={selectFixture} />
      </div>
    </div>
  );
}
