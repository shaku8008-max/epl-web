"use client";

// Tab navigation. This is a small client component on purpose: it needs
// usePathname() to highlight the tab for the current URL. Everything else in
// the site stays server-rendered.
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/track-record", label: "Predict" },
  { href: "/jev", label: "Jev" },
  { href: "/journal", label: "Journal" },
  { href: "/refresh", label: "Refresh" },
  { href: "/documentation", label: "How it works" },
];

export default function Tabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="epl-nav-scroll flex min-w-0 shrink items-center gap-1.5 overflow-x-auto px-1.5 py-1.5 sm:px-0 sm:py-0">
      {tabs.map((tab) => {
        // Predict owns the model pages; the other tabs match their URL prefix.
        const active =
          tab.href === "/track-record"
            ? pathname.startsWith("/track-record") || pathname === "/lean" || pathname.startsWith("/neural") || pathname.startsWith("/goals")
            : pathname.startsWith(tab.href);
        // Keep utility labels compact at narrow phone widths.
        const utility =
          tab.href === "/journal" ||
          tab.href === "/refresh" ||
          tab.href === "/documentation";
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 ${
                 active
                  ? `inline-flex min-h-12 items-center rounded-full border border-edge bg-accent px-1.5 py-1.5 text-sm text-white transition-colors duration-300 ease-out motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:px-3 sm:text-base ${utility ? "font-medium sm:px-2 sm:text-sm" : "font-bold"}`
                  : `inline-flex min-h-12 items-center rounded-full border border-edge bg-white px-1.5 py-1.5 text-sm text-ink transition-colors duration-300 ease-out motion-reduce:transition-none hover:bg-accent hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:px-3 sm:text-base ${utility ? "font-medium sm:px-2 sm:text-sm" : "font-semibold"}`
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
