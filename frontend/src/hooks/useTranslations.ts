import { useTranslation } from 'react-i18next';

/**
 * Centralized translation hook that ensures consistent usage across all components
 * This hook provides a unified interface for accessing translations with proper namespacing
 */
export const useTranslations = (namespaces: string | string[] = ['common']) => {
    const { t, i18n } = useTranslation(namespaces);
    
    // Helper function to get translation with fallback across all provided namespaces
    const translate = (key: string, options?: any): string => {
        // If key already contains namespace with ':', use it directly
        if (key.includes(':')) {
            return t(key, options) as string;
        }

        // Support dot notation (e.g., 'errors.invalidCredentials')
        const nsPrefixes = ['errors.', 'auth.', 'signup.', 'common.', 'dashboard.', 'profile_new.', 'adminLogin.', 'adminLayout.', 'adminMatrimony.', 'adminMandapam.', 'calendar.'];
        const matchedPrefix = nsPrefixes.find(p => key.startsWith(p));
        if (matchedPrefix) {
            const ns = matchedPrefix.slice(0, -1);
            const actualKey = key.slice(matchedPrefix.length);
            return t(`${ns}:${actualKey}`, options) as string;
        }
        
        // Convert namespaces to array if it's a string
        const nsList = Array.isArray(namespaces) ? namespaces : [namespaces];

        // Try each namespace in order
        for (const ns of nsList) {
            const namespacedKey = `${ns}:${key}`;
            
            // i18n.exists() is the most reliable way to check for key presence
            if (i18n.exists(namespacedKey)) {
                return t(namespacedKey, options) as string;
            }
        }
        
        // Final fallback to common if not already checked
        if (!nsList.includes('common')) {
            const commonKey = `common:${key}`;
            if (i18n.exists(commonKey)) {
                return t(commonKey, options) as string;
            }
        }
        
        // Final fallback to the key itself using default i18next behavior
        return t(key, options) as string;
    };
    
    /**
     * Helper to translate errors from API or forms
     */
    const translateError = (error: any, code?: string): string => {
        if (!error) return '';
        
        // If we have a standardized code, use it first
        if (code && i18n.exists(`errors:${code}`)) {
            return translate(`errors:${code}`);
        }

        // Check if error itself is a code or key
        const errorStr = typeof error === 'string' ? error : (error.details || error.message || '');
        
        // Try direct key matches in errors namespace
        if (i18n.exists(`errors:${errorStr}`)) {
            return translate(`errors:${errorStr}`);
        }

        // Map common error strings to keys if no code is present
        const commonErrors: Record<string, string> = {
            'Invalid or expired verification code': 'ERR_AUTH_004',
            'Invalid verification code': 'otpInvalid',
            'Verification code has expired': 'otpExpired',
            'Invalid password': 'invalidCredentials',
            'User already exists': 'userExists',
            'Network Error': 'networkError',
            'Internal server error': 'serverError'
        };

        const mappedKey = commonErrors[errorStr];
        if (mappedKey) {
            return translate(`errors:${mappedKey}`);
        }

        return errorStr;
    };
    
    return {
        t: translate,
        translateError,
        i18n,
        language: i18n.language,
        changeLanguage: i18n.changeLanguage
    };
};