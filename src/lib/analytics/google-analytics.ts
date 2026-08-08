import type { ConsentState } from './consent';

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

type Gtag = (...args: unknown[]) => void;

function getGtag(): Gtag | null {
    if (typeof window === 'undefined') return null;
    const gtag = (window as unknown as { gtag?: Gtag }).gtag;
    return typeof gtag === 'function' ? gtag : null;
}

export function pageview(url: string): void {
    const gtag = getGtag();
    if (!gtag) return;

    gtag('event', 'page_view', {
        page_location: url,
        page_title: typeof document !== 'undefined' ? document.title : undefined,
    });
}

export function event(action: string, params?: Record<string, string | number | undefined>): void {
    const gtag = getGtag();
    if (!gtag) return;

    gtag('event', action, params);
}

export function updateGoogleConsent(state: ConsentState): void {
    const gtag = getGtag();
    if (!gtag) return;

    gtag('consent', 'update', {
        analytics_storage: state,
    });
}
