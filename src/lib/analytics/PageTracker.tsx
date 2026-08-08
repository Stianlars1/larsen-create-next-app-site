'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { pageview } from './google-analytics';

export default function PageTracker() {
    const pathname = usePathname();
    const lastPathname = useRef(pathname);

    useEffect(() => {
        if (pathname === lastPathname.current) return;
        lastPathname.current = pathname;

        pageview(window.location.origin + pathname);
    }, [pathname]);

    return null;
}
