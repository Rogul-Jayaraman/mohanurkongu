import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { ChevronDown, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import type { MandapamPackage } from '@/types/mandapam';

interface PricingHistoryProps {
    packages: MandapamPackage[];
}

const planBadge: Record<string, string> = {
    STANDARD: 'bg-slate-100 text-slate-600',
    ROYAL: 'bg-amber-100 text-amber-700',
    GRAND: 'bg-rosewood/10 text-rosewood',
};

export const PricingHistory: React.FC<PricingHistoryProps> = ({ packages }) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    const sortedPricings = (pkg: MandapamPackage) =>
        [...pkg.pricings].sort((a, b) => {
            const aTime = a.effectiveFrom ? new Date(a.effectiveFrom).getTime() : new Date(pkg.createdAt).getTime();
            const bTime = b.effectiveFrom ? new Date(b.effectiveFrom).getTime() : new Date(pkg.createdAt).getTime();
            return aTime - bTime;
        });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.4 }}
            className="rounded-xl border-2 border-slate-200/50 bg-white/10 backdrop-blur-2xl overflow-hidden shadow-sm"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/20 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-gold" />
                    <h2 className="text-base font-bold text-rosewood">
                        {t('adminMandapam.packages.pricingHistory')}
                    </h2>
                </div>
                <ChevronDown
                    size={20}
                    className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-5 space-y-4">
                            <p className="text-xs text-slate-400">
                                {t('adminMandapam.packages.pricingHistoryDesc')}
                            </p>
                            <div className="space-y-3">
                                {packages.map((pkg) => {
                                    const entries = sortedPricings(pkg);
                                    if (entries.length === 0) return null;

                                    const displayName = pkg.translations.find(tr => tr.language === 'EN')?.displayName ?? pkg.code;

                                    return (
                                        <div
                                            key={pkg.id}
                                            className="flex items-center gap-4 px-4 py-3 bg-white/40 rounded-xl border border-slate-200/50"
                                        >
                                            <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${planBadge[pkg.code] || ''}`}>
                                                {pkg.code}
                                            </span>
                                            <span className="text-sm font-bold text-rosewood min-w-[120px]">
                                                {displayName}
                                            </span>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {entries.map((p, i) => (
                                                    <React.Fragment key={p.id}>
                                                        {i > 0 && (
                                                            <span className="text-slate-300 text-xs">→</span>
                                                        )}
                                                        <span className={`text-sm font-semibold ${p.isActive ? 'text-gold' : 'text-slate-400'}`}>
                                                            {formatCurrency(p.amount)}
                                                            <span className="text-[10px] text-slate-400 ml-0.5">
                                                                {p.pricingType === 'HOURLY' ? '/hr' : '/event'}
                                                            </span>
                                                        </span>
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                            {entries.filter(p => p.isActive).length > 0 && (
                                                <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                                                    Current
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
