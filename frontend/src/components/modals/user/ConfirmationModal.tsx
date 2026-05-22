import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { scrollToTop } from '@/components/ui/layout/ScrollToTop';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    variant = 'danger',
    isLoading = false
}) => {
    const { t, language } = useLanguage();
    const isTamil = language === 'ta';

    useEffect(() => {
        if (!isOpen) {
            scrollToTop();
        }
    }, [isOpen]);

    const colors = {
        danger: 'bg-red-600 hover:bg-red-700 text-white shadow-red-200',
        warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200',
        info: 'bg-gold hover:bg-gold/90 text-white shadow-gold/20'
    };

    const iconColors = {
        danger: 'text-red-500 bg-red-50',
        warning: 'text-amber-500 bg-amber-50',
        info: 'text-gold bg-gold-soft/20'
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-gold-soft/20 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-gold/20"
                    >
                        <div className="p-6 pb-0 flex items-start justify-between">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconColors[variant]}`}>
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-gray-100 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-3">
                            <h3 className={`text-xl font-bold text-rosewood ${isTamil ? 'font-sans' : 'font-serif'}`}>
                                {title}
                            </h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                {message}
                            </p>
                        </div>

                        <div className="p-6 bg-gold-soft/10 border-t border-gold/5 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {cancelText || (isTamil ? 'இரத்து செய்' : 'Cancel')}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onConfirm();
                                }}
                                disabled={isLoading}
                                className={`flex-1 px-6 py-3 rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${colors[variant]}`}
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    confirmText || (isTamil ? 'உறுதிப்படுத்து' : 'Confirm')
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
