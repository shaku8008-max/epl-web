"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import GoalsLaterFixtures from "@/components/GoalsLaterFixtures";
import NextRoundList from "@/components/NextRoundList";
import NnTeamStatsCard from "@/components/NnTeamStatsCard";
import PredictionCard from "@/components/PredictionCard";
import TeamPicker from "@/components/TeamPicker";
import { formatExpectedMargin } from "@/lib/format";
import type { Fixture, GoalsPrediction, NnTeamStats } from "@/lib/types";

type GoalsMatchupToolProps = {
  predictions: GoalsPrediction[];
  teamStats: NnTeamStats[];
  teams: string[];
  initialHome: string;
  initialAway: string;
  laterFixtures: (GoalsPrediction & { fixture_date: string })[];
};

export default function GoalsMatchupTool({
  predictions,
  teamStats,
  teams,
  initialHome,
  initialAway,
  laterFixtures,
}: GoalsMatchupToolProps) {
  const [pair, setPair] = useState({ home: initialHome, away: initialAway });

  useEffect(() => {
    const params = new URLSearchParams({ home: pair.home, away: pair.away });
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [pair]);

  const lookup = useMemo(() => {
    const map = new Map<string, GoalsPrediction>();
    for (const row of predictions) map.set(`${row.home}|${row.away}`, row);
    return map;
  }, [predictions]);
  const prediction = lookup.get(`${pair.home}|${pair.away}`) ?? null;

  function chooseHome(team: string) {
    setPair((p) => team === p.away ? { home: team, away: p.home } : { home: team, away: p.away });
  }

  function chooseAway(team: string) {
    setPair((p) => team === p.home ? { home: p.away, away: team } : { home: p.home, away: team });
  }

  function swap() {
    setPair((p) => ({ home: p.away, away: p.home }));
  }

  function selectFixture(fixture: Fixture) {
    setPair({ home: fixture.home, away: fixture.away });
    document.getElementById("prediction-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mt-8 space-y-6 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] lg:gap-6 lg:space-y-0">
      <div className="lg:col-span-2">
        <TeamPicker teams={teams} home={pair.home} away={pair.away} onHomeChange={chooseHome} onAwayChange={chooseAway} onSwap={swap} />
      </div>
      <div className="lg:col-span-2">
        <PredictionCard home={pair.home} away={pair.away} prediction={prediction} />
      </div>
      {prediction && (
        <Card className="lg:col-span-2" variant="white">
          <h2 className="font-heading text-2xl font-semibold lg:text-3xl">Expected goal margin</h2>
          <p className="mt-4 font-tabular text-2xl font-semibold text-primary lg:text-3xl">
            {formatExpectedMargin(prediction.expected_diff, pair.home, pair.away)}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Positive numbers favour the home team. The margin is an average, not a predicted final score.
          </p>
        </Card>
      )}
      <div className="lg:col-span-2">
        <NnTeamStatsCard home={pair.home} away={pair.away} teamStats={teamStats} />
      </div>
      <div className="lg:col-span-2">
        <NextRoundList predictions={predictions} onSelect={selectFixture} />
      </div>
      {laterFixtures.length > 0 && <div className="lg:col-span-2"><GoalsLaterFixtures fixtures={laterFixtures} /></div>}
    </div>
  );
}
