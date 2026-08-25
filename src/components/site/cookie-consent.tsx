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
import { getGoogleAnalyticsMeasurementId } from "@/lib/analytics/google-analytics";
import styles from "./cookie-consent.module.css";

function subscribeToConsent(onChange: () => void) {
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
}

/**
 * Asks once, remembers the answer, and stays out of the way. Cookie-free Umami
 * and Vercel Analytics run without browser storage. Accepting enables optional
 * Google Analytics cookies.
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

  const visible = Boolean(getGoogleAnalyticsMeasurementId()) && !dismissed && (!answered || reopened);
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
        Cookie-free traffic analytics is always on. Accept to also enable Google Analytics cookies.
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
