// Loading state for the Predict page: tint blocks where the picker and cards
// will appear, so a slow database response never shows a blank page.
export default function PredictLoading() {
  return (
    <section aria-busy="true" aria-label="Loading predictions">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-ink">Predict</h1>
      <p className="mt-3 max-w-2xl text-lg">
        Pick any two Premier League teams to see the home, draw and away
        probabilities from the model, plus recent stats for both teams.
      </p>
      <div className="mt-8 space-y-6">
        <div className="h-16 animate-pulse rounded-card border border-border bg-tint/70" />
        <div className="h-56 animate-pulse rounded-card border border-border bg-tint/70" />
        <div className="h-72 animate-pulse rounded-card border border-border bg-tint/70" />
      </div>
    </section>
  );
}
