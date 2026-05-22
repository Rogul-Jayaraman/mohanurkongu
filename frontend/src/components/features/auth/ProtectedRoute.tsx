import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
    children?: React.ReactNode;
    allowedRole?: 'USER' | 'ADMIN';
}

/**
 * Route guard that ensures the user is authenticated and has the correct role.
 * Redirects to appropriate login page if unauthenticated.
 * Redirects to dashboard if unauthorized.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
    children, 
    allowedRole 
}) => {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

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

    if (!isAuthenticated) {
        // Redirect to appropriate login based on intended destination
        const redirectPath = location.pathname.startsWith('/admin') ? '/admin/login' : '/manamaalai/login';
        return <Navigate to={redirectPath} state={{ from: location }} replace />;
    }

    if (allowedRole && user?.role !== allowedRole) {
        // Authorized user but wrong role
        const dashboardPath = user?.role === 'ADMIN' ? '/admin/dashboard' : '/manamaalai/dashboard';
        return <Navigate to={dashboardPath} replace />;
    }

    return <>{children || <Outlet />}</>;
};
