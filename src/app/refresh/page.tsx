import Card from "@/components/Card";
import RefreshControls from "@/components/RefreshControls";
import { loadRefreshStatus } from "@/app/api/refresh/route";
import { formatMelbourne } from "@/lib/format";

// Request-time render (same as the other pages): the layout footer queries
// Supabase live, and this page loads its initial state on the server too.
export const dynamic = "force-dynamic";

// Server component: loads the initial state once, then hands it to the small
// RefreshControls client component for the button, countdown and polling.
export default async function RefreshPage() {
  let initial;
  try {
    initial = await loadRefreshStatus();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return (
      <section>
        <h1 className="font-heading text-3xl font-bold text-primary">Refresh</h1>
        <p className="mt-3 max-w-2xl text-lg">
          Refresh pulls in the latest match results and recomputes every
          prediction in the database.
        </p>
        <Card className="mt-8">
          <p className="font-semibold">Refresh status is unavailable right now</p>
          <p className="mt-1 text-sm text-muted">{message}</p>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <h1 className="font-heading text-3xl font-bold text-primary">Refresh</h1>
      <p className="mt-3 max-w-2xl text-lg">
        Refresh pulls in the latest match results and recomputes every
        prediction in the database.
      </p>
      <Card className="mt-8">
        <p>
          <span className="font-medium">Data as of:</span>{" "}
          {initial.dataAsOf
            ? `${formatMelbourne(initial.dataAsOf)} (Melbourne time)`
            : "unavailable"}
        </p>
        <RefreshControls initial={initial} />
      </Card>
    </section>
  );
}