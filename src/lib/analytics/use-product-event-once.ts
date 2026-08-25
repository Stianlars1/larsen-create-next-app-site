"use client";

import { useCallback, useRef } from "react";

import { trackProductEvent, type ProductEvent } from "./events";

export function useProductEventOnce() {
  const tracked = useRef(false);

  return useCallback((event: ProductEvent): boolean => {
    if (tracked.current) return false;
    if (!trackProductEvent(event)) return false;
    tracked.current = true;
    return true;
  }, []);
}
