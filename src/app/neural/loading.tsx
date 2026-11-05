// Loading state for Neural: reserve the main content area while the two
// prediction tables are read from Supabase.
export default function NeuralLoading() {
  return (
    <section aria-busy="true" aria-label="Loading neural predictions">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Neural</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">
        A second model that predicts goals and turns them into match probabilities.
      </p>
      <div className="mt-8 h-64 animate-pulse border-y border-border bg-tint/70" />
    </section>
  );
}
