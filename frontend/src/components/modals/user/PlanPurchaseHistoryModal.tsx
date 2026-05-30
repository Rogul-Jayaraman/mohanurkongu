import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { stubFetchPurchaseHistory } from '@/utils/stubs';
import {
    CreditCard,
    Calendar,
    Clock,
    Receipt
} from 'lucide-react';
import { format } from 'date-fns';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { formatCurrency } from '@/utils/format';

interface PlanPurchaseHistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PlanPurchaseHistoryModal: React.FC<PlanPurchaseHistoryDrawerProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation(['myaccount', 'common']);

    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    useEffect(() => { stubFetchPurchaseHistory().then(setData).catch(() => setIsError(true)).finally(() => setIsLoading(false)); }, []);

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            icon={<Receipt size={24} className="text-rosewood" />}
            title={t('drawers.purchase_history.title')}
            size="4xl"
            noFooter
        >
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-4">
                    <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-rosewood/40 font-medium">{t('drawers.purchase_history.loading')}</p>
                </div>
            ) : isError ? (
                <div className="text-center py-12">
                    <p className="text-red-500 font-medium">{t('drawers.purchase_history.error')}</p>
                </div>
            ) : !data || data.length === 0 ? (
                <div className="text-center flex flex-col items-center justify-center h-64 border-2 border-dashed border-gold/20 rounded-2xl bg-ivory/30">
                    <div className="w-16 h-16 bg-ivory rounded-full flex items-center justify-center text-rosewood/20 mb-4">
                        <Receipt size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-rosewood/60">{t('drawers.purchase_history.no_data.title')}</h3>
                    <p className="text-sm text-rosewood/40 mt-1 max-w-xs">{t('drawers.purchase_history.no_data.description')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {data.map((tx) => (
                        <div key={tx.id} className="bg-ivory/30 border border-gold/10 rounded-2xl p-5 hover:shadow-md transition-shadow group">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-rosewood/5 text-rosewood flex items-center justify-center shrink-0">
                                        <CreditCard size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-base font-bold text-rosewood">{t('drawers.purchase_history.transaction.plan_name', { plan: tx.plan })}</h4>
                                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                {t('drawers.purchase_history.transaction.status_success')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-rosewood/40 mt-1.5 flex items-center gap-1.5">
                                            <Clock size={12} />
                                            {format(new Date(tx.createdAt), 'MMM dd, yyyy h:mm a')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-gold/10 pt-3 md:pt-0">
                                    <p className="text-lg font-black text-rosewood">{formatCurrency(tx.amount)}</p>
                                    <p className="text-[10px] font-bold text-rosewood/40 uppercase mt-1 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {t('drawers.purchase_history.transaction.valid_until', { date: format(new Date(tx.endDate), 'MMM dd, yyyy') })}
                                    </p>
                                </div>
                            </div>
                            {tx.note && (
                                <div className="mt-4 pt-3 border-t border-gold/10 text-xs text-rosewood/40 italic">
                                    {t('drawers.purchase_history.transaction.note', { note: tx.note })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </ModalShell>
    );
};
