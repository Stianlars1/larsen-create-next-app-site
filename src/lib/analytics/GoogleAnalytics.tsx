'use client';

import Script from 'next/script';
import { getGoogleAnalyticsMeasurementId } from './google-analytics';

const initScript = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  analytics_storage: 'granted',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
});
gtag('js', new Date());
gtag('config', '__GA_ID__', { send_page_view: false });
`;

export default function GoogleAnalytics() {
    const measurementId = getGoogleAnalyticsMeasurementId();
    if (!measurementId) return null;

    return (
        <>
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            />
            <Script id="google-analytics-init" strategy="afterInteractive">
                {initScript.replace('__GA_ID__', measurementId)}
            </Script>
        </>
    );
}
