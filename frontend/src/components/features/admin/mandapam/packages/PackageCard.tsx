import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { Edit2, CheckCircle2, ChevronDown, Clock, CalendarDays } from 'lucide-react';
import type { MandapamPackage } from '@/types/mandapam';

interface PackageCardProps {
    pkg: MandapamPackage;
    onEdit: (pkg: MandapamPackage) => void;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
}

const planBorder: Record<string, string> = {
    STANDARD: 'border-t-4 border-slate-500/40',
    ROYAL: 'border-t-4 border-gold-accent',
    GRAND: 'border-t-4 border-rosewood/60',
};

const bookingTypeLabels: Record<string, string> = {
    STANDARD: 'adminMandapam.packages.hoursBased',
    ROYAL: 'adminMandapam.packages.oneDayFunction',
    GRAND: 'adminMandapam.packages.twoDayFunction',
};

const VISIBLE_FUNCTIONS = 3;

export const PackageCard: React.FC<PackageCardProps> = ({ pkg, onEdit, onToggleStatus }) => {
    const { language, t } = useLanguage();
    const lang = language === 'ta' ? 'TA' : 'EN';
    const [expanded, setExpanded] = useState(false);

    const topBorder = planBorder[pkg.code] ?? planBorder.STANDARD;

    const displayName = pkg.translations.find(tr => tr.language === lang)?.displayName
        ?? pkg.translations.find(tr => tr.language === 'EN')?.displayName
        ?? pkg.code;

    const activeFunctions = pkg.functions.filter(fn => fn.status);
    const activePricing = pkg.pricings.find(p => p.isActive) ?? pkg.pricings[0];
    const bookingLabel = bookingTypeLabels[pkg.code] ?? 'adminMandapam.packages.hoursBased';

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
            className={`rounded-2xl p-10 flex flex-col h-full transition-all duration-300 bg-ivory-tint border border-primary/30 shadow-sm hover:shadow-md group ${topBorder}`}
        >
            <h3 className="font-heading text-xl md:text-2xl font-bold text-rosewood mb-2">
                {displayName}
            </h3>

            <p className="text-gray-500 font-medium mb-6 text-xs uppercase tracking-widest flex items-center gap-1.5">
                {pkg.code === 'STANDARD' ? <Clock size={12} /> : <CalendarDays size={12} />}
                {t(bookingLabel)}
            </p>

            {activePricing && (
                <p className="font-heading text-2xl font-bold mb-8 text-rosewood">
                    ₹{activePricing.amount.toLocaleString('en-IN')}
                    <span className="text-sm font-medium text-gray-400 ml-1">
                        {activePricing.pricingType === 'HOURLY' ? t('adminMandapam.packages.perHour') : t('adminMandapam.packages.perEvent')}
                    </span>
                </p>
            )}

            <div className="mb-8">
                <p className="text-[10px] font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                    {t('adminMandapam.packages.suitableFor')}
                    <span className="ml-1.5 font-normal normal-case text-gray-300">
                        ({displayFunctions.length} {t('adminMandapam.packages.functionsCount')})
                    </span>
                </p>
                <ul className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {visible.map((fn) => (
                            <motion.li
                                key={fn.id}
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                className="flex items-center gap-3 text-sm text-rosewood"
                            >
                                <CheckCircle2 className="w-5 h-5 shrink-0 text-gold-accent" />
                                <span className="font-medium">{fn.name}</span>
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </ul>
                {hiddenCount > 0 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-rosewood/60 hover:text-rosewood transition-colors"
                    >
                        {expanded ? (
                            t('adminMandapam.packages.showLess')
                        ) : (
                            <>+{hiddenCount} more <ChevronDown size={12} /></>
                        )}
                    </button>
                )}
            </div>

            <div className="grow" />

            <div className="space-y-4 pt-6 border-t border-primary/20">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {t('adminMandapam.packages.visibilityStatus') ?? 'Status'}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${pkg.status ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {pkg.status ? t('adminMandapam.packages.active') : t('adminMandapam.packages.inactive')}
                        </span>
                        <button
                            onClick={() => onToggleStatus(pkg.id, pkg.status)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${pkg.status ? 'bg-emerald-400' : 'bg-slate-300'}`}
                        >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${pkg.status ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => onEdit(pkg)}
                    className="btn-shine w-full py-3 px-6 font-bold rounded-lg transition-colors text-sm border border-gold-accent text-rosewood hover:bg-primary"
                >
                    <span className="flex items-center justify-center gap-2">
                        <Edit2 size={16} />
                        {t('adminMandapam.packages.editDetails')}
                    </span>
                </button>
            </div>
        </motion.div>
    );
};
