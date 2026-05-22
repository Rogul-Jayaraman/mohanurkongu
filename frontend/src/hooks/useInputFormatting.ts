import { useCallback } from 'react';

export type InputFormattingMode = 'email' | 'title' | 'sentence' | 'uppercase' | 'none';

interface FormattingOptions {
    type?: string;
    forceLowercase?: boolean;
    mode?: InputFormattingMode;
    autoFormat?: boolean;
}

/**
 * Standardized hook for formatting user inputs.
 * Modes:
 * - 'email': lowercase everything.
 * - 'title': capitalize every word (useful for names).
 * - 'sentence': capitalize only the first letter (default for text).
 * - 'none': return as-is (useful for passwords, codes).
 */
export const useInputFormatting = () => {
    const formatValue = useCallback((value: string, options: FormattingOptions): string => {
        if (typeof value !== 'string' || value.length === 0) return value;

        const { type, forceLowercase, mode, autoFormat = false } = options;
        
        // If autoFormat is disabled and no mode/special type is provided, return as-is.
        if (!autoFormat && !forceLowercase && type !== 'email' && !mode) {
            return value;
        }

        // Handle pricing/currency specifically if autoFormat is ON
        if (autoFormat) {
            // Strictly enforce numeric/decimal input for pricing fields
            const digitsOnly = value.replace(/[^\d.]/g, '');
            const parts = digitsOnly.split('.');
            
            // Limit to one decimal point and two decimal places
            let mainPart = parts[0];
            let decimalPart = parts.length > 1 ? parts[1].slice(0, 2) : '';
            
            // Add comma separators for Indian numbering system style (or standard)
            mainPart = mainPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            
            return parts.length > 1 ? `${mainPart}.${decimalPart}` : mainPart;
        }

        // Determine effective mode
        // Default to 'none' to avoid interference with transliteration or non-English text
        let effectiveMode: InputFormattingMode = mode || 'none';
        
        if (type === 'email' || forceLowercase) effectiveMode = 'email';
        if (type === 'password' || type === 'number' || type === 'tel') effectiveMode = 'none';

        // Check if string contains non-English characters (e.g., Tamil)
        // If so, we avoid casing modifications to prevent breaking transliteration logic
        const hasNonEnglish = /[^\x00-\x7F]/.test(value);
        if (hasNonEnglish) return value;

        switch (effectiveMode) {
            case 'email':
                // Removed .trim() - trimming while typing breaks space entry for validation
                return value.toLowerCase();
            
            case 'title':
                return value
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            
            case 'uppercase':
                return value.toUpperCase();
            
            case 'sentence':
                return value.charAt(0).toUpperCase() + value.slice(1);
            
            case 'none':
            default:
                return value;
        }
    }, []);

    const toTitleCase = useCallback((str: string | null | undefined) => {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }, []);

    return { formatValue, toTitleCase };
};
