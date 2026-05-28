export interface User {
    id: string;
    customId: string;
    firstNameEn: string;
    lastNameEn: string;
    firstNameTa: string | null;
    lastNameTa: string | null;
    email: string;
    phone: string;
    role: 'USER' | 'ADMIN';
    plan: 'BASIC' | 'PREMIUM';
    createdAt: string;
    updatedAt?: string;
    planExpiry?: string | null;
    [key: string]: any;
}

export interface Admin {
    id: string;
    customId: string;
    firstNameEn: string;
    lastNameEn: string;
    firstNameTa?: string | null;
    lastNameTa?: string | null;
    email: string;
    phone: string;
    role: 'ADMIN';
    createdAt?: string;
    [key: string]: any;
}
