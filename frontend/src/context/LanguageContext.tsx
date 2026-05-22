import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';

type Language = 'en' | 'ta';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, options?: any) => string;
    translateError: (error: string | any, code?: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Language Provider that manages language state and syncs with i18next
 */
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t: _unused_i18nT } = useTranslation(["common", "auth", "signup", "dashboard", "errors", "profile_new", "adminLogin", "adminLayout", "adminMatrimony", "adminMandapam", "myaccount", "myprofiles", "browse", "shortlist", "analytics"]);
    const [language, setLanguageState] = useState<Language>(
        (localStorage.getItem('language') as Language) || 'en'
    );

    // Synchronize i18n instance when language changes
    useEffect(() => {
        if (i18n.language !== language) {
            i18n.changeLanguage(language);
        }
        localStorage.setItem('language', language);
        document.documentElement.lang = language;
    }, [language]);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
    }, []);

    // Create a stable translation function that always uses the latest i18nT
    // Create a stable translation function that always uses the latest i18n instance
    const t = useCallback((key: string, options?: any) => {
        if (!key) return '';

        // Handle case where key might already include a namespace with ':'
        if (key.includes(':')) {
            return i18n.t(key, options) as string;
        }

        // Special handling for legacy/API dot notation (e.g., 'errors.invalidCredentials')
        // We convert it to 'errors:invalidCredentials'
        const nsPrefixes = [
            'errors.', 'auth.', 'signup.', 'common.', 'dashboard.', 'profile_new.', 'adminLogin.', 'adminLayout.', 'adminMatrimony.', 'adminMandapam.', 'myprofiles.', 'browse.', 'shortlist.', 'myaccount.'
        ];
        const matchedPrefix = nsPrefixes.find(p => key.startsWith(p));
        
        if (matchedPrefix) {
            const ns = matchedPrefix.slice(0, -1);
            const actualKey = key.slice(matchedPrefix.length);
            return i18n.t(`${ns}:${actualKey}`, options) as string;
        }

        // Try 'common' namespace if no prefix
        if (i18n.exists(`common:${key}`)) {
            return i18n.t(`common:${key}`, options) as string;
        }

        // Search in other semantic namespaces as fallbacks
        const fallbacks = ['auth', 'signup', 'errors', 'dashboard', 'myprofiles', 'browse', 'shortlist', 'myaccount'];
        for (const ns of fallbacks) {
            if (i18n.exists(`${ns}:${key}`)) {
                return i18n.t(`${ns}:${key}`, options) as string;
            }
        }

        // Final fallback to absolute key via i18next default behavior
        return i18n.t(key, options) as string;
    }, []);

    /**
     * Helper to translate errors from API or forms
     */
    const translateError = useCallback((error: any, code?: string) => {
        if (!error) return '';
        
        // If we have a standardized code, use it first
        if (code && i18n.exists(`errors:${code}`)) {
            return i18n.t(`errors:${code}`) as string;
        }

        // Check if error itself is a code
        const errorStr = typeof error === 'string' ? error : (error.message || '');
        if (errorStr.startsWith('ERR_') && i18n.exists(`errors:${errorStr}`)) {
            return i18n.t(`errors:${errorStr}`) as string;
        }

        // Map common error strings to keys if no code is present
        const commonErrors: Record<string, string> = {
            'Invalid or expired verification code': 'ERR_AUTH_004',
            'Invalid verification code': 'otpInvalid',
            'Verification code has expired': 'otpExpired',
            'Invalid password': 'invalidCredentials',
            'User already exists': 'userExists',
            'Network Error': 'networkError',
            'Internal server error': 'serverError',
            'Failed to send verification code': 'otpSendFailed',
            'Failed to send OTP': 'otpSendFailed',
            'Failed to send reset code': 'otpSendFailed',
            'Login failed': 'loginFailed',
            'Signup failed': 'signupFailed',
            'Failed to reset password': 'resetFailed'
        };

        const mappedKey = commonErrors[errorStr];
        if (mappedKey) {
            return i18n.t(`errors:${mappedKey}`) as string;
        }

        return errorStr;
    }, []);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, translateError }}>
            {children}
        </LanguageContext.Provider>
    );
};

/**
 * Hook to access language settings and translations
 * 
 * Example:
 * const { t, language, setLanguage } = useLanguage();
 */
export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        return { language: 'en' as Language, setLanguage: () => {}, t: (key: string) => key || '', translateError: (_error: any) => '' };
    }
    return context;
};
