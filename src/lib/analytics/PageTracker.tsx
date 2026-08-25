'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { pageview } from './google-analytics';
import { isAdminPath } from './path';

export default function PageTracker() {
    const pathname = usePathname();
    const lastPathname = useRef<string | null>(null);

    useEffect(() => {
        if (!pathname || isAdminPath(pathname) || pathname === lastPathname.current) return;
        lastPathname.current = pathname;

        pageview(window.location.origin + pathname);
    }, [pathname]);

    return null;
}
