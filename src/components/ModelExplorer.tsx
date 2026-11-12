"use client";

import { useEffect, useRef, useState } from "react";
import LinkButton from "@/components/LinkButton";

type Model = {
  id: string;
  name: string;
  description: string;
  detail: string;
};

const models: Model[] = [
  {
    id: "lean",
    name: "Lean",
    description: "Several standard statistical and machine-learning models using team form and expected goals (xG).",
    detail: "Lean combines several standard statistical and machine-learning models. It uses team form and expected goals (xG). Its xG data feed has been stale since about late October; tests found no measurable accuracy cost. Fallback is used when xG is missing.",
  },
  {
    id: "neural-network",
    name: "Neural network",
    description: "Ten small neural networks predict each team’s goals, then turn those predictions into match chances.",
    detail: "Ten small neural networks predict how many goals each team will score. Those goal predictions become home, draw and away chances. It runs once a day; this website only reads the saved results.",
  },
  {
    id: "fallback",
    name: "Fallback",
    description: "The same general idea as Lean, but without xG when that data is missing.",
    detail: "Fallback uses the same general idea as Lean without expected goals. It is used when xG is missing, so the prediction can still be produced without that input.",
  },
  {
    id: "linear-goals",
    name: "Linear goals",
    description: "A linear model estimates expected goal difference and turns it into match probabilities.",
    detail: "The live version estimates expected goal difference, then turns it into home, draw and away probabilities. It also shows expected goals per side for display only; those figures do not change the probabilities. A Poisson version tested slightly better, but it is not live.",
  },
];

export default function ModelExplorer() {
  const [selected, setSelected] = useState<string | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const selectedModel = models.find((model) => model.id === selected) ?? null;

  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      const button = buttonRefs.current[selected];
      setSelected(null);
      button?.focus();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selected]);

  return (
    <>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {models.map((model) => {
          const isSelected = selected === model.id;
          return (
            <button
              key={model.id}
              ref={(button) => { buttonRefs.current[model.id] = button; }}
              type="button"
              aria-expanded={isSelected}
              aria-controls="model-detail-panel"
              onClick={() => setSelected(isSelected ? null : model.id)}
               className={`rounded-card border p-5 text-left transition-[background-color,border-color,box-shadow,transform] duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${isSelected ? "-translate-y-0.5 border-edge bg-tint shadow-sm" : "border-edge bg-white hover:-translate-y-0.5 hover:bg-tint"}`}
            >
              <span className="block font-heading text-xl font-semibold">{model.name}</span>
              <span className="mt-2 block text-base leading-relaxed text-muted">{model.description}</span>
               <span className="mt-4 block text-sm font-semibold text-ink">{isSelected ? "Close details" : "Read more"}</span>
            </button>
          );
        })}
      </div>

      <div
        id="model-detail-panel"
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${selectedModel ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        aria-hidden={!selectedModel}
      >
        <div className="min-h-0 overflow-hidden">
          {selectedModel && (
             <div key={selectedModel.id} className="mt-3 rounded-card border border-edge bg-tint p-5 epl-model-detail-enter epl-popover-enter--top sm:p-6">
              <h3 className="font-heading text-xl font-semibold">{selectedModel.name}</h3>
              <p className="mt-2 leading-relaxed text-muted">{selectedModel.detail}</p>
               <p className="mt-4 border-t border-edge pt-3 text-sm leading-relaxed text-muted">
                <span className="font-semibold text-ink">Honest limits:</span> None of the models beats the bookmaker. Live records are far too small to judge. This is a learning project, not betting advice. <a href="#goals-evidence" className="font-semibold text-ink underline decoration-ink/40 underline-offset-2 hover:decoration-ink">See the evidence</a>.
              </p>
               <LinkButton href={selectedModel.id === "neural-network" ? "/neural" : selectedModel.id === "linear-goals" ? "/goals" : "/lean"} variant="cta" className="mt-5 w-full sm:w-auto">
                {selectedModel.id === "neural-network" ? "See Neural network predictions" : selectedModel.id === "linear-goals" ? "See Linear goals predictions" : "See Lean predictions"}
              </LinkButton>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
