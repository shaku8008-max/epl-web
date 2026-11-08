"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const cardPositions = ["back", "middle", "front"] as const;

export default function ModelStack({ models }: ModelStackProps) {
  const pathname = usePathname();

  return (
    <nav
      className="model-stack hidden 2xl:block fixed left-4 z-20 w-64 pointer-events-none print:hidden [@media(max-height:560px)]:hidden"
      style={{ top: "calc(50dvh - 7rem)" }}
      aria-label="Models and live record"
    >
      <p className="model-stack__label">Models · live record</p>
      <div className="model-stack__cards relative h-48">
        {models.map((model, index) => {
          const colour = modelColour(model.modelKey);
          const position = cardPositions[index] ?? "front";
          const isCurrent = pathname === model.href;

          return (
            <Link
              key={model.modelKey}
              href={model.href}
              aria-current={isCurrent ? "page" : undefined}
              aria-label={`${model.name}: ${model.line}. Open predictions`}
              className={`model-stack-card model-stack-card--${position}${isCurrent ? " model-stack-card--current" : ""} epl-rise`}
            >
              <span className="model-stack-card__face">
                <span className="model-stack-card__title-row">
                  <span
                    className="model-stack-card__icon"
                    style={{ background: colour.tint }}
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
                <span className="model-stack-card__open">Open predictions</span>
                {position !== "front" && !isCurrent && (
                  <span className="model-stack-card__veil" aria-hidden="true" />
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
