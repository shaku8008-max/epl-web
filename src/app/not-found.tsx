import Link from "next/link";
import Card from "@/components/Card";

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
        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center rounded-card border border-accent px-5 py-2 text-base font-semibold text-accent transition-colors hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Back to Predict
        </Link>
      </Card>
    </section>
  );
}
