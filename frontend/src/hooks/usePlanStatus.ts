import { useAuth } from '../context/AuthContext';

/**
 * Hook to check the user's subscription plan status.
 * Currently stubbed to always return BASIC while plan system is being rebuilt.
 * TODO: Re-implement with new plan options, restrictions and configuration.
 */
export const usePlanStatus = () => {
    const context = useAuth();
    const user = context?.user;

    return {
        user,
        plan: 'BASIC' as const,
        isPremiumActive: false,
        isBasic: true,
        isPremium: false,
        isExpired: false,
        isUserRole: !!user && user.role === 'USER',
        isAdmin: !!user && user.role === 'ADMIN'
    };
};
