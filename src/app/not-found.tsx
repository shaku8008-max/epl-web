import Card from "@/components/Card";
import LinkButton from "@/components/LinkButton";

// Shown for unknown URLs. Links back to the Predict page.
export default function NotFound() {
  return (
    <section>
      <h1 className="font-heading text-4xl font-bold tracking-tight text-ink lg:text-5xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">
        That page does not exist. The predictions are still here though.
      </p>
      <Card className="mt-8">
        <LinkButton href="/track-record" variant="cta">Back to track record</LinkButton>
      </Card>
    </section>
  );
}
