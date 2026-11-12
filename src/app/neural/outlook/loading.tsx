export default function OutlookLoading() {
  return (
    <section aria-busy="true" aria-label="Loading season outlook" className="lg:w-[min(80rem,calc(100vw_-_2rem))] lg:ml-[calc((100%_-_min(80rem,calc(100vw_-_2rem)))/2)]">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Season outlook</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">We play out the rest of the season 10,000 times using the Neural network&apos;s expected goals, then count how often each team finishes where.</p>
      <div className="mt-8 h-56 animate-pulse border border-border bg-tint/70" />
      <div className="mt-8 animate-pulse border border-border bg-tint/70">
        <div className="h-12 border-b border-border bg-tint" />
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => <div key={item} className="h-12 border-b border-border bg-tint/70" />)}
      </div>
    </section>
  );
}
