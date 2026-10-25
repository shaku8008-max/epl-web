// Loading state for the Journal page: tint blocks where the summary, form and
// entries will appear, so a slow database response never shows a blank page.
export default function JournalLoading() {
  return (
    <section aria-busy="true" aria-label="Loading journal">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-ink">Journal</h1>
      <p className="mt-3 max-w-2xl text-lg">
        Record your predictions with a stake and odds, then see whether the
        model is actually paying off.
      </p>
      <div className="mt-8 space-y-6">
        <div className="h-24 animate-pulse rounded-card border border-border bg-tint/70" />
        <div className="h-64 animate-pulse rounded-card border border-border bg-tint/70" />
        <div className="h-40 animate-pulse rounded-card border border-border bg-tint/70" />
      </div>
    </section>
  );
}
