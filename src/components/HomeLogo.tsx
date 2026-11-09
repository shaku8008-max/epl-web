"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PitchIcon from "@/components/PitchIcon";

export default function HomeLogo() {
  const pathname = usePathname();

  return (
    <Link
      href="/"
      aria-label="EPL Predictor home"
      aria-current={pathname === "/" ? "page" : undefined}
      className="flex min-w-0 shrink items-center gap-1.5 px-1.5 py-1 sm:px-0 sm:py-0"
    >
      <PitchIcon className="h-6 w-6 shrink-0 text-ink" />
      <span className="whitespace-nowrap font-heading text-xl font-bold tracking-tight sm:text-2xl">
        EPL Predictor
      </span>
    </Link>
  );
}
