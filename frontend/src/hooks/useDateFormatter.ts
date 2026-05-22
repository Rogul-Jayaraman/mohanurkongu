import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

/**
 * useDateFormatter Hook
 * 
 * WHAT: A centralized hook for formatting dates in both Tamil and English.
 * WHY: Ensures consistent date presentation according to the heritage design system.
 * 
 * USAGE:
 * const { formatDate, formatMemberSince } = useDateFormatter();
 * console.log(formatDate('2023-01-01')); // Outputs "1 Jan 2023" or "1 ஜன 2023"
 */

export const useDateFormatter = () => {
    const { i18n } = useTranslation();
    const isTamil = i18n.language === 'ta';

    /**
     * Standard Date Formatter
     * Returns: e.g., "7 Apr 2024" or "7 ஏப் 2024"
     */
    const formatDate = useCallback((date: string | Date | null | undefined, options: Intl.DateTimeFormatOptions = {}) => {
        if (!date) return 'N/A';
        
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return 'N/A';

            const defaultOptions: Intl.DateTimeFormatOptions = {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                ...options
            };

            return d.toLocaleDateString(isTamil ? 'ta-IN' : 'en-IN', defaultOptions);
        } catch (e) {
            return 'N/A';
        }
    }, [isTamil]);

    /**
     * Member Since Formatter
     * Returns: e.g., "April 2024" or "ஏப்ரல் 2024"
     */
    const formatMemberSince = useCallback((date: string | Date | null | undefined) => {
        return formatDate(date, {
            day: undefined,
            month: 'long',
            year: 'numeric'
        });
    }, [formatDate]);

    /**
     * Age Calculator
     * Returns number of years from birth date
     */
    const calculateAge = useCallback((dob: string | Date | null | undefined) => {
        if (!dob) return 0;
        try {
            const birth = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age;
        } catch (e) {
            return 0;
        }
    }, []);

    return {
        formatDate,
        formatMemberSince,
        calculateAge,
        isTamil
    };
};
