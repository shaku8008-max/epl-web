"use client";

// Tab navigation. This is a small client component on purpose: it needs
// usePathname() to highlight the tab for the current URL. Everything else in
// the site stays server-rendered.
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Predict" },
  { href: "/journal", label: "Journal" },
  { href: "/refresh", label: "Refresh" },
];

export default function Tabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex items-center gap-2">
      {tabs.map((tab) => {
        // "/" must match exactly so it does not light up on every page.
        const active =
          tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "inline-flex min-h-11 items-center rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-primary shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                : "inline-flex min-h-11 items-center rounded-full px-4 py-1.5 text-sm font-semibold text-white/85 transition-colors hover:bg-primary-light hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}