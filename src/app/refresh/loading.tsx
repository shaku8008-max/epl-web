// Loading state for the Refresh page: a tint block where the status card
// will appear, so a slow database response never shows a blank page.
export default function RefreshLoading() {
  return (
    <section aria-busy="true" aria-label="Loading refresh status">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-primary">Refresh</h1>
      <p className="mt-3 max-w-2xl text-lg">
        Refresh pulls in the latest match results and recomputes every
        prediction in the database.
      </p>
      <div className="mt-8 h-44 animate-pulse border-y border-border bg-tint/70" />
    </section>
  );
}
