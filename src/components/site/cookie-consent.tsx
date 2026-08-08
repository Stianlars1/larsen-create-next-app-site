"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  CONSENT_CHANGE_EVENT,
  OPEN_CONSENT_BANNER_EVENT,
  dispatchConsentChange,
  readConsent,
  writeConsent,
  type ConsentState,
} from "@/lib/analytics/consent";
import { GA_MEASUREMENT_ID } from "@/lib/analytics/google-analytics";
import styles from "./cookie-consent.module.css";

function subscribeToConsent(onChange: () => void) {
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
}

/**
 * Asks once, remembers the answer, and stays out of the way. Nothing is
 * measured before the visitor says yes - Vercel Analytics runs cookie-free
 * either way, so declining still leaves the page working exactly as before.
 */
export function CookieConsent() {
  // Read as an external store so the answer is never assumed during render on
  // the server, where there is no cookie to read.
  const answered = useSyncExternalStore(
    subscribeToConsent,
    () => readConsent() !== null,
    () => true,
  );
  const [reopened, setReopened] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const open = () => setReopened(true);
    window.addEventListener(OPEN_CONSENT_BANNER_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_BANNER_EVENT, open);
  }, []);

  const visible = Boolean(GA_MEASUREMENT_ID) && !dismissed && (!answered || reopened);
  if (!visible) return null;

  const answer = (state: ConsentState) => {
    writeConsent(state);
    dispatchConsentChange(state);
    setReopened(false);
    setDismissed(true);
  };

  return (
    <aside className={styles.banner} role="dialog" aria-label="Analytics consent">
      <p className={styles.text}>
        Analytics cookies help me see whether this page is useful. Nothing is stored until
        you accept.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.decline} onClick={() => answer("denied")}>
          Decline
        </button>
        <button type="button" className={styles.accept} onClick={() => answer("granted")}>
          Accept
        </button>
      </div>
    </aside>
  );
}
