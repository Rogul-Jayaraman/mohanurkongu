import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { EmailField } from '@/components/ui/forms/EmailField';
import { PasswordField } from '@/components/ui/forms/PasswordField';
import { validateLogin, type LoginData } from '@/utils/validation';
import { toast } from 'sonner';
import { useTranslations } from '@/hooks/useTranslations';
import * as authApi from '@/api/auth.api';
import { isAppError, isValidationError, getFieldError, getErrorMessage } from '@/lib/errors';
import { Spinner } from '@/components/ui/feedback/Spinner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.4 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { t, translateError } = useTranslations(['auth', 'errors']);
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState<LoginData>({
    identifier: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginData, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof LoginData]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (generalError) setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const newErrors = validateLogin(formData);
    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setIsPending(true);
    try {
      const result = await authApi.login({
        identifier: formData.identifier,
        password: formData.password,
      });

      const user = auth.login(result.accessToken, result.account);

      if (user.role === 'ADMIN') {
        toast.error(t('errors:unauthorized'));
        setGeneralError(t('errors:unauthorized'));
        return;
      }

      toast.success(t('auth:login.success'));
      navigate('/manamaalai/dashboard');
    } catch (err) {
      if (isValidationError(err)) {
        const mapped: Partial<Record<keyof LoginData, string>> = {};
        const identifierErr = getFieldError(err, 'identifier');
        const passwordErr = getFieldError(err, 'password');
        if (identifierErr) mapped.identifier = identifierErr;
        if (passwordErr) mapped.password = passwordErr;
        if (Object.keys(mapped).length > 0) {
          setFieldErrors(mapped);
        } else {
          setGeneralError(getErrorMessage(err));
        }
      } else {
        setGeneralError(getErrorMessage(err));
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3 py-4"
      onSubmit={handleSubmit}
      autoComplete="off"
    >
      {generalError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50/80 backdrop-blur-sm border border-red-100 p-3 sm:p-2 rounded-xl flex items-center gap-3 shadow-sm shadow-red-100/50"
        >
          <div className="shrink-0 size-5 sm:size-6 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <span className="material-symbols-outlined text-xs! sm:text-sm! font-variation-bold">
              priority_high
            </span>
          </div>
          <div className="flex-1">
            <p className="text-[11px] sm:text-xs font-bold text-red-700 leading-tight">{generalError}</p>
          </div>
        </motion.div>
      )}

      <EmailField
        label={t('login.identifier')}
        name="identifier"
        icon="mail"
        value={formData.identifier}
        onChange={handleChange}
        error={fieldErrors.identifier ? t(fieldErrors.identifier) : undefined}
        placeholder=""
        required
        autoComplete="off"
        disabled={isPending}
      />

      <PasswordField
        label={t('login.password')}
        icon="lock"
        name="password"
        value={formData.password}
        onChange={handleChange}
        error={fieldErrors.password ? t(fieldErrors.password) : undefined}
        placeholder=""
        required
        autoComplete="off"
        disabled={isPending}
      />

      <motion.div variants={itemVariants} className="flex justify-end">
        <Link
          to="/manamaalai/forgot-password"
          className="text-xs font-bold text-rosewood hover:text-gold transition-all duration-300 flex items-center gap-1.5 group font-manrope"
        >
          <span className="material-symbols-outlined text-[16px] group-hover:rotate-5 transition-transform">
            key
          </span>
          {t('login.forgotLink')}
        </Link>
      </motion.div>

      <motion.div variants={itemVariants}>
        <motion.button
          whileHover={{ scale: isPending ? 1 : 1.02 }}
          whileTap={{ scale: isPending ? 1 : 0.98 }}
          disabled={isPending}
          className={`w-full py-3.5 sm:py-4 text-white bg-linear-to-r from-rosewood/90 via-rosewood to-rosewood/90 font-bold rounded-xl shadow-lg shadow-rosewood/20 hover:opacity-95 transition-all relative z-10 cursor-pointer text-sm sm:text-base btn-shine flex items-center justify-center ${
            isPending ? 'opacity-70 cursor-not-allowed' : ''
          }`}
          type="submit"
        >
          {isPending ? <Spinner size="sm" color="white" /> : t('login.submit')}
        </motion.button>
      </motion.div>
    </motion.form>
  );
};

export const loginContainerVariants = containerVariants;
export const loginItemVariants = itemVariants;
