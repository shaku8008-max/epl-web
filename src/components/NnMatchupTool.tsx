"use client";

// Client component: owns the selected home and away teams so changing a
// dropdown, swapping teams, or choosing a next-round fixture updates instantly
// without another database request. The server passes every row once.

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import NextRoundList from "@/components/NextRoundList";
import NnTeamStatsCard from "@/components/NnTeamStatsCard";
import PredictionCard from "@/components/PredictionCard";
import StatsWaterfall from "@/components/StatsWaterfall";
import TeamPicker from "@/components/TeamPicker";
import { NN_STEP_DEFINITIONS, type PredictionExplain } from "@/lib/explain";
import { toWholePercentages } from "@/lib/format";
import type { Fixture, NnPrediction, NnTeamStats, Prediction } from "@/lib/types";

type NnMatchupToolProps = {
  predictions: NnPrediction[];
  mainPredictions: Prediction[];
  teamStats: NnTeamStats[];
  teams: string[];
  initialHome: string;
  initialAway: string;
  explainRows: PredictionExplain[];
};

export default function NnMatchupTool({
  predictions,
  mainPredictions,
  teamStats,
  teams,
  initialHome,
  initialAway,
  explainRows,
}: NnMatchupToolProps) {
  // A single state object keeps the swap and same-team selection logic simple.
  const [pair, setPair] = useState({ home: initialHome, away: initialAway });

  // Keep a shareable matchup in the address bar without reloading the page or
  // adding a browser-history entry for every dropdown change.
  useEffect(() => {
    const params = new URLSearchParams({ home: pair.home, away: pair.away });
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [pair]);

  // Each lookup is built once from the rows passed by the server, so choosing
  // another pair only reads local data in the browser.
  const neuralLookup = useMemo(() => {
    const map = new Map<string, NnPrediction>();
    for (const row of predictions) map.set(`${row.home}|${row.away}`, row);
    return map;
  }, [predictions]);
  const mainLookup = useMemo(() => {
    const map = new Map<string, Prediction>();
    for (const row of mainPredictions) map.set(`${row.home}|${row.away}`, row);
    return map;
  }, [mainPredictions]);

  const pairKey = `${pair.home}|${pair.away}`;
  const prediction = neuralLookup.get(pairKey) ?? null;
  const mainPrediction = mainLookup.get(pairKey) ?? null;

  function chooseHome(team: string) {
    // Picking the team already on the away side swaps the two selections.
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
    // A next-round row was clicked: return the visitor to the prediction card.
    document
      .getElementById("prediction-card")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const neuralPercentages = prediction
    ? toWholePercentages(prediction.p_home, prediction.p_draw, prediction.p_away)
    : null;
  const mainPercentages = mainPrediction
    ? toWholePercentages(
        mainPrediction.p_home,
        mainPrediction.p_draw,
        mainPrediction.p_away
      )
    : null;
  const comparisonRows = neuralPercentages && mainPercentages
    ? [
        { label: "Home", neural: neuralPercentages.home, main: mainPercentages.home },
        { label: "Draw", neural: neuralPercentages.draw, main: mainPercentages.draw },
        { label: "Away", neural: neuralPercentages.away, main: mainPercentages.away },
      ]
    : [];

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

      {prediction && (
        <>
          <Card variant="white">
            <h2 className="font-heading text-2xl font-semibold">Expected goals</h2>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted">{pair.home}</p>
                <p className="mt-1 font-tabular text-4xl font-semibold">
                  {prediction.xg_home.toFixed(1)}
                </p>
                <p className="text-sm text-muted">goals</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted">{pair.away}</p>
                <p className="mt-1 font-tabular text-4xl font-semibold">
                  {prediction.xg_away.toFixed(1)}
                </p>
                <p className="text-sm text-muted">goals</p>
              </div>
            </div>
            <p className="mt-6 border-t border-border pt-4 text-sm text-muted">
              These are the network&apos;s average predictions for each team&apos;s goals.
            </p>
          </Card>

          <Card variant="white">
            <h2 className="font-heading text-2xl font-semibold">
              Neural net vs main model
            </h2>
            {mainPercentages ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[20rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted">
                      <th scope="col" className="py-2 pr-3 font-medium">Outcome</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">Neural net %</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">Main model %</th>
                      <th scope="col" className="py-2 pl-2 text-right font-medium">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => {
                      const difference = row.neural - row.main;
                      return (
                        <tr key={row.label} className="border-b border-border last:border-0">
                          <th scope="row" className="py-3 pr-3 font-medium">{row.label}</th>
                          <td className="px-2 py-3 text-right font-tabular">{row.neural}%</td>
                          <td className="px-2 py-3 text-right font-tabular">{row.main}%</td>
                          <td className="py-3 pl-2 text-right font-tabular">
                            {difference >= 0 ? "+" : ""}{difference} pp
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">Main model: n/a</p>
            )}
          </Card>
        </>
      )}

      <div>
        <NnTeamStatsCard home={pair.home} away={pair.away} teamStats={teamStats} />
      </div>

      <StatsWaterfall
        home={pair.home}
        away={pair.away}
        explainRows={explainRows}
        stepDefinitions={NN_STEP_DEFINITIONS}
        description="The chart starts from the home win chance for an average match. Each step shows how one group of stats moves that chance for this pairing. The last bar is the network's home win chance to one decimal place, so it can differ slightly from the whole-number percentage in the prediction card."
        note="Each bar shows how many percentage points that group of stats moves the home win chance away from an average match."
      />

      <div className="lg:col-span-2">
        <NextRoundList predictions={predictions} onSelect={selectFixture} />
      </div>
    </div>
  );
}
