// Loading state for the History page: tint blocks where the chart and list
// will appear, so a slow database response never shows a blank page.
export default function HistoryLoading() {
  return (
    <section aria-busy="true" aria-label="Loading history">
      <h1 className="font-heading text-3xl font-bold text-primary">History</h1>
      <p className="mt-3 max-w-2xl text-lg">
        How your journal has performed over time, bet by bet.
      </p>
      <div className="mt-8 space-y-6">
        <div className="h-64 animate-pulse rounded-card border border-border bg-tint" />
        <div className="h-72 animate-pulse rounded-card border border-border bg-tint" />
      </div>
    </section>
  );
}
