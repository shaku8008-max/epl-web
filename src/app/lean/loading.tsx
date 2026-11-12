export default function LeanLoading() {
  return (
    <section aria-busy="true" aria-label="Loading predictions">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Predict</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">Pick any two Premier League teams to see the home, draw and away probabilities from the model, plus recent stats for both teams.</p>
      <div className="mt-8 h-96 animate-pulse border-y border-border bg-tint/70" />
    </section>
  );
}
