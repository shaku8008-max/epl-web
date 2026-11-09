"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { modelColour } from "@/lib/trackRecord";

export type ModelStackItem = {
  modelKey: string;
  name: string;
  href: string;
  line: string;
};

type ModelStackProps = {
  models: ModelStackItem[];
};

export default function ModelStack({ models }: ModelStackProps) {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <nav
      className="model-stack fixed left-4 top-1/2 z-20 hidden w-64 -translate-y-1/2 pointer-events-none 2xl:block print:hidden [@media(max-height:640px)]:hidden"
      aria-label="Models and live record"
    >
      <p className="model-stack__label pointer-events-auto">Models · by win rate so far</p>
      <div className="model-stack__cards epl-rise flex flex-col gap-2">
        {models.map((model) => {
          const colour = modelColour(model.modelKey);
          const isCurrent = pathname === model.href;

          return (
            <Link
              key={model.modelKey}
              href={model.href}
              aria-current={isCurrent ? "page" : undefined}
              aria-label={`${model.name}: ${model.line}. ${isCurrent ? "Current page" : "Open predictions"}`}
              style={{ "--model-line": colour.line } as CSSProperties}
              className={`model-stack-card${isCurrent ? " model-stack-card--current" : ""}`}
            >
              <span className={`model-stack-card__face ${colour.tint}`}>
                <span className="model-stack-card__title-row">
                  <span
                    className={`model-stack-card__icon ${colour.tint}`}
                    aria-hidden="true"
                  >
                    <span
                      className="model-stack-card__dot"
                      style={{ background: colour.line }}
                    />
                  </span>
                  <span className={`font-heading text-base font-semibold ${colour.text}`}>
                    {model.name}
                  </span>
                </span>
                <span className="model-stack-card__record font-tabular">{model.line}</span>
                <span className="model-stack-card__open">{isCurrent ? "You are here" : "Open predictions"}</span>
              </span>
            </Link>
          );
        })}
      </div>
      <p className="model-stack__note">Small samples swing a lot.</p>
    </nav>
  );
}
