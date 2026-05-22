import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface PublicRouteProps {
    children?: React.ReactNode;
}

/**
 * Route guard for public pages (Login, Signup, etc.)
 * Redirects authenticated users to their respective dashboards.
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-ivory">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-rosewood/10 border-t-rosewood rounded-full animate-spin" />
                    <p className="text-rosewood font-black text-xs uppercase tracking-widest animate-pulse">
                        Authenticating...
                    </p>
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
        const dashboardPath = user?.role === 'ADMIN' ? '/admin/dashboard' : '/manamaalai/dashboard';
        return <Navigate to={dashboardPath} replace />;
    }

    return <>{children || <Outlet />}</>;
};
