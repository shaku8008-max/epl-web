"use client";

// Model navigation stays separate from the main site tabs so more models can
// be added without making the top-level navigation longer.
import Link from "next/link";
import { usePathname } from "next/navigation";
import CtaContent from "@/components/CtaContent";

const models = [
  { href: "/track-record", label: "Track record" },
  { href: "/lean", label: "Lean" },
  { href: "/neural", label: "Neural network" },
  { href: "/goals", label: "Linear goals" },
  { href: "/neural/outlook", label: "Season outlook" },
];

export default function ModelTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Models" className="mb-6 flex flex-wrap gap-1.5">
      {models.map((model, index) => {
        // Each model entry owns its exact route; the outlook is not also the
        // parent Neural tab.
        const active = pathname === model.href || (model.href === "/track-record" && pathname.startsWith(model.href));
        return (
          <Link
            key={model.href}
            href={model.href}
            aria-current={active ? "page" : undefined}
            className={`${index === models.length - 1 ? "sm:ml-auto" : ""} ${
              active
                ? "inline-flex min-h-12 items-center rounded-full border border-edge bg-accent px-3 py-1.5 text-sm font-semibold text-white transition-colors duration-300 ease-out motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                : model.href === "/neural/outlook"
                  ? "cta cta-tab inline-flex min-h-12 items-center rounded-full border border-edge bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors duration-300 ease-out motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                : "inline-flex min-h-12 items-center rounded-full border border-edge bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors duration-300 ease-out motion-reduce:transition-none hover:bg-accent hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            }`}
          >
            {!active && model.href === "/neural/outlook" ? <CtaContent label={model.label} /> : model.label}
          </Link>
        );
      })}
    </nav>
  );
}
