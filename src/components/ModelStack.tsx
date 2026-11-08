import Link from "next/link";
import { modelColour } from "@/lib/trackRecord";

export type ModelStackItem = {
  modelKey: string;
  name: string;
  href: string;
  line: string;
  ariaLabel: string;
};

type ModelStackProps = {
  models: ModelStackItem[];
};

const cardPositions = ["back", "middle", "front"] as const;

export default function ModelStack({ models }: ModelStackProps) {
  return (
    <div className="model-stack" aria-label="Live model records">
      {models.map((model, index) => {
        const colour = modelColour(model.modelKey);
        const position = cardPositions[index] ?? "front";

        return (
          <Link
            key={model.modelKey}
            href={model.href}
            aria-label={model.ariaLabel}
            className={`model-stack-card model-stack-card--${position} epl-rise`}
          >
            <span className="model-stack-card__face">
              <span className="model-stack-card__title-row">
                <span
                  className="model-stack-card__dot"
                  style={{ background: colour.line }}
                  aria-hidden="true"
                />
                <span className={`font-heading font-semibold ${colour.text}`}>
                  {model.name}
                </span>
              </span>
              <span className="model-stack-card__rule" aria-hidden="true" />
              <span className="model-stack-card__record font-tabular">{model.line}</span>
              {position !== "front" && <span className="model-stack-card__veil" aria-hidden="true" />}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
