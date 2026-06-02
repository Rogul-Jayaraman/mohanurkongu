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
    roles?: string[];
    createdAt: string;
    updatedAt?: string;
    membership: {
      planCode: string;
      expiresAt: string | null;
    } | null;
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
    roles?: string[];
    createdAt?: string;
    [key: string]: any;
}
