export default function JevScoreboardLoading() {
  return (
    <section aria-busy="true" aria-label="Loading Jev scoreboard" className="lg:w-[min(80rem,calc(100vw_-_2rem))] lg:ml-[calc((100%_-_min(80rem,calc(100vw_-_2rem)))/2)]">
      <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Jev scoreboard</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">Does Jev&apos;s news-based shift make the model&apos;s predictions better or worse? This page only counts matches that have finished.</p>
      <div className="mt-8 h-40 animate-pulse border-y border-border bg-tint/70" />
      <div className="mt-6 animate-pulse border-y border-border bg-tint/70">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => <div key={item} className="h-20 border-b border-border" />)}
      </div>
    </section>
  );
}
