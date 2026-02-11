import { useState, useCallback } from 'react';
import { TIMEOUTS } from '@/lib/constants';

interface UseClipboardReturn {
    copiedId: number | null;
    copyToClipboard: (text: string, id: number) => void;
}

/**
 * Custom hook for clipboard operations with visual feedback
 */
export function useClipboard(): UseClipboardReturn {
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const fallbackCopyTextToClipboard = useCallback((text: string, id: number) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), TIMEOUTS.COPY_FEEDBACK);
        } catch (err) {
            console.error('Fallback: Unable to copy', err);
        }

        document.body.removeChild(textArea);
    }, []);

    const copyToClipboard = useCallback((text: string, id: number) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    setCopiedId(id);
                    setTimeout(() => setCopiedId(null), TIMEOUTS.COPY_FEEDBACK);
                })
                .catch(() => fallbackCopyTextToClipboard(text, id));
        } else {
            fallbackCopyTextToClipboard(text, id);
        }
    }, [fallbackCopyTextToClipboard]);

    return { copiedId, copyToClipboard };
}
