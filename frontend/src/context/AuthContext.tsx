import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { User, Admin, LoginData, SignupData } from '../types/auth';
import { authApi } from '../api/auth.api';
import { useQueryClient } from '@tanstack/react-query';

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
    const queryClient = useQueryClient();
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
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        } else {
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            queryClient.clear(); // Clear cache when token is removed
        }
    }, [queryClient]);

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
        delete api.defaults.headers.common['Authorization'];
        queryClient.clear();
        setTokenState(null);
        setUserState(null);
        window.location.href = '/manamaalai/login';
    }, [queryClient]);

    useEffect(() => {
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, [token]);

    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            setUser,
            setToken,
            logout, 
            isAuthenticated: !!token, 
            loading 
        }}>
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

