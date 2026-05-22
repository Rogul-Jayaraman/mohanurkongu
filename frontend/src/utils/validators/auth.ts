export interface LoginData {
    identifier: string;
    password: string;
    requiredRole?: 'USER' | 'ADMIN';
}

export interface SignupData {
    firstNameEn: string;
    lastNameEn: string;
    firstNameTa: string;
    lastNameTa: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword?: string;
    termsAccepted?: boolean;
    verificationToken?: string;
}

/**
 * Returns i18n keys for login errors.
 */
export const validateLogin = (data: LoginData) => {
    const errors: Partial<Record<keyof LoginData, string>> = {};

    if (!data.identifier) {
        errors.identifier = "errors.required";
    }

    if (!data.password) {
        errors.password = "errors.required";
    } else if (data.password.length < 8) {
        errors.password = "errors.passwordLength";
    }

    return errors;
};

/**
 * Returns i18n keys for signup errors.
 */
export const validateSignupStep = (step: number, data: SignupData) => {
    const errors: Partial<Record<keyof SignupData, string>> = {};

    if (step === 1) {
        if (!data.firstNameEn) errors.firstNameEn = "errors.required";
        if (!data.lastNameEn) errors.lastNameEn = "errors.required";
        if (!data.firstNameTa) errors.firstNameTa = "errors.required";
        if (!data.lastNameTa) errors.lastNameTa = "errors.required";
        
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.email = "errors.invalidEmail";
        }
        
        if (data.phone && (data.phone.length < 10 || data.phone.length > 25 || !/^\+[\d\s-]+$/.test(data.phone))) {
            errors.phone = "errors.invalidPhone";
        }

        if (!data.password) {
            errors.password = "errors.required";
        } else if (data.password.length < 8) {
            errors.password = "errors.passwordLength";
        }

        if (data.password !== data.confirmPassword) {
            errors.confirmPassword = "errors.passwordMismatch";
        }

        if (!data.termsAccepted) {
            errors.termsAccepted = "errors.termsRequired";
        }
    }

    return errors;
};
