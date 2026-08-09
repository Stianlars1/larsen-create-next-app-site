'use client';

import { useEffect, useState, type ElementType, type ReactNode } from 'react';
import styles from './reveal.module.css';

interface RevealProps {
    children: ReactNode;
    as?: ElementType;
    /** Extra delay in ms before the reveal state flips (stagger). */
    delay?: number;
    className?: string;
    /** Intersection margin - negative bottom triggers slightly before entering. */
    rootMargin?: string;
    /** If true, the wrapper skips the initial hidden state and is visible from
     *  the first paint. Use for hero content that's already in the viewport. */
    immediate?: boolean;
    /** When wrapping a child inside a CSS Grid cell, set this so the wrapper
     *  fills the cell (flex column, full height, min-width: 0 to allow shrink). */
    fillCell?: boolean;
}

/**
 * Reveal animates children in on scroll using IntersectionObserver.
 *
 * Why not framer-motion here: CSS transitions run off the main thread, so
 * they stay smooth even while Next.js hydrates the rest of the page. That
 * matches Emil Kowalski's guidance - "CSS animations beat JS under load".
 *
 * One canonical motion: opacity + small translateY + slight blur, driven by
 * a strong ease-out. Sections should never override the timing - consistency
 * reads as craft, variation reads as oversight.
 */
export function Reveal({
    children,
    as: Component = 'div',
    delay = 0,
    className,
    rootMargin = '0px 0px -80px 0px',
    immediate = false,
    fillCell = false,
}: RevealProps) {
    const [node, setNode] = useState<HTMLElement | null>(null);
    const [revealed, setRevealed] = useState(immediate);

    useEffect(() => {
        if (!node || revealed) return;

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReduced) {
            const raf = window.requestAnimationFrame(() => setRevealed(true));
            return () => window.cancelAnimationFrame(raf);
        }

        let timer: number | undefined;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    timer = window.setTimeout(() => setRevealed(true), delay);
                    observer.unobserve(node);
                }
            },
            { threshold: 0.12, rootMargin },
        );

        observer.observe(node);

        return () => {
            observer.disconnect();
            if (timer !== undefined) window.clearTimeout(timer);
        };
    }, [node, delay, rootMargin, revealed]);

    return (
        <Component
            ref={setNode}
            data-revealed={revealed ? 'true' : 'false'}
            data-fill={fillCell ? 'true' : undefined}
            className={[styles.reveal, className].filter(Boolean).join(' ')}
        >
            {children}
        </Component>
    );
}
