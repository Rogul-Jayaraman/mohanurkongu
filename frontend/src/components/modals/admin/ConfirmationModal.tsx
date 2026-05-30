import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { useLanguage } from '@/context/LanguageContext';

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

    const variantColors = {
        danger: 'bg-rosewood text-ivory hover:shadow-lg shadow-rosewood/20',
        warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200',
        info: 'bg-gold text-white hover:bg-gold/90 shadow-gold/20'
    };

    const iconVariants = {
        danger: 'bg-rosewood/10 text-rosewood',
        warning: 'text-amber-500 bg-amber-50',
        info: 'text-gold bg-gold-soft/20'
    };

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            icon={<div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconVariants[variant]}`}><AlertTriangle size={20} /></div>}
            title={title}
            size="sm"
            noFooter={false}
            footer={
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-6 py-3 border border-gold/10 text-rosewood font-bold rounded-xl hover:bg-ivory transition-all text-sm disabled:opacity-50"
                    >
                        {cancelText || t('common.cancel')}
                    </button>
                    <button
                        onClick={() => onConfirm()}
                        disabled={isLoading}
                        className={`flex-1 px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${variantColors[variant]}`}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            confirmText || t('common.confirm')
                        )}
                    </button>
                </div>
            }
        >
            <p className="text-sm text-rosewood/60 leading-relaxed">
                {message}
            </p>
        </ModalShell>
    );
};
