import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { Loader2, Plus, X, Save } from 'lucide-react';
import { adminUpdatePackage } from '@/api/mandapam.api';
import { toast } from 'sonner';
import type { MandapamPackage, TranslationPair } from '@/types/mandapam';
import { formatCurrency } from '@/utils/format';

interface EditPackageModalProps {
    isOpen: boolean;
    onClose: () => void;
    pkg: MandapamPackage;
    onSuccess: () => void;
}

export const EditPackageModal: React.FC<EditPackageModalProps> = ({ isOpen, onClose, pkg, onSuccess }) => {
    const { t } = useLanguage();

    const [enName, setEnName] = useState('');
    const [taName, setTaName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [removedFunctionIds, setRemovedFunctionIds] = useState<Set<string>>(new Set());
    const [newFunctions, setNewFunctions] = useState<{ enName: string; taName: string }[]>([]);
    const [newFnEn, setNewFnEn] = useState('');
    const [newFnTa, setNewFnTa] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setEnName(pkg.translations.find(tr => tr.language === 'EN')?.displayName ?? '');
            setTaName(pkg.translations.find(tr => tr.language === 'TA')?.displayName ?? '');
            const activePricing = pkg.pricings.find(p => p.isActive) ?? pkg.pricings[0];
            setNewPrice(activePricing?.amount.toString() ?? '');
            setRemovedFunctionIds(new Set());
            setNewFunctions([]);
            setNewFnEn('');
            setNewFnTa('');
            setIsSaving(false);
        }
    }, [isOpen, pkg]);

    const handleRemoveFunction = (fnId: string) => {
        setRemovedFunctionIds(prev => new Set(prev).add(fnId));
    };

    const handleUndoRemoveFunction = (fnId: string) => {
        setRemovedFunctionIds(prev => {
            const next = new Set(prev);
            next.delete(fnId);
            return next;
        });
    };

    const handleAddFunction = () => {
        if (!newFnEn.trim() || !newFnTa.trim()) return;
        setNewFunctions(prev => [...prev, { enName: newFnEn.trim(), taName: newFnTa.trim() }]);
        setNewFnEn('');
        setNewFnTa('');
    };

    const handleRemoveNewFunction = (index: number) => {
        setNewFunctions(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const displayName: TranslationPair[] = [
                { language: 'EN', value: enName },
                { language: 'TA', value: taName },
            ];

            const functionsDto: { id?: string; name: TranslationPair[]; status?: boolean }[] = [];

            pkg.functions.forEach(fn => {
                if (removedFunctionIds.has(fn.id)) {
                    functionsDto.push({ id: fn.id, name: [], status: false });
                }
            });

            newFunctions.forEach(fn => {
                functionsDto.push({
                    name: [
                        { language: 'EN', value: fn.enName },
                        { language: 'TA', value: fn.taName },
                    ],
                });
            });

            const pricingAmount = parseFloat(newPrice);

            await adminUpdatePackage(pkg.id, {
                displayName,
                functions: functionsDto.length > 0 ? functionsDto : undefined,
                ...(pricingAmount && !isNaN(pricingAmount) ? { pricing: { amount: pricingAmount } } : {}),
            });

            toast.success(t('adminMandapam.packages.updateSuccess'));
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.message ?? t('adminMandapam.packages.somethingWentWrong'));
        } finally {
            setIsSaving(false);
        }
    };

    const activeFunctions = pkg.functions.filter(fn => fn.status && !removedFunctionIds.has(fn.id));

    const footer = (
        <div className="flex items-center justify-end gap-3">
            <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
                {t('adminMandapam.packages.cancel')}
            </button>
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-rosewood rounded-xl hover:bg-rosewood-dark transition-all disabled:opacity-50 flex items-center gap-2"
            >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {t('adminMandapam.packages.save')}
            </button>
        </div>
    );

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            title={t('adminMandapam.packages.editPackage')}
            size="2xl"
            footer={footer}
        >
            <div className="mb-8">
                <h4 className="text-sm font-bold text-rosewood mb-4 uppercase tracking-wider">
                    {t('adminMandapam.packages.packageName')}
                </h4>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">{t('adminMandapam.packages.englishLabel')}</label>
                        <input
                            type="text"
                            value={enName}
                            onChange={(e) => setEnName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rosewood/20 focus:border-rosewood transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">{t('adminMandapam.packages.tamilLabel')}</label>
                        <input
                            type="text"
                            value={taName}
                            onChange={(e) => setTaName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rosewood/20 focus:border-rosewood transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <h4 className="text-sm font-bold text-rosewood mb-4 uppercase tracking-wider">
                    {t('adminMandapam.packages.pricing')}
                </h4>
                {pkg.pricings.length > 0 && (
                    <div className="mb-4 p-4 bg-ivory rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">
                            {t('adminMandapam.packages.currentPricing')}
                        </p>
                        <p className="text-lg font-semibold text-gold">
                            {formatCurrency(pkg.pricings.find(p => p.isActive)?.amount ?? pkg.pricings[0]?.amount)}
                            <span className="text-xs text-slate-400 ml-1">
                                {pkg.pricings.find(p => p.isActive)?.pricingType === 'HOURLY' ? '/hr' : `/${pkg.bookingType === 'DAY_BASED' ? 'event' : 'day'}`}
                            </span>
                        </p>
                    </div>
                )}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                        {t('adminMandapam.packages.newPrice')} (INR)
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rosewood/20 focus:border-rosewood transition-all"
                    />
                </div>
            </div>

            <div className="mb-4">
                <h4 className="text-sm font-bold text-rosewood mb-4 uppercase tracking-wider">
                    {t('adminMandapam.packages.functions')}
                </h4>

                {activeFunctions.length === 0 && newFunctions.length === 0 && (
                    <p className="text-sm text-slate-400 mb-4">
                        {t('adminMandapam.packages.noFunctions')}
                    </p>
                )}

                <div className="space-y-2 mb-4">
                    {activeFunctions.map((fn) => {
                        const fnName = fn.translations.find(tr => tr.language === 'EN')?.name ?? '';
                        return (
                            <div key={fn.id} className="flex items-center justify-between px-4 py-3 bg-white border border-slate-100 rounded-xl">
                                <span className="text-sm text-slate-700 font-medium">{fnName}</span>
                                <button
                                    onClick={() => handleRemoveFunction(fn.id)}
                                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        );
                    })}
                    {newFunctions.map((fn, index) => (
                        <div key={`new-${index}`} className="flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                            <span className="text-sm text-emerald-700 font-medium">{fn.enName}</span>
                            <button
                                onClick={() => handleRemoveNewFunction(index)}
                                className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                {removedFunctionIds.size > 0 && (
                    <div className="space-y-2 mb-4">
                        {pkg.functions.filter(fn => removedFunctionIds.has(fn.id)).map((fn) => {
                            const fnName = fn.translations.find(tr => tr.language === 'EN')?.name ?? '';
                            return (
                                <div key={fn.id} className="flex items-center justify-between px-4 py-3 bg-red-50 border border-red-100 rounded-xl opacity-60">
                                    <span className="text-sm text-red-500 font-medium line-through">{fnName}</span>
                                    <button
                                        onClick={() => handleUndoRemoveFunction(fn.id)}
                                        className="p-1.5 text-slate-400 hover:bg-white rounded-lg transition-all text-xs font-semibold"
                                    >
                                        {t('adminMandapam.packages.undo')}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="p-4 bg-ivory rounded-xl border border-slate-100 space-y-3">
                    <p className="text-xs font-semibold text-slate-500">
                        {t('adminMandapam.packages.addNewFunction')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                            type="text"
                            placeholder={t('adminMandapam.packages.enterFunctionEn')}
                            value={newFnEn}
                            onChange={(e) => setNewFnEn(e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rosewood/20 focus:border-rosewood transition-all"
                        />
                        <input
                            type="text"
                            placeholder={t('adminMandapam.packages.enterFunctionTa')}
                            value={newFnTa}
                            onChange={(e) => setNewFnTa(e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rosewood/20 focus:border-rosewood transition-all"
                        />
                    </div>
                    <button
                        onClick={handleAddFunction}
                        disabled={!newFnEn.trim() || !newFnTa.trim()}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rosewood bg-white border border-rosewood/20 rounded-xl hover:bg-rosewood hover:text-white transition-all disabled:opacity-40"
                    >
                        <Plus size={14} />
                        {t('adminMandapam.packages.add')}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
};
