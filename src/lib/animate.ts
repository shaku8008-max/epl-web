// Shared animation logic for selection changes on the Predict page.
// Counting uses requestAnimationFrame; widths/colours/opacity use CSS
// transitions. No new npm packages.

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

// How long value animations run: bar slides, number counts, tint fades.
export const ANIM_MS = 450;

// Ease-out curve shared by the rAF counting and the CSS transitions, so both
// move together. ANIM_EASE_CSS is the CSS cubic-bezier matching easeOutCubic.
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export const ANIM_EASE_CSS = "cubic-bezier(0.33, 1, 0.68, 1)";

// Brief crossfade for swapped text (team names, fixture and freshness lines).
export const TEXT_MS = 150;

// CSS-only fade-in for swapped text: the caller renders
// <span key={text} style={fadeInStyle(animate)}> so the incoming text fades
// in over the same space (no layout shift). Mount animations need no effects
// or state, so they pass the set-state-in-effect lint rule.
export function fadeInStyle(animate: boolean): CSSProperties | undefined {
  if (!animate) return undefined;
  return { animation: `epl-fade-in ${TEXT_MS}ms ease-out` };
}

// True when the device asks for reduced motion. Initialised lazily from
// matchMedia (no effect needed) and kept live via the change listener, so
// toggling the OS setting mid-session takes effect without a reload.
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// True once the watched value has changed after first render. Drives the
// fade-in classes, so nothing animates on the initial page load.
export function useHasChanged(value: unknown): boolean {
  const first = useRef(true);
  const [changed, setChanged] = useState(false);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setChanged(true);
  }, [value]);
  return changed;
}

// Counts from the currently displayed number to the target over ANIM_MS.
// Returns [display, done]: done is true when the display equals the target.
// Instant (no counting) when the target is first seen, when motion is reduced,
// or when either side is null (the caller fades "–" instead). Rapid changes
// cancel the in-flight frame and start from wherever the display currently
// is, so values never jump back or queue up.
export function useAnimatedNumber(target: number | null): [number | null, boolean] {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState<number | null>(target);
  const displayRef = useRef<number | null>(target);
  const rafRef = useRef(0);
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      displayRef.current = target;
      setDisplay(target);
      return;
    }
    const from = displayRef.current;
    if (from === null || target === null || reduced || from === target) {
      cancelAnimationFrame(rafRef.current);
      displayRef.current = target;
      setDisplay(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / ANIM_MS, 1);
      const value = t >= 1 ? target : from + (target - from) * easeOutCubic(t);
      displayRef.current = value;
      setDisplay(value);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, reduced]);

  return [display, display === target];
}
