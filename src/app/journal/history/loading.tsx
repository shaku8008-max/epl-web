// Loading state for the History page: tint blocks where the chart and list
// will appear, so a slow database response never shows a blank page.
export default function HistoryLoading() {
  return (
    <section aria-busy="true" aria-label="Loading history">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">History</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">
        How your journal has performed over time, bet by bet.
      </p>
      <div className="mt-8 divide-y divide-border">
        <div className="h-64 animate-pulse border-y border-border bg-tint/70" />
        <div className="h-72 animate-pulse border-b border-border bg-tint/70" />
      </div>
    </section>
  );
}
