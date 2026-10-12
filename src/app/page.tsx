import Card from "@/components/Card";

// Request-time render (same as the other pages): the layout footer queries
// Supabase live, and the team picker in a later stage will too.
export const dynamic = "force-dynamic";

export default function PredictPage() {
  return (
    <section>
      <h1 className="font-heading text-3xl font-bold text-primary">Predict</h1>
      <p className="mt-3 max-w-2xl text-lg">
        Pick any two Premier League teams to see the home, draw and away
        probabilities from the model, plus recent stats for both teams.
      </p>
      <Card className="mt-8">
        <p className="font-semibold">The team picker is coming next</p>
        <p className="mt-1 text-muted">
          Two team selectors and the probability display will appear here.
        </p>
      </Card>
    </section>
  );
}