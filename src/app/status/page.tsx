// Troubleshooting page (kept out of the tab navigation): proves the site can
// reach Supabase. It shows the row counts, the latest run and the team list,
// or the query error messages if anything fails.
//
// This is a "server component": it runs on the server only, so the Supabase
// calls below happen there, not in the browser.

import type { Metadata } from "next";
import { getSupabaseClient } from "@/lib/supabase";
import { formatMelbourne } from "@/lib/format";
import type { Run } from "@/lib/types";

// Render on every request instead of at build time, so the queries run fresh
// each time you load the page.
export const dynamic = "force-dynamic";

// Kept out of search results: a troubleshooting page, not site content.
export const metadata: Metadata = {
  title: "Status",
  description: "Supabase connection check for the EPL Predictor site.",
  robots: { index: false, follow: false },
};

// What the page shows, once all queries have succeeded.
type CheckData = {
  predictionsCount: number | null;
  teamStatsCount: number | null;
  run: Run | null;
  teamNames: string[];
};

// Runs the four queries and returns either the data or a list of error
// messages. This is a plain function with no JSX, so query problems can be
// caught here and reported on the page instead of crashing it.
async function loadCheckData(): Promise<
  { data: CheckData } | { errors: string[] }
> {
  try {
    const supabase = getSupabaseClient();

    // Row counts. The second argument asks Postgrest for the count only,
    // without transferring the rows.
    const predictions = await supabase
      .from("predictions")
      .select("*", { count: "exact", head: true });
    const teamStats = await supabase
      .from("team_stats")
      .select("*", { count: "exact", head: true });

    // Latest job run: newest first, then keep the first row.
    const runs = await supabase
      .from("runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1);

    // Team names, ordered alphabetically by Postgres.
    const teams = await supabase.from("team_stats").select("team").order("team");

    // supabase-js reports failures on `error` instead of throwing, so check each.
    const errors: string[] = [];
    if (predictions.error)
      errors.push(`predictions count: ${predictions.error.message}`);
    if (teamStats.error)
      errors.push(`team_stats count: ${teamStats.error.message}`);
    if (runs.error) errors.push(`runs: ${runs.error.message}`);
    if (teams.error) errors.push(`team names: ${teams.error.message}`);
    if (errors.length > 0) return { errors };

    // Cast the rows to our own types. supabase-js cannot infer them here
    // because we did not generate a Database type from the schema.
    const run = (runs.data?.[0] ?? null) as Run | null;
    const teamRows = (teams.data ?? []) as { team: string }[];

    return {
      data: {
        predictionsCount: predictions.count,
        teamStatsCount: teamStats.count,
        run,
        teamNames: teamRows.map((t) => t.team),
      },
    };
  } catch (err) {
    // Covers missing env vars (getSupabaseClient throws) and any other error.
    return { errors: [err instanceof Error ? err.message : String(err)] };
  }
}

export default async function StatusPage() {
  const result = await loadCheckData();

  if ("errors" in result) {
    return (
      <section>
        <h1 className="font-heading text-3xl font-bold text-primary">
          Supabase connection check
        </h1>
        <p className="mt-4 font-semibold text-red-700">Query failed:</p>
        <ul className="mt-2 list-disc pl-6">
          {result.errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </section>
    );
  }

  const { predictionsCount, teamStatsCount, run, teamNames } = result.data;

  return (
    <section>
      <h1 className="font-heading text-3xl font-bold text-primary">
        Supabase connection check
      </h1>

      <h2 className="mt-6 font-heading text-xl font-semibold">Row counts</h2>
      <ul className="mt-2 list-disc pl-6">
        <li>predictions: {predictionsCount} rows (expected 380)</li>
        <li>team_stats: {teamStatsCount} rows (expected 20)</li>
      </ul>

      <h2 className="mt-6 font-heading text-xl font-semibold">Latest run</h2>
      {run ? (
        <ul className="mt-2 list-disc pl-6">
          <li>data_as_of: {formatMelbourne(run.data_as_of)} (Melbourne time)</li>
          <li>status: {run.status}</li>
          <li>model_version: {run.model_version}</li>
        </ul>
      ) : (
        <p className="mt-2">No rows found in runs.</p>
      )}

      <h2 className="mt-6 font-heading text-xl font-semibold">
        Teams ({teamNames.length})
      </h2>
      <ul className="mt-2 list-disc pl-6">
        {teamNames.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </section>
  );
}