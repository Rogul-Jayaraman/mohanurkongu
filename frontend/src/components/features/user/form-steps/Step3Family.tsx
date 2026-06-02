import React from 'react';
import { useTranslation } from 'react-i18next';
import { useKeyboardFormNavigation } from '../../../../hooks/useKeyboardFormNavigation';
import TranslatableInput from '../../../ui/forms/TranslatableInput';
import { Input } from '../../../ui/forms/Input';
import { formatCurrency } from '../../../../utils/format';
import type { StepProps } from './types';

const Step3Family: React.FC<StepProps> = ({ formData, updateField, onAction, fieldErrors = {}, touchedFields = new Set(), markTouched = () => {} }) => {
    const { t } = useTranslation(['profile_new', 'common']);
    const containerRef = React.useRef<HTMLDivElement>(null);
    useKeyboardFormNavigation({ containerRef, onSubmitLastField: onAction });

    return (
        <div ref={containerRef} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">person</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.father')}</h3></div>
                    <label className="flex items-center gap-2 cursor-pointer group px-3 py-1.5 bg-ivory border border-gold-soft/30 rounded-xl transition-all hover:border-rosewood/30 shadow-sm"><input type="checkbox" checked={formData.fatherIsLate || false} onChange={(e) => updateField('fatherIsLate', e.target.checked)} className="peer hidden" /><div className={`size-4 rounded-md flex items-center justify-center transition-all ${formData.fatherIsLate ? 'bg-rosewood text-white shadow-sm' : 'bg-white border border-gold-soft/30'}`}>{formData.fatherIsLate && <span className="material-symbols-outlined text-xs!">check</span>}</div><span className="text-[10px] font-black tracking-wider text-rosewood-dark">{t('profile_new:is_late')}?</span></label>
                </div>
                <div className="p-6 space-y-6">
                    <TranslatableInput label={t('profile_new:father_name')} valueEn={formData.fatherNameEn || ''} valueTa={formData.fatherNameTa || ''} onChangeEn={(val) => updateField('fatherNameEn', val)} onChangeTa={(val) => updateField('fatherNameTa', val)} icon="person" placeholder={t('profile_new:placeholders.father_name')} error={touchedFields.has('fatherNameEn') ? fieldErrors.fatherNameEn : undefined} onBlur={() => markTouched?.('fatherNameEn')} required />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Input label={t('profile_new:father_job')} icon="work" name="fatherJob" value={formData.fatherJob || ''} onChange={(e) => updateField('fatherJob', e.target.value)} placeholder={t('profile_new:placeholders.father_job')} />
                        <Input label={t('profile_new:father_salary')} icon="payments" name="fatherSalary" type="text" value={formData.fatherSalary ? formData.fatherSalary.toLocaleString('en-IN') : ''} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); const numVal = val !== '' ? parseInt(val) : undefined; if (numVal !== undefined && numVal < 0) return; updateField('fatherSalary', numVal); }} placeholder={t('profile_new:placeholders.salary')} inputMode="numeric" />
                    </div>
                    {formData.fatherSalary > 0 && (<div className="px-4 py-3 bg-gold/5 border border-gold/10 rounded-xl animate-in fade-in slide-in-from-left-2 duration-500"><span className="text-[10px] font-black text-rosewood/40 tracking-wider block mb-0.5">{t('common:estimated_income')}</span><span className="text-sm font-black text-rosewood">{formatCurrency(formData.fatherSalary)} / {t('common:month')}</span></div>)}
                </div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">person_2</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.mother')}</h3></div>
                    <label className="flex items-center gap-2 cursor-pointer group px-3 py-1.5 bg-ivory border border-gold-soft/30 rounded-xl transition-all hover:border-rosewood/30 shadow-sm"><input type="checkbox" checked={formData.motherIsLate || false} onChange={(e) => updateField('motherIsLate', e.target.checked)} className="peer hidden" /><div className={`size-4 rounded-md flex items-center justify-center transition-all ${formData.motherIsLate ? 'bg-rosewood text-white shadow-sm' : 'bg-white border border-gold-soft/30'}`}>{formData.motherIsLate && <span className="material-symbols-outlined text-xs!">check</span>}</div><span className="text-[10px] font-black tracking-wider text-rosewood-dark">{t('profile_new:is_late')}?</span></label>
                </div>
                <div className="p-6 space-y-6">
                    <TranslatableInput label={t('profile_new:mother_name')} valueEn={formData.motherNameEn || ''} valueTa={formData.motherNameTa || ''} onChangeEn={(val) => updateField('motherNameEn', val)} onChangeTa={(val) => updateField('motherNameTa', val)} icon="person_2" placeholder={t('profile_new:placeholders.mother_name')} error={touchedFields.has('motherNameEn') ? fieldErrors.motherNameEn : undefined} onBlur={() => markTouched?.('motherNameEn')} required />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Input label={t('profile_new:mother_job')} icon="work" name="motherJob" value={formData.motherJob || ''} onChange={(e) => updateField('motherJob', e.target.value)} placeholder={t('profile_new:placeholders.mother_job')} />
                        <Input label={t('profile_new:mother_salary')} icon="payments" name="motherSalary" type="text" value={formData.motherSalary ? formData.motherSalary.toLocaleString('en-IN') : ''} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); const numVal = val !== '' ? parseInt(val) : undefined; if (numVal !== undefined && numVal < 0) return; updateField('motherSalary', numVal); }} placeholder={t('profile_new:placeholders.salary')} inputMode="numeric" />
                    </div>
                    {formData.motherSalary > 0 && (<div className="px-4 py-3 bg-gold/5 border border-gold/10 rounded-xl animate-in fade-in slide-in-from-left-2 duration-500"><span className="text-[10px] font-black text-rosewood/40 tracking-wider block mb-0.5">{t('common:estimated_income')}</span><span className="text-sm font-black text-rosewood">{formatCurrency(formData.motherSalary)} / {t('common:month')}</span></div>)}
                </div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">groups</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:siblings')}</h3></div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-[11px] sm:text-xs font-bold text-rosewood tracking-tight ml-1">{t('profile_new:no_of_brothers')}</label>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => updateField('noOfBrothers', Math.max(0, (formData.noOfBrothers || 0) - 1))} disabled={(formData.noOfBrothers || 0) <= 0} className="size-8 flex items-center justify-center rounded-lg border border-gold-soft/30 bg-white text-rosewood/60 shadow-sm hover:border-rosewood/40 hover:text-rosewood hover:bg-ivory transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"><span className="material-symbols-outlined text-sm">remove</span></button>
                            <div className="flex-1 text-center bg-white border border-gold-soft/30 rounded-lg py-1.5 shadow-sm"><span className="text-lg font-black text-rosewood">{formData.noOfBrothers ?? 0}</span></div>
                            <button type="button" onClick={() => updateField('noOfBrothers', Math.min(5, (formData.noOfBrothers || 0) + 1))} disabled={(formData.noOfBrothers || 0) >= 5} className="size-8 flex items-center justify-center rounded-lg bg-rosewood text-white shadow-sm hover:brightness-110 transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"><span className="material-symbols-outlined text-sm">add</span></button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[11px] sm:text-xs font-bold text-rosewood tracking-tight ml-1">{t('profile_new:no_of_sisters')}</label>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => updateField('noOfSisters', Math.max(0, (formData.noOfSisters || 0) - 1))} disabled={(formData.noOfSisters || 0) <= 0} className="size-8 flex items-center justify-center rounded-lg border border-gold-soft/30 bg-white text-rosewood/60 shadow-sm hover:border-rosewood/40 hover:text-rosewood hover:bg-ivory transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"><span className="material-symbols-outlined text-sm">remove</span></button>
                            <div className="flex-1 text-center bg-white border border-gold-soft/30 rounded-lg py-1.5 shadow-sm"><span className="text-lg font-black text-rosewood">{formData.noOfSisters ?? 0}</span></div>
                            <button type="button" onClick={() => updateField('noOfSisters', Math.min(5, (formData.noOfSisters || 0) + 1))} disabled={(formData.noOfSisters || 0) >= 5} className="size-8 flex items-center justify-center rounded-lg bg-rosewood text-white shadow-sm hover:brightness-110 transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"><span className="material-symbols-outlined text-sm">add</span></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Step3Family;
