import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Admin } from '../types/user';

interface AuthContextType {
    user: User | Admin | null;
    token: string | null;
    setUser: (user: User | Admin | null) => void;
    setToken: (token: string | null) => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUserState] = useState<User | Admin | null>(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [token, setTokenState] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const setToken = useCallback((newToken: string | null) => {
        setTokenState(newToken);
        if (newToken) {
            localStorage.setItem('token', newToken);
        } else {
            localStorage.removeItem('token');
        }
    }, []);

    const setUser = useCallback((newUser: User | Admin | null) => {
        setUserState(newUser);
        if (newUser) {
            localStorage.setItem('user', JSON.stringify(newUser));
        } else {
            localStorage.removeItem('user');
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTokenState(null);
        setUserState(null);
        window.location.href = '/manamaalai/login';
    }, []);

    useEffect(() => {
        setLoading(false);
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, setUser, setToken, logout, isAuthenticated: !!token, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
