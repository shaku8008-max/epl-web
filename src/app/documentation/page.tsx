import type { Metadata } from "next";
import Link from "next/link";
import Card from "@/components/Card";
import ModelExplorer from "@/components/ModelExplorer";
import LinkButton from "@/components/LinkButton";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "A plain-English guide to the data, models, predictions and limits behind EPL Predictor.",
};

export default function DocumentationPage() {
  return (
    <article className="max-w-3xl">
      <header className="border-b border-edge pb-8">
         <p className="font-tabular text-sm text-ink">A plain-English guide</p>
        <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight text-primary sm:text-5xl">
          How it works
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          What the numbers mean, where they come from, and how much confidence to place in them.
        </p>
      </header>

      <div className="divide-y divide-border">
        <section className="py-8" aria-labelledby="what-this-site-does">
          <h2 id="what-this-site-does" className="font-heading text-2xl font-semibold">
            What this site does
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            EPL Predictor estimates the chances of a home win, draw or away win for upcoming Premier League matches. The predictions are updated daily as new results, fixtures and team information become available.
          </p>
        </section>

        <section className="py-8" aria-labelledby="where-data-comes-from">
          <h2 id="where-data-comes-from" className="font-heading text-2xl font-semibold">
            Where the data comes from
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            The site uses past results and bookmaker odds from{" "}
            <a className="font-medium text-ink underline decoration-ink/40 underline-offset-2 hover:decoration-ink" href="https://www.football-data.co.uk/" target="_blank" rel="noreferrer">football-data.co.uk</a>, fixtures and injury news from the official Fantasy Premier League data, and expected goals (xG) from{" "}
            <a className="font-medium text-ink underline decoration-ink/40 underline-offset-2 hover:decoration-ink" href="https://understat.com/" target="_blank" rel="noreferrer">Understat</a>. xG is an estimate of how likely a shot was to become a goal, based on things such as its position and situation.
          </p>
        </section>

        <section className="py-8" aria-labelledby="the-models">
          <h2 id="the-models" className="font-heading text-2xl font-semibold">
            The models
          </h2>
          <ModelExplorer />
        </section>

        <section className="py-8" aria-labelledby="goals-model">
          <h2 id="goals-model" className="font-heading text-2xl font-semibold">
            The linear goals model
          </h2>
          <div className="mt-3 space-y-4 leading-relaxed text-muted">
            <p>
              The <Link className="font-medium text-ink underline decoration-ink/40 underline-offset-2 hover:decoration-ink" href="/goals">goals model</Link> is a linear margin model. It predicts the expected goal difference, then converts that margin into home-win, draw and away-win probabilities. The live version is V1, the linear version, and it runs daily at about 05:57 UTC.
            </p>
            <p>
              A Poisson version, V2, tested slightly better, but it is not built or live. V1 appears on the goals page and in the track record.
            </p>
            <p>
              The goals shown for each side are display-only: two extra least-squares model heads estimate home goals and away goals. Home goals minus away goals equals the expected goal difference exactly, so these numbers do not change the match probabilities. The per-side estimates have not been tested separately.
            </p>
          </div>
        </section>

        <section className="py-8" aria-labelledby="goals-evidence">
          <h2 id="goals-evidence" className="font-heading text-2xl font-semibold">
            What the checks found
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            Log loss measures the quality of probability predictions: it rewards a high chance for what happened and penalises confident mistakes, so lower is better. The development check covered 4,560 matches from 2012-2023; the hold-out check covered 760 matches from 2024 and 2025.
          </p>
          <div className="mt-5 overflow-x-auto rounded-card border border-edge bg-white">
            <table className="w-full min-w-[26rem] text-left text-sm">
              <caption className="sr-only">Development and hold-out mean log loss</caption>
              <thead className="border-b border-border bg-tint text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">Approach</th>
                  <th scope="col" className="px-4 py-3 text-right">Dev</th>
                  <th scope="col" className="px-4 py-3 text-right">Hold-out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <th scope="row" className="px-4 py-3 font-medium">Standard logistic</th>
                  <td className="px-4 py-3 text-right font-tabular">0.9717</td>
                  <td className="px-4 py-3 text-right font-tabular">1.0114</td>
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-3 font-medium">Goals V1, linear</th>
                  <td className="px-4 py-3 text-right font-tabular">0.9653</td>
                  <td className="px-4 py-3 text-right font-tabular">1.0102</td>
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-3 font-medium">Goals V2, Poisson</th>
                  <td className="px-4 py-3 text-right font-tabular">0.9644</td>
                  <td className="px-4 py-3 text-right font-tabular">1.0067</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-3 leading-relaxed text-muted">
            <p>
              V2 passed the pre-written hold-out rule&apos;s +0.003 threshold, but its interval touched zero. V1 was inconclusive under that rule. It shipped because I chose to ship it, not because the check confirmed that it is better.
            </p>
            <p>
              Bet365 early odds, normalised into probabilities, still beat standard logistic by about 0.015 log loss on development data and about 0.012 on the hold-out. No model here beats the bookmaker. The results-only models are within about 0.003 of each other, apart from the small goals gain.
            </p>
          </div>
        </section>

        <section className="py-8" aria-labelledby="read-the-numbers">
          <h2 id="read-the-numbers" className="font-heading text-2xl font-semibold">
            How to read the numbers
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            Percentages are chances, not certainties: the highest of home, draw and away is colour-coded, but a 60% chance still loses 4 times in 10. The waterfall shows which factors push the estimate toward the home or away team. On team stats, “better” and “worse” colours compare the two teams for that particular measure; they do not mean a team is simply good or bad overall.
          </p>
        </section>

        <section className="py-8" aria-labelledby="season-outlook">
          <h2 id="season-outlook" className="font-heading text-2xl font-semibold">
            Season outlook
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            The <Link className="font-medium text-ink underline decoration-ink/40 underline-offset-2 hover:decoration-ink" href="/neural/outlook">season outlook</Link> plays out 10,000 possible seasons using the Neural network&apos;s expected goals, then shows how often each team finishes in each position. The finish-chance bars show those percentages at a glance. Ties are settled first by goal difference, then by goals scored.
          </p>
        </section>

        <section className="py-8" aria-labelledby="track-record">
          <h2 id="track-record" className="font-heading text-2xl font-semibold">
            Track record
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            The <Link className="font-medium text-ink underline decoration-ink/40 underline-offset-2 hover:decoration-ink" href="/track-record">track record</Link> uses log loss: a score that rewards a model for giving a high chance to what happened and penalises it for being confidently wrong, so lower is better. The honesty rule is simple: only predictions made before the match day count.
          </p>
        </section>

        <section className="py-8" aria-labelledby="jev">
          <h2 id="jev" className="font-heading text-2xl font-semibold">
            Jev
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            Jev is an experimental layer that reads team news, including injuries and doubtful players, and nudges the model&apos;s probabilities. It is shown separately from the main models and has its own scoreboard, so it can be judged on its own.
          </p>
        </section>

        <section className="py-8" aria-labelledby="what-did-not-help">
          <h2 id="what-did-not-help" className="font-heading text-2xl font-semibold">
            What we tried that did not help
          </h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 leading-relaxed text-muted">
            <li>
              Splitting each season into early, middle and late periods, about 1,520 matches each, found no detectable phase effect. The bookmaker&apos;s lead was largest early (+0.0214) and smaller late (+0.0137), but the 95% interval for the difference ran from -0.0069 to +0.0222. The test was too coarse to rule out a small effect; this is not proof that the effect is zero.
            </li>
          </ul>
        </section>

        <section className="py-8" aria-labelledby="honest-limits">
          <Card variant="white" className="border-rule-strong bg-tint p-6 sm:p-7">
            <h2 id="honest-limits" className="font-heading text-2xl font-semibold">
              Honest limits
            </h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 leading-relaxed text-muted">
              <li>The live records are far too small to judge anything: Lean has 26 scored matches and the goals model has none yet.</li>
              <li>The xG data source has been unavailable since late October. The site keeps the last saved copy and retries daily. Tests on past seasons found no measurable difference from stale or missing xG, but you should know this limitation exists.</li>
              <li>The season outlook assumes team strength stays at today&apos;s values and ignores injuries and model error, so extreme percentages are probably overconfident.</li>
              <li>This is a learning project, not betting advice.</li>
            </ul>

            <div className="mt-6 overflow-hidden rounded-card border border-edge bg-white">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Backtest log loss comparison</caption>
                <thead className="border-b border-border bg-tint text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3">Approach</th>
                    <th scope="col" className="px-4 py-3 text-right">Log loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <th scope="row" className="px-4 py-3 font-medium">Lean</th>
                    <td className="px-4 py-3 text-right font-tabular">1.0037</td>
                  </tr>
                  <tr>
                    <th scope="row" className="px-4 py-3 font-medium">Neural network</th>
                    <td className="px-4 py-3 text-right font-tabular">1.0069</td>
                  </tr>
                  <tr>
                    <th scope="row" className="px-4 py-3 font-medium">Fallback</th>
                    <td className="px-4 py-3 text-right font-tabular">1.0096</td>
                  </tr>
                  <tr>
                    <th scope="row" className="px-4 py-3 font-medium">Bookmaker odds</th>
                    <td className="px-4 py-3 text-right font-tabular">0.9947</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-muted">Lower log loss is better. These figures are from the 760-match test, not the small live record.</p>
          </Card>
        </section>
      </div>
      <div className="flex flex-wrap gap-3 border-t border-edge py-8">
         <LinkButton href="/track-record" variant="cta">See the track record</LinkButton>
         <LinkButton href="/lean" variant="cta">Explore the models</LinkButton>
      </div>
    </article>
  );
}
