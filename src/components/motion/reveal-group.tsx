import { Children, isValidElement, type ReactNode } from 'react';
import { Reveal } from './reveal';

interface RevealGroupProps {
    children: ReactNode;
    /** Delay before the first child reveals (ms). */
    baseDelay?: number;
    /** Per-child stagger offset (ms). Emil's rule: small enough to feel like
     *  a single gesture, big enough to read as sequence — 56ms is the sweet
     *  spot for typical 3–4 column grids. */
    stagger?: number;
    /** Optional cap on the cumulative delay so very long lists don't drag. */
    maxDelay?: number;
    /** Pass-through to each Reveal: makes wrappers fill their grid cell. */
    fillCell?: boolean;
    /** Pass-through className applied to every Reveal wrapper. */
    itemClassName?: string;
    /** Intersection margin handed to each child Reveal. */
    rootMargin?: string;
}

/**
 * RevealGroup wraps each direct child in a Reveal with a calculated delay.
 *
 * Used everywhere we have a list / grid of cards that should cascade in on
 * scroll. The single source of truth keeps the cadence consistent across the
 * site — no per-section magic numbers like (index % 6) * 56 sprinkled around.
 */
export function RevealGroup({
    children,
    baseDelay = 0,
    stagger = 56,
    maxDelay,
    fillCell = false,
    itemClassName,
    rootMargin,
}: RevealGroupProps) {
    return (
        <>
            {Children.map(children, (child, index) => {
                if (!isValidElement(child)) return child;

                const offset = baseDelay + index * stagger;
                const delay = maxDelay !== undefined ? Math.min(offset, maxDelay) : offset;

                return (
                    <Reveal
                        delay={delay}
                        fillCell={fillCell}
                        className={itemClassName}
                        rootMargin={rootMargin}
                    >
                        {child}
                    </Reveal>
                );
            })}
        </>
    );
}
