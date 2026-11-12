export default function StatusLoading() {
  return (
    <section aria-busy="true" aria-label="Loading Supabase connection check">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Supabase connection check</h1>
      <div className="mt-6 h-64 animate-pulse border-y border-border bg-tint/70" />
      <div className="mt-6 h-64 animate-pulse border-y border-border bg-tint/70" />
      <div className="mt-6 h-72 animate-pulse border-y border-border bg-tint/70" />
    </section>
  );
}
