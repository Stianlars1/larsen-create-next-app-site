'use client';

import Script from 'next/script';
import { GA_MEASUREMENT_ID } from './google-analytics';

const initScript = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
});
gtag('js', new Date());
gtag('config', '__GA_ID__', { send_page_view: false });
`;

export default function GoogleAnalytics() {
    if (!GA_MEASUREMENT_ID) return null;

    return (
        <>
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script id="google-analytics-init" strategy="afterInteractive">
                {initScript.replace('__GA_ID__', GA_MEASUREMENT_ID)}
            </Script>
        </>
    );
}
