export type ConsentState = 'granted' | 'denied';

const COOKIE_NAME = 'larsen_utvikling_consent';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const CONSENT_CHANGE_EVENT = 'lu:consent-change';
export const OPEN_CONSENT_BANNER_EVENT = 'lu:open-consent-banner';

export function readConsent(): ConsentState | null {
    if (typeof document === 'undefined') return null;

    const match = document.cookie.split('; ').find((row) => row.startsWith(`${COOKIE_NAME}=`));

    if (!match) return null;

    const value = decodeURIComponent(match.split('=')[1]);
    if (value === 'granted' || value === 'denied') return value;

    return null;
}

export function writeConsent(state: ConsentState): void {
    if (typeof document === 'undefined') return;

    document.cookie = `${COOKIE_NAME}=${state}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

export function dispatchConsentChange(state: ConsentState): void {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: { analytics: state } }));
}
