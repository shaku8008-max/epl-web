import type { Metadata } from "next";
import LinkButton from "@/components/LinkButton";
import Reveal from "@/components/Reveal";
import { getTrackRecord } from "@/lib/data";
import { modelColour } from "@/lib/trackRecord";
import type { TrackRecord } from "@/lib/types";

export const metadata: Metadata = {
  title: "Football Wizard",
  description: "Premier League predictions from three models, checked honestly against real results.",
};

export const dynamic = "force-dynamic";

const introModels = [
  {
    key: "lean",
    name: "Lean",
    description: "Several standard statistical and machine-learning models using team form and expected goals (xG).",
    href: "/lean",
    action: "See Lean predictions",
  },
  {
    key: "nn",
    name: "Neural network",
    description: "Ten small neural networks predict each team’s goals, then turn those predictions into match chances.",
    href: "/neural",
    action: "See Neural network predictions",
  },
  {
    key: "goals",
    name: "Linear goals",
    description: "A linear model estimates expected goal difference and turns it into match probabilities.",
    href: "/goals",
    action: "See Linear goals predictions",
  },
] as const;

async function loadTrackRecord(): Promise<TrackRecord[] | null> {
  try {
    return await getTrackRecord();
  } catch {
    return null;
  }
}

function recordLine(rows: TrackRecord[] | null, modelKey: string): string {
  if (rows === null) return "Record unavailable";
  const modelRows = rows.filter((row) => row.model_key === modelKey);
  if (modelRows.length === 0) return "Collecting, 0 matches scored";
  const correct = modelRows.filter((row) => row.correct === true).length;
  return `${correct} of ${modelRows.length} correct (${Math.round((correct / modelRows.length) * 100)}%)`;
}

export default async function HomePage() {
  const trackRecord = await loadTrackRecord();

  return (
    <div className="intro-page">
      <section className="intro-hero" aria-labelledby="intro-title">
        <div className="intro-hero__grid" aria-hidden="true" />
        <div className="intro-hero__content">
          <h1 id="intro-title" className="intro-hero__title">
            Football Wizard
          </h1>
          <p className="intro-hero__pitch">
            Premier League predictions from three models, checked honestly against real results.
          </p>
          <div className="intro-hero__actions">
            <LinkButton href="/track-record" variant="cta">See the track record</LinkButton>
            <LinkButton href="/documentation" variant="secondary">How it works</LinkButton>
          </div>
          <p className="intro-hero__note">A learning project. Not betting advice.</p>
        </div>
        <a className="intro-hero__scroll" href="#what-it-does" aria-label="Scroll to the next section">
          <span>Scroll</span>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 6.5 8 11l5-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </a>
      </section>

      <section className="intro-panel" aria-label="About Football Wizard">
        <div className="intro-panel__inner">
          <Reveal className="intro-section" delay={0}>
            <section id="what-it-does" aria-labelledby="what-it-does-title">
              <h2 id="what-it-does-title" className="intro-section__heading">What it does</h2>
              <p className="intro-section__copy">
                Football Wizard predicts Premier League matches with three models. It shows home, draw and away probabilities, then checks every prediction against real results in a public track record.
              </p>
            </section>
          </Reveal>

          <Reveal className="intro-section" delay={0}>
            <section aria-labelledby="three-models-title">
              <h2 id="three-models-title" className="intro-section__heading">Three models, one honest record</h2>
              <div className="intro-models">
                {introModels.map((model, index) => {
                  const colour = modelColour(model.key);
                  return (
                    <Reveal key={model.key} delay={index * 70}>
                      <article className="intro-model-card">
                        <div className="intro-model-card__name">
                          <span className="intro-model-card__dot" style={{ background: colour.line }} aria-hidden="true" />
                          <h3 className={`font-heading text-xl font-semibold ${colour.text}`}>{model.name}</h3>
                        </div>
                        <p className="intro-model-card__description">{model.description}</p>
                        <p className="intro-model-card__record font-tabular">{recordLine(trackRecord, model.key)}</p>
                        <LinkButton href={model.href} variant="secondary" className="mt-5 w-full">{model.action}</LinkButton>
                      </article>
                    </Reveal>
                  );
                })}
              </div>
            </section>
          </Reveal>

          <Reveal className="intro-section" delay={0}>
            <section className="intro-limits" aria-labelledby="honest-limits-title">
              <h2 id="honest-limits-title" className="intro-section__heading">Honest limits</h2>
              <p className="intro-section__copy">
                None of the models beats the bookmaker. Live records are far too small to judge. This is a learning project, not betting advice.
              </p>
            </section>
          </Reveal>

          <Reveal className="intro-closing" delay={0}>
            <div className="intro-closing__actions">
              <LinkButton href="/track-record" variant="cta">See the track record</LinkButton>
              <LinkButton href="/lean" variant="secondary">Try a matchup</LinkButton>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
