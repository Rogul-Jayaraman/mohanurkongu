export interface User {
    id: string;
    customId: string;
    firstNameEn: string;
    lastNameEn: string;
    firstNameTa: string;
    lastNameTa: string;
    email: string;
    phone: string;
    role: 'USER';
    plan: 'BASIC' | 'PREMIUM';
    createdAt: string;
    planExpiry?: string | null;
}

export interface Admin {
    id: string;
    firstNameEn: string;
    lastNameEn: string;
    firstNameTa: string;
    lastNameTa: string;
    email: string;
    phone: string;
    role: 'ADMIN';
    createdAt?: string;
}

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
    termsAccepted: boolean;
    verificationToken?: string;
}

export interface LoginResult {
    token: string;
    user: User | Admin;
}

export interface SignupResult {
    userId: string;
    token: string;
}

export interface VerificationResult {
    verified: boolean;
    verificationToken: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data: T | null;
    message?: string;
    error?: {
        code: string;
        message: string;
    } | null;
}
