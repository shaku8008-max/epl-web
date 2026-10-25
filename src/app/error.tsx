// App-level error boundary: catches a crashed route and offers a retry.
// Must be a client component (Next.js passes reset as a prop).
"use client";

import Button from "@/components/Button";
import Card from "@/components/Card";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  return (
    <section>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-ink lg:text-5xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">
        The page could not be loaded. Please try again.
      </p>
      <Card className="mt-8">
        <p className="font-semibold">Error details</p>
        <p className="mt-1 text-base text-muted">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="mt-4">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
        </div>
      </Card>
    </section>
  );
}
