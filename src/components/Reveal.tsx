"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef } from "react";

const revealElements = new Map<Element, () => void>();
let revealObserver: IntersectionObserver | null = null;

function getRevealObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === "undefined") return null;
  if (revealObserver) return revealObserver;

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const reveal = revealElements.get(entry.target);
        if (!reveal) return;
        revealElements.delete(entry.target);
        revealObserver?.unobserve(entry.target);
        reveal();
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );

  return revealObserver;
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export default function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (element.getBoundingClientRect().top < window.innerHeight) return;

    const observer = getRevealObserver();
    if (!observer) return;

    element.classList.add("intro-reveal--armed");
    revealElements.set(element, () => element.classList.add("intro-reveal--revealed"));
    observer.observe(element);

    return () => {
      revealElements.delete(element);
      observer.unobserve(element);
    };
  }, []);

  const style = { "--intro-reveal-delay": `${Math.min(delay, 160)}ms` } as CSSProperties;

  return (
    <div ref={ref} className={`intro-reveal ${className}`} style={style}>
      {children}
    </div>
  );
}
