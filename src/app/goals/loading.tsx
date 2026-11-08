export default function GoalsLoading() {
  return (
    <section aria-busy="true" aria-label="Loading linear goals predictions">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Linear goals</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">A straight-line model that predicts the expected goal margin, then turns it into match probabilities.</p>
      <div className="mt-8 h-64 animate-pulse border-y border-border bg-tint/70" />
    </section>
  );
}
