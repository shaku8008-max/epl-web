// Jev page: for each upcoming fixture, how the latest team news changes the
// model's win chances. Server component; reads the public jev_predictions
// table with the anon key only.

import type { Metadata } from "next";
import Link from "next/link";
import JevFixtureCard from "@/components/JevFixtureCard";
import { getJevPredictions } from "@/lib/data";
import { isStale } from "@/lib/jev";
import type { JevPrediction } from "@/lib/types";

// Request-time render: queries run fresh on every load, never at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jev",
  description: "How the latest team news changes the model's win chances.",
};

// Plain loader with no JSX, so query problems can be caught and reported
// instead of crashing the page (the linter forbids JSX inside try/catch).
async function loadJevPage(): Promise<
  { fixtures: JevPrediction[] } | { error: string }
> {
  try {
    const fixtures = await getJevPredictions();
    return { fixtures };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export default async function JevPage() {
  const result = await loadJevPage();

  if ("error" in result) {
    return (
      <section>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-primary">Jev</h1>
        <p className="mt-3 max-w-2xl text-lg">
          How the latest team news changes the model&apos;s win chances.
        </p>
        <div className="mt-8 border-y border-border bg-tint p-6">
          <p className="font-semibold">Jev is unavailable right now</p>
          <p className="mt-1 text-sm text-muted">{result.error}</p>
        </div>
      </section>
    );
  }

  const { fixtures } = result;
  const newest = fixtures.reduce<string | null>(
    (max, f) => (max === null || f.generated_at > max ? f.generated_at : max),
    null
  );
  const stale = isStale(newest);

  return (
    <section className="lg:w-[min(80rem,calc(100vw_-_2rem))] lg:ml-[calc((100%_-_min(80rem,calc(100vw_-_2rem)))/2)]">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-primary">Jev</h1>
      <p className="mt-3 max-w-2xl text-lg">
        An experiment: Jev adjusts the model&apos;s win chances using only injury
        and suspension news from the Fantasy Premier League feed.
      </p>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        For fun only. Not betting advice.
      </p>
      <p className="mt-3">
        <Link
          href="/jev/scoreboard"
          className="font-medium text-primary underline underline-offset-2"
        >
          See how Jev is doing
        </Link>
      </p>

      {stale && (
        <div className="mt-6 border-y border-border bg-tint p-6 text-ink">
          <p className="font-semibold">News may be out of date</p>
          <p className="mt-1 text-sm text-muted">
            The latest news was fetched more than two days ago.
          </p>
        </div>
      )}

      {fixtures.length === 0 ? (
        <div className="mt-6 border-y border-border py-6">
          <p className="text-muted">
            No upcoming fixtures with news yet. Check back after the next
            refresh.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          {fixtures.map((f) => (
            <JevFixtureCard
              key={`${f.home}|${f.away}|${f.fixture_date}`}
              fixture={f}
            />
          ))}
        </div>
      )}
    </section>
  );
}
