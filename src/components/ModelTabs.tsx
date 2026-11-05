"use client";

// Model navigation stays separate from the main site tabs so more models can
// be added without making the top-level navigation longer.
import Link from "next/link";
import { usePathname } from "next/navigation";

const models = [
  { href: "/", label: "Lean" },
  { href: "/neural", label: "Neural network" },
];

export default function ModelTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Models" className="mb-6 flex flex-wrap gap-1">
      {models.map((model) => {
        // Lean is only active at the homepage; Neural stays active on its sub-pages.
        const active = model.href === "/" ? pathname === "/" : pathname.startsWith(model.href);
        return (
          <Link
            key={model.href}
            href={model.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "inline-flex min-h-12 items-center rounded-card bg-accent px-3 py-1.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                : "inline-flex min-h-12 items-center rounded-card px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-tint hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            }
          >
            {model.label}
          </Link>
        );
      })}
    </nav>
  );
}
