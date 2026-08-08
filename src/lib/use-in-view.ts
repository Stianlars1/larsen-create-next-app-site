"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/** True while the element is on screen. Used to pause work nobody is looking at. */
export function useInView<T extends HTMLElement>(rootMargin = "0px 0px -10% 0px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.25,
      rootMargin,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Reads the reduced-motion preference as an external store, so it reacts to a
 * runtime change rather than only the value at mount - and renders as false on
 * the server, where there is nothing to ask.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

/**
 * Advances a step counter on an interval, but only while the element is on
 * screen and the visitor has not asked for reduced motion. Cards loop so the
 * page feels alive without burning battery on offscreen work.
 *
 * @param steps how many steps before wrapping back to 0
 * @param interval ms between steps
 */
export function useInViewLoop<T extends HTMLElement>(steps: number, interval = 1400) {
  const { ref, inView } = useInView<T>();
  const [step, setStep] = useState(0);
  const reduced = usePrefersReducedMotion();

  const advance = useCallback(() => setStep((current) => (current + 1) % steps), [steps]);

  useEffect(() => {
    if (!inView || reduced) return;
    const id = window.setInterval(advance, interval);
    return () => window.clearInterval(id);
  }, [inView, reduced, interval, advance]);

  // Reduced motion gets the finished state rather than a frozen first frame.
  return { ref, step: reduced ? steps - 1 : step, inView, reduced };
}
