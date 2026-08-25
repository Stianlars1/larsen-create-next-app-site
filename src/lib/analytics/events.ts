import { track as vercelTrack } from "@vercel/analytics";

import { event as googleEvent } from "./google-analytics";
import { isAdminPath } from "./path";
import { isProductEvent, type ProductEvent } from "./product-event-contract";
import { umamiTrack } from "./umami-track";

export { isAdminPath } from "./path";
export {
  type CommandBuilderControl,
  type CommandCopySurface,
  isProductEvent,
  PRODUCT_EVENT_NAMES,
  type ProductEvent,
  type ProductEventName,
} from "./product-event-contract";

export function trackProductEvent(event: ProductEvent): boolean {
  if (typeof window === "undefined" || isAdminPath(window.location.pathname)) return false;
  if (!isProductEvent(event)) return false;

  try {
    umamiTrack(event.name, event.data);
  } catch {
    // Tracking must never interrupt a public interaction.
  }
  try {
    vercelTrack(event.name, event.data);
  } catch {
    // Tracking must never interrupt a public interaction.
  }
  try {
    googleEvent(event.name, event.data);
  } catch {
    // Tracking must never interrupt a public interaction.
  }

  return true;
}
