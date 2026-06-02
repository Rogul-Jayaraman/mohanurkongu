import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { Edit2, CheckCircle2, ChevronDown, Clock, CalendarDays } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import type { MandapamPackage } from '@/types/mandapam';

interface PackageCardProps {
    pkg: MandapamPackage;
    onEdit: (pkg: MandapamPackage) => void;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
}

const planAccent: Record<string, string> = {
    STANDARD: 'from-slate-400/20 to-slate-300/10 border-slate-300/30',
    ROYAL: 'from-gold/20 to-amber-50/10 border-gold/30',
    GRAND: 'from-rosewood/20 to-rosewood/5 border-rosewood/30',
};

const packageCodeLabelKeys: Record<string, string> = {
    STANDARD: 'adminMandapam.packages.hoursBased',
    ROYAL: 'adminMandapam.packages.oneDayFunction',
    GRAND: 'adminMandapam.packages.twoDayFunction',
};

const VISIBLE_FUNCTIONS = 3;

export const PackageCard: React.FC<PackageCardProps> = ({ pkg, onEdit, onToggleStatus }) => {
    const { language, t } = useLanguage();
    const lang = language === 'ta' ? 'TA' : 'EN';
    const [expanded, setExpanded] = useState(false);

    const accent = planAccent[pkg.code] ?? planAccent.STANDARD;

    const displayName = pkg.translations.find(tr => tr.language === lang)?.displayName
        ?? pkg.translations.find(tr => tr.language === 'EN')?.displayName
        ?? pkg.code;

    const activeFunctions = pkg.functions.filter(fn => fn.status);
    const activePricing = pkg.pricings.find(p => p.isActive) ?? pkg.pricings[0];
    const bookingLabel = packageCodeLabelKeys[pkg.code] ?? 'adminMandapam.packages.hoursBased';

    const displayFunctions = activeFunctions.map(fn => ({
        id: fn.id,
        name: fn.translations.find(tr => tr.language === lang)?.name
            ?? fn.translations.find(tr => tr.language === 'EN')?.name
            ?? '',
    })).filter(f => f.name);

    const visible = expanded ? displayFunctions : displayFunctions.slice(0, VISIBLE_FUNCTIONS);
    const hiddenCount = displayFunctions.length - VISIBLE_FUNCTIONS;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            whileHover={{ y: -5 }}
            className={`relative bg-ivory border rounded-2xl p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-all bg-linear-to-br ${accent}`}
        >
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-rosewood">{displayName}</h3>
                {!pkg.status && (
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('adminMandapam.packages.inactive')}</span>
                )}
            </div>

            <p className="text-[10px] font-bold text-rosewood/60 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                {pkg.code === 'STANDARD' ? <Clock size={11} /> : <CalendarDays size={11} />}
                {t(bookingLabel)}
            </p>

            {activePricing && (
                <p className="text-2xl font-black text-rosewood mb-6">
                    {formatCurrency(activePricing.amount)}
                    <span className="text-xs font-bold text-rosewood/60 ml-1">
                        {activePricing.pricingType === 'HOURLY' ? t('adminMandapam.packages.perHour') : t('adminMandapam.packages.perEvent')}
                    </span>
                </p>
            )}

            {pkg.tokenCount > 0 && (
                <div className="flex items-center gap-1.5 mb-4 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl w-fit">
                    <span className="material-symbols-outlined text-amber-600 text-sm">confirmation_number</span>
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                        {pkg.tokenCount} {t('adminMandapam.packages.token')}{pkg.tokenCount > 1 ? 's' : ''}
                    </span>
                </div>
            )}

            <div className="mb-6">
                <p className="text-[10px] font-bold text-rosewood/50 uppercase tracking-wider mb-3">
                    {t('adminMandapam.packages.suitableFor')}
                    <span className="ml-1.5 font-normal normal-case text-rosewood/40">
                        ({displayFunctions.length} {t('adminMandapam.packages.functionsCount')})
                    </span>
                </p>
                <ul className="space-y-2.5">
                    <AnimatePresence mode="popLayout">
                        {visible.map((fn) => (
                            <motion.li
                                key={fn.id}
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                className="flex items-center gap-2.5 text-sm text-rosewood/80"
                            >
                                <CheckCircle2 className="w-4 h-4 shrink-0 text-gold-accent" />
                                <span className="font-medium">{fn.name}</span>
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </ul>
                {hiddenCount > 0 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-rosewood/70 hover:text-rosewood transition-colors"
                    >
                        {expanded ? (
                            t('adminMandapam.packages.showLess')
                        ) : (
                            <>{t('adminMandapam.packages.more')} +{hiddenCount} <ChevronDown size={12} /></>
                        )}
                    </button>
                )}
            </div>

            <div className="grow" />

            <div className="pt-4 border-t border-gold/20 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${pkg.status ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span className={`text-[10px] font-bold ${pkg.status ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {pkg.status ? t('adminMandapam.packages.active') : t('adminMandapam.packages.inactive')}
                        </span>
                    </div>
                    <button
                        onClick={() => onToggleStatus(pkg.id, pkg.status)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer hover:ring-2 hover:ring-rosewood/30 ${pkg.status ? 'bg-emerald-500' : 'bg-slate-400'}`}
                    >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${pkg.status ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                    </button>
                </div>
                <button
                    onClick={() => onEdit(pkg)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gold/30 rounded-xl text-xs font-bold text-rosewood/80 hover:text-rosewood hover:border-rosewood/40 transition-all"
                >
                    <Edit2 size={14} />
                    {t('adminMandapam.packages.editDetails')}
                </button>
            </div>
        </motion.div>
    );
};
