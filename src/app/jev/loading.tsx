export default function JevLoading() {
  return (
    <section aria-busy="true" aria-label="Loading Jev">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Jev</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">An experiment: Jev adjusts the model&apos;s win chances using only injury and suspension news from the Fantasy Premier League feed.</p>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">Jev is experimental. With few settled matches, no verdict is possible yet.</p>
      <div className="mt-6 animate-pulse border-y border-border bg-tint/70">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => <div key={item} className="h-28 border-b border-border" />)}
      </div>
    </section>
  );
}
