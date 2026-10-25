"use client";

// Tab navigation. This is a small client component on purpose: it needs
// usePathname() to highlight the tab for the current URL. Everything else in
// the site stays server-rendered.
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Predict" },
  { href: "/jev", label: "Jev" },
  { href: "/journal", label: "Journal" },
  { href: "/refresh", label: "Refresh" },
];

export default function Tabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex shrink-0 items-center gap-0.5">
      {tabs.map((tab) => {
        // "/" must match exactly so it does not light up on every page.
        const active =
          tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        const utility = tab.href === "/journal" || tab.href === "/refresh";
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? `inline-flex min-h-11 items-center rounded-card bg-accent px-1.5 py-1.5 text-xs text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-3 sm:text-sm ${utility ? "font-medium sm:px-2 sm:text-xs" : "font-bold"}`
                : `inline-flex min-h-11 items-center rounded-card px-1.5 py-1.5 text-xs text-white/65 transition-colors hover:bg-primary-light hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-3 sm:text-sm ${utility ? "font-medium sm:px-2 sm:text-xs" : "font-semibold"}`
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
