import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';
import { Input } from '@/components/ui/forms/Input';
import { PasswordField } from '@/components/ui/forms/PasswordField';

interface ChangePasswordFormProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ isOpen, onClose }) => {
    const { t, translateError } = useLanguage();
    const [formData, setFormData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [strength, setStrength] = useState({ score: 0, label: 'Very Weak', color: 'bg-gray-200' });

    useEffect(() => {
        const pwd = formData.newPassword;
        let s = 0;
        if (pwd.length > 8) s++;
        if (/[A-Z]/.test(pwd)) s++;
        if (/[a-z]/.test(pwd)) s++;
        if (/[0-9]/.test(pwd)) s++;

        const levels = [
            { label: t('myaccount:drawers.change_password.strength.levels.very_weak'), color: 'bg-red-500' },
            { label: t('myaccount:drawers.change_password.strength.levels.weak'), color: 'bg-orange-500' },
            { label: t('myaccount:drawers.change_password.strength.levels.fair'), color: 'bg-yellow-500' },
            { label: t('myaccount:drawers.change_password.strength.levels.good'), color: 'bg-blue-500' },
            { label: t('myaccount:drawers.change_password.strength.levels.strong'), color: 'bg-green-500' },
            { label: t('myaccount:drawers.change_password.strength.levels.unbreakable'), color: 'bg-emerald-500' }
        ];
        setStrength({ score: s, label: levels[s]?.label || levels[0].label, color: levels[s]?.color || levels[0].color });
    }, [formData.newPassword, t]);

    useEffect(() => {
        if (isOpen) { document.body.style.overflow = 'hidden'; }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error(t('myaccount:drawers.change_password.errors.mismatch'));
            return;
        }
        if (strength.score < 3) {
            toast.warning(t('myaccount:drawers.change_password.errors.too_weak'));
            return;
        }
        setIsLoading(true);
        try {
            await api.post('/settings/change-password', { oldPassword: formData.oldPassword, newPassword: formData.newPassword });
            toast.success(t('myaccount:drawers.change_password.success'));
            onClose();
            setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            toast.error(translateError(error) || t('myaccount:drawers.change_password.errors.failed'));
        } finally {
            setIsLoading(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-9999 flex items-end justify-center overflow-hidden">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-gold-soft/20 backdrop-blur-sm" />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-4xl max-h-[85vh] bg-gold-soft/10 backdrop-blur-2xl border-t border-gold/20 rounded-t-3xl flex flex-col overflow-hidden shadow-[0_-20px_40px_rgba(0,0,0,0.1)]"
                    >
                        <div className="w-full flex justify-center pt-3 pb-1 absolute top-0 left-0 z-50 bg-gold-soft/5 backdrop-blur-md">
                            <div className="w-12 h-1.5 rounded-full bg-gray-200" />
                        </div>
                        <div className="pt-10 px-8 pb-6 border-b border-gold/10 flex items-center justify-between sticky top-0 bg-white/40 backdrop-blur-xl z-40">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-rosewood/10 text-rosewood flex items-center justify-center">
                                    <Shield size={24} strokeWidth={2} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-serif font-black text-rosewood">{t('drawers.change_password.title')}</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{t('drawers.change_password.subtitle')}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-rosewood transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-8 py-8 pb-12 custom-scrollbar bg-gold-soft/5 backdrop-blur-sm shadow-inner">
                            <div className="max-w-xl mx-auto">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <PasswordField label={t('drawers.change_password.fields.old_password')} name="oldPassword" icon="lock" required value={formData.oldPassword} onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })} placeholder={t('drawers.change_password.fields.placeholders.old')} />
                                    <div className="space-y-3">
                                        <PasswordField label={t('drawers.change_password.fields.new_password')} name="newPassword" icon="lock_open" required value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} placeholder={t('drawers.change_password.fields.placeholders.new')} />
                                        {formData.newPassword && (
                                            <div className="bg-white/50 backdrop-blur-sm border border-gold/10 rounded-2xl p-4 mt-2">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-[10px] font-black text-rosewood/60 uppercase tracking-widest">{t('drawers.change_password.strength.label', { label: strength.label })}</span>
                                                    <span className="text-[10px] font-black text-rosewood/40 uppercase tracking-widest">{t('drawers.change_password.strength.score', { percent: Math.round((strength.score / 4) * 100) })}</span>
                                                </div>
                                                <div className="flex gap-1.5 h-1.5 mb-4">
                                                    {[1, 2, 3, 4].map((step) => (
                                                        <div key={step} className={`flex-1 rounded-full transition-all duration-500 ${strength.score >= step ? strength.color : 'bg-gray-100'}`} />
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                                                    {[
                                                        { label: t('drawers.change_password.strength.requirements.length'), met: formData.newPassword.length >= 8 },
                                                        { label: t('drawers.change_password.strength.requirements.uppercase'), met: /[A-Z]/.test(formData.newPassword) },
                                                        { label: t('drawers.change_password.strength.requirements.number'), met: /[0-9]/.test(formData.newPassword) },
                                                    ].map(req => (
                                                        <div key={req.label} className="flex items-center gap-2">
                                                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${req.met ? 'bg-green-500' : 'bg-gray-100'}`}>
                                                                {req.met && <Check size={8} className="text-white" strokeWidth={5} />}
                                                            </div>
                                                            <span className={`text-[10px] font-bold tracking-tight ${req.met ? 'text-green-600' : 'text-gray-400'}`}>{req.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <PasswordField label={t('drawers.change_password.fields.confirm_password')} name="confirmPassword" icon="verified_user" required value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder={t('drawers.change_password.fields.placeholders.confirm')} error={formData.confirmPassword && formData.newPassword !== formData.confirmPassword ? t('drawers.change_password.errors.mismatch') : undefined} />
                                    <button type="submit" disabled={isLoading || strength.score < 3 || formData.newPassword !== formData.confirmPassword} className="w-full py-4 bg-rosewood text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-rosewood/20 hover:scale-[1.02] active:scale-95 transition-all disabled:bg-sage/20 disabled:text-rosewood/20 disabled:shadow-none disabled:hover:scale-100 disabled:active:scale-100 mt-4 flex items-center justify-center gap-3">
                                        {isLoading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Shield size={16} />
                                                {t('drawers.change_password.submit')}
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
