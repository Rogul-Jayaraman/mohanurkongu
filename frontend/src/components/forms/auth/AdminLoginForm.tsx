import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import * as authApi from '@/api/auth.api';
import { Input } from '@/components/ui/forms/Input';
import { PasswordField } from '@/components/ui/forms/PasswordField';
import { Spinner as LoadingSpinner } from '@/components/ui/feedback/Spinner';
import { validateLogin, type LoginData } from '@/utils/validation';
import { toast } from 'sonner';
import { useTranslations } from '@/hooks/useTranslations';

const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { staggerChildren: 0.1, duration: 0.5 }
    }
};

const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
};

/**
 * AdminLoginForm – admin login form with state, validation, and submission.
 */
export const AdminLoginForm: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { t, translateError } = useTranslations(['adminLogin', 'errors']);
    const [isPending, setIsPending] = useState(false);
    const [formData, setFormData] = useState<LoginData>({
        identifier: '',
        password: '',
        requiredRole: 'ADMIN'
    });
    const [errors, setErrors] = useState<Partial<Record<keyof LoginData, string>>>({});
    const [generalError, setGeneralError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof LoginData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
        if (generalError) setGeneralError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError(null);

        const newErrors = validateLogin(formData);
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsPending(true);
        (async () => {
            try {
                const response = await authApi.login({
                    identifier: formData.identifier,
                    password: formData.password,
                    portal: 'ADMIN',
                });
                login(response.accessToken, response.account);
                toast.success(t('auth:login.success') || 'Login successful');
                navigate('/admin/dashboard');
            } catch (error: any) {
                const message = error.details || error.message || 'login_failed';
                toast.error(message);
                setGeneralError(message);
            } finally {
                setIsPending(false);
            }
        })();
    };

    return (
        <>
            {generalError && (
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 mb-6"
                >
                    <span className="material-symbols-outlined text-red-600 text-xl font-variation-bold">gpp_maybe</span>
                    <p className="text-xs font-bold text-red-700 leading-tight">
                        {generalError}
                    </p>
                </motion.div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
                <Input
                    label={t('identifier')}
                    name="identifier"
                    icon="mail"
                    value={formData.identifier}
                    onChange={handleChange}
                    error={errors.identifier ? t(errors.identifier) : undefined}
                    placeholder=''
                    required
                    autoCapitalize="none"
                />

                <PasswordField
                    label={t('password')}
                    icon="vpn_key"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password ? t(errors.password) : undefined}
                    placeholder=''
                    required
                />

                <motion.div variants={itemVariants}>
                    <motion.button
                        whileHover={{ scale: isPending ? 1 : 1.02 }}
                        whileTap={{ scale: isPending ? 1 : 0.98 }}
                        disabled={isPending}
                        className={`w-full py-4 bg-rosewood text-white font-bold rounded-xl shadow-lg shadow-rosewood/20 hover:bg-dark-brown transition-all relative z-10 flex items-center justify-center gap-2 ${isPending ? 'opacity-70 cursor-wait' : ''}`}
                        type="submit"
                    >
                        {isPending ? (
                            <LoadingSpinner size="sm" color="white" />
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[20px]">lock_open</span>
                                {t('submit')}
                            </>
                        )}
                    </motion.button>
                </motion.div>

                <motion.div variants={itemVariants} className="text-center pt-2">
                    <Link
                        to="/manamaalai/login"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-logo-dark/50 hover:text-rosewood transition-all duration-300 group"
                    >
                        <span className="border-b border-transparent group-hover:border-rosewood/30 pb-0.5">
                            {t('backToUser')}
                        </span>
                    </Link>
                </motion.div>
            </form>
        </>
    );
};

export const adminLoginContainerVariants = containerVariants;
export const adminLoginItemVariants = itemVariants;
