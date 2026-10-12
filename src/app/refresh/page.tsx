import Button from "@/components/Button";
import Card from "@/components/Card";

// Request-time render (same as the other pages): the layout footer queries
// Supabase live, and this page will trigger updates in a later stage.
export const dynamic = "force-dynamic";

export default function RefreshPage() {
  return (
    <section>
      <h1 className="font-heading text-3xl font-bold text-primary">Refresh</h1>
      <p className="mt-3 max-w-2xl text-lg">
        Refresh pulls in the latest match results and recomputes every
        prediction in the database.
      </p>
      <Card className="mt-8">
        <p className="font-semibold">Refresh controls coming soon</p>
        <p className="mt-1 text-muted">
          A later stage adds the button that triggers a data update.
        </p>
        <div className="mt-4">
          <Button disabled>Refresh data</Button>
        </div>
      </Card>
    </section>
  );
}