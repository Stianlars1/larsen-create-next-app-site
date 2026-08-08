'use client';

import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import styles from './copy-command-button.module.css';

export function CopyCommandButton({ command }: { command: string }) {
    const [copied, setCopied] = useState(false);
    const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (resetTimer.current) {
                clearTimeout(resetTimer.current);
            }
        };
    }, []);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(command);
            setCopied(true);

            if (resetTimer.current) {
                clearTimeout(resetTimer.current);
            }

            resetTimer.current = setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    }

    return (
        <button
            type="button"
            className={styles.button}
            onClick={handleCopy}
            aria-label={copied ? 'Command copied' : 'Copy command'}
        >
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
        </button>
    );
}
