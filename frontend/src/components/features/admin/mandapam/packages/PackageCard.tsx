import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Edit2, Trash2, Power, Check, Package as PackageIcon } from 'lucide-react';
import { MandapamPackage } from '@/services/mandapamService';

interface PackageCardProps {
    t: any;
    pkg: MandapamPackage;
    onEdit: (pkg: MandapamPackage) => void;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
    onDelete?: (id: string) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ t, pkg, onEdit, onToggleStatus, onDelete }) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';

    const name = isTamil ? pkg.nameTa : pkg.nameEn;
    const features = isTamil ? pkg.featuresTa : pkg.featuresEn;

    return (
        <div className={`relative flex flex-col h-full bg-white rounded-xl p-8 transition-all duration-500 hover:shadow-xl border-2 ${
            pkg.isActive 
                ? 'border-gold/30 shadow-lg' 
                : 'border-slate-100 opacity-90 shadow-sm'
        }`}>
            {/* Live Badge (Pill style) */}
            {pkg.isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 bg-gold-soft rounded-full z-10 border border-gold/40">
                    <span className="text-[10px] font-black text-rosewood tracking-wide whitespace-nowrap"> 
                        {t('adminMandapam.packages.activePlan')}
                    </span>
                </div>
            )}

            {/* Header Area */}
            <div className="my-4">
                <h3 className="text-lg font-bold text-rosewood tracking-tight leading-tight uppercase">{name}</h3>
            </div>

            {/* Pricing Area */}
            <div className="mb-4 ">
                <div className="">
                    <span className="text-xl font-semibold text-gold/80     ">₹{pkg.price.toLocaleString('en-IN')}</span>
                    <span className="text-sage text-[9px]">{t('adminMandapam.packages.perEvent')}</span>
                </div>
            </div>

            {/* Feature List */}
            <div className="grow space-y-3 mb-4 px-2">
                {features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 group/item">
                        <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                            <Check size={10} className="text-emerald-500" strokeWidth={4} />
                        </div>
                        <span className="text-xs font-bold text-slate-600 leading-tight">
                            {feature}
                        </span>
                    </div>
                ))}
            </div>

            {/* Status Toggle & Admin Actions */}
            <div className="space-y-4 pt-6 border-t border-slate-50 mt-auto">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-sage">{t('adminMandapam.packages.visibilityStatus')}</span>
                        <span className={`text-[10px] font-black uppercase tracking-wide ${pkg.isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {pkg.isActive ? t('adminMandapam.packages.active') : t('adminMandapam.packages.inactive')}
                        </span>
                    </div>
                    
                    {/* UI Toggle Switch */}
                    <button 
                        onClick={() => onToggleStatus(pkg.id, pkg.isActive)}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 flex items-center p-1 ${
                            pkg.isActive ? 'bg-rosewood' : 'bg-slate-200'
                        }`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 transform ${
                            pkg.isActive ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                    </button>
                </div>

                {/* Secondary Admin Actions */}
                <div className="flex items-center justify-center gap-2">
                    <button 
                        onClick={() => onEdit(pkg)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-ivory text-rosewood rounded-xl hover:bg-gold hover:text-white transition-all duration-300 border border-gold/20 text-[10px] font-black uppercase tracking-widest"
                    >
                        <Edit2 size={12} />
                        {t('adminMandapam.packages.editDetails')}
                    </button>
                    {onDelete && (
                        <button 
                            onClick={() => onDelete(pkg.id)}
                            className="p-2.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300 border border-red-100"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
;

