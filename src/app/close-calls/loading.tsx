export default function CloseCallsLoading() {
  return (
    <section aria-busy="true" aria-label="Loading close calls and disagreements" className="lg:w-[min(80rem,calc(100vw_-_2rem))] lg:ml-[calc((100%_-_min(80rem,calc(100vw_-_2rem)))/2)]">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Close calls and disagreements</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">A descriptive look at where the three models split and where a prediction was nearly a coin flip.</p>
      <div className="mt-6 h-36 animate-pulse border border-border bg-tint/70" />
      <div className="mt-10 h-72 animate-pulse border border-border bg-tint/70" />
      <div className="mt-12 h-72 animate-pulse border border-border bg-tint/70" />
    </section>
  );
}
