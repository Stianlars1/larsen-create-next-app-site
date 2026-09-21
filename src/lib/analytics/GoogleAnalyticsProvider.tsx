'use client';

import { Suspense, useEffect, useState } from 'react';
import { readConsent, CONSENT_CHANGE_EVENT } from './consent';
import type { ConsentState } from './consent';
import { getGoogleAnalyticsMeasurementId, updateGoogleConsent } from './google-analytics';
import GoogleAnalytics from './GoogleAnalytics';
import PageTracker from './PageTracker';

export default function GoogleAnalyticsProvider() {
    const [consent, setConsent] = useState<ConsentState | null>(null);

    useEffect(() => {
        const updateConsent = () => setConsent(readConsent());
        updateConsent();
    }, []);

    useEffect(() => {
        const handleChange = (e: Event) => {
            const state = (e as CustomEvent).detail?.analytics as ConsentState;
            if (state === 'granted' || state === 'denied') {
                setConsent(state);
            }
        };

        window.addEventListener(CONSENT_CHANGE_EVENT, handleChange);
        return () => window.removeEventListener(CONSENT_CHANGE_EVENT, handleChange);
    }, []);

    useEffect(() => {
        if (consent) {
            updateGoogleConsent(consent);
        }
    }, [consent]);

    if (!getGoogleAnalyticsMeasurementId() || consent !== 'granted') return null;

    return (
        <>
            <GoogleAnalytics />
            <Suspense>
                <PageTracker />
            </Suspense>
        </>
    );
}
