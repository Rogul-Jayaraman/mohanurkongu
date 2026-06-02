import React from 'react';
import { useTranslation } from 'react-i18next';
import { useKeyboardFormNavigation } from '../../../../hooks/useKeyboardFormNavigation';
import { RESIDENCE_OPTIONS, HEIGHT_OPTIONS } from '../../../../constants';
import Toggle from '../../../ui/forms/FormToggle';
import { Input } from '../../../ui/forms/Input';
import Select from '../../../ui/forms/Select';
import { TextArea } from '../../../ui/forms/TextArea';
import RangeSlider from '../../../ui/forms/RangeSlider';
import TranslatableInput from '../../../ui/forms/TranslatableInput';
import { formatCurrency } from '../../../../utils/format';
import type { StepProps } from './types';

const Step4Assets: React.FC<StepProps> = ({ formData, updateField, onAction, fieldErrors = {}, touchedFields = new Set(), markTouched = () => {} }) => {
    const { t } = useTranslation(['profile_new', 'common']);
    const containerRef = React.useRef<HTMLDivElement>(null);
    useKeyboardFormNavigation({ containerRef, onSubmitLastField: onAction });

    return (
        <div ref={containerRef} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">real_estate_agent</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.property')}</h3></div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Toggle label={t('profile_new:residence')} value={formData.residence || ''} onChange={(val) => updateField('residence', val)} options={RESIDENCE_OPTIONS} name="residence" error={touchedFields.has('residence') ? fieldErrors.residence : undefined} onBlur={() => markTouched?.('residence')} required />
                        <Input label={t('profile_new:vehicle')} icon="directions_car" name="vehicle" value={formData.vehicle || ''} onChange={(e) => updateField('vehicle', e.target.value)} placeholder={t('profile_new:placeholders.vehicle')} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TextArea label={t('profile_new:land')} name="land" value={formData.land || ''} onChange={(e) => updateField('land', e.target.value)} placeholder={t('profile_new:placeholders.land')} icon="landscape" />
                        <TextArea label={t('profile_new:other_assets')} name="otherAssets" value={formData.otherAssets || ''} onChange={(e) => updateField('otherAssets', e.target.value)} placeholder={t('profile_new:placeholders.other_assets')} icon="inventory_2" />
                    </div>
                </div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">favorite</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.partner_preferences')}</h3></div>
                <div className="p-6 space-y-6">
                    <RangeSlider min={21} max={40} value={[formData.ageMin ?? 21, formData.ageMax ?? 40]} onChange={(val) => { updateField('ageMin', val[0]); updateField('ageMax', val[1]); }} label={t('profile_new:age_range')} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Select label={t('profile_new:height_min')} value={formData.heightMinId?.toString() || ''} onChange={(val) => updateField('heightMinId', val ? parseInt(val) : null)} options={HEIGHT_OPTIONS} />
                        <Select label={t('profile_new:height_max')} value={formData.heightMaxId?.toString() || ''} onChange={(val) => updateField('heightMaxId', val ? parseInt(val) : null)} options={HEIGHT_OPTIONS} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <Input label={t('profile_new:monthly_salary')} icon="payments" name="monthlySalary" type="text" value={formData.monthlySalary ? formData.monthlySalary.toLocaleString('en-IN') : ''} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); const numVal = val !== '' ? parseInt(val) : null; if (numVal !== null && numVal < 0) return; updateField('monthlySalary', numVal); }} placeholder={t('profile_new:placeholders.salary')} inputMode="numeric" />
                            {formData.monthlySalary && formData.monthlySalary > 0 && (<div className="mt-2 px-4 py-3 bg-gold/5 border border-gold/10 rounded-xl animate-in fade-in slide-in-from-top-2 duration-500"><span className="text-[10px] font-black text-rosewood/40 tracking-wider block mb-0.5">{t('common:estimated_income')}</span><span className="text-sm font-black text-rosewood">{formatCurrency(formData.monthlySalary)} / {t('common:month')}</span></div>)}
                        </div>
                        <TranslatableInput label={t('profile_new:preferred_location')} valueEn={formData.preferredLocationEn || ''} valueTa={formData.preferredLocationTa || ''} onChangeEn={(val) => updateField('preferredLocationEn', val)} onChangeTa={(val) => updateField('preferredLocationTa', val)} placeholder={t('profile_new:placeholders.preferred_location')} icon="location_on" />
                    </div>
                    <TextArea label={t('profile_new:expectation')} name="expectation" value={formData.expectation || ''} onChange={(e) => updateField('expectation', e.target.value)} placeholder={t('profile_new:placeholders.partner_expectations')} icon="favorite" />
                </div>
            </div>
        </div>
    );
};

export default Step4Assets;
