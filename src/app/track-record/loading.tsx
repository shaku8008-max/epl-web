export default function TrackRecordLoading() {
  return (
    <section aria-busy="true" aria-label="Loading track record" className="lg:w-[min(80rem,calc(100vw_-_2rem))] lg:ml-[calc((100%_-_min(80rem,calc(100vw_-_2rem)))/2)]">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Track record</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">How the Lean, Neural network and Linear goals predictions have performed in live matches.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse border border-border bg-tint/70" />)}
      </div>
      <div className="mt-8 h-72 animate-pulse border-y border-border bg-tint/70" />
      <div className="mt-8 animate-pulse border border-border bg-tint/70">
        <div className="h-12 border-b border-border bg-tint" />
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => <div key={item} className="h-12 border-b border-border bg-tint/70" />)}
      </div>
    </section>
  );
}
