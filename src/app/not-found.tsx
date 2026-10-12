import Link from "next/link";
import Card from "@/components/Card";

// Shown for unknown URLs. Links back to the Predict page.
export default function NotFound() {
  return (
    <section>
      <h1 className="font-heading text-3xl font-bold text-primary">
        Page not found
      </h1>
      <p className="mt-3 max-w-2xl text-lg">
        That page does not exist. The predictions are still here though.
      </p>
      <Card className="mt-8">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Back to Predict
        </Link>
      </Card>
    </section>
  );
}
