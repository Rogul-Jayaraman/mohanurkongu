import React from 'react';
import { useTranslation } from 'react-i18next';
import { useKeyboardFormNavigation } from '../../../../hooks/useKeyboardFormNavigation';
import { PROFILE_FOR_OPTIONS, GENDER_OPTIONS, MARITAL_STATUS_OPTIONS, DIET_OPTIONS, COMPLEXION_OPTIONS, BLOOD_GROUP_OPTIONS, HEIGHT_OPTIONS } from '../../../../constants';
import { DISTRICTS, TALUKS_BY_DISTRICT, DISTRICT_TAMIL, TALUK_TAMIL } from '../../../../constants/locations';
import TranslatableInput from '../../../ui/forms/TranslatableInput';
import { Input } from '../../../ui/forms/Input';
import Select from '../../../ui/forms/Select';
import Toggle from '../../../ui/forms/FormToggle';
import DobInput from '../../../ui/forms/DobInput';
import { getMaxDobDate, getMinDobDate } from '../../../../validation/profile-schema';
import type { StepProps } from './types';

const Step1Personal: React.FC<StepProps> = ({ formData, updateField, onAction, fieldErrors = {}, touchedFields = new Set(), markTouched = () => {} }) => {
    const { t, i18n } = useTranslation(['profile_new', 'common']);
    const maxDobDate = getMaxDobDate();
    const minDobDate = getMinDobDate();
    const containerRef = React.useRef<HTMLDivElement>(null);
    useKeyboardFormNavigation({ containerRef, onSubmitLastField: onAction });

    const districtToStringOptions = (arr: string[]) => arr.map(s => { const formattedEn = s.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); return { value: s, label: { en: formattedEn, ta: DISTRICT_TAMIL[s] || formattedEn } }; });
    const talukToStringOptions = (arr: string[]) => arr.map(s => { const formattedEn = s.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); return { value: s, label: { en: formattedEn, ta: TALUK_TAMIL[s] || formattedEn } }; });

    return (
        <div ref={containerRef} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">groups</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.connection')}</h3></div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <TranslatableInput label={t('profile_new:first_name')} valueEn={formData.firstNameEn || ''} valueTa={formData.firstNameTa || ''} onChangeEn={(val) => updateField('firstNameEn', val)} onChangeTa={(val) => updateField('firstNameTa', val)} icon="person" placeholder={t('profile_new:placeholders.first_name')} error={touchedFields.has('firstNameEn') ? fieldErrors.firstNameEn : undefined} onBlur={() => markTouched?.('firstNameEn')} required />
                        <TranslatableInput label={t('profile_new:last_name')} valueEn={formData.lastNameEn || ''} valueTa={formData.lastNameTa || ''} onChangeEn={(val) => updateField('lastNameEn', val)} onChangeTa={(val) => updateField('lastNameTa', val)} icon="person" placeholder={t('profile_new:placeholders.last_name')} />
                    </div>
                    <Toggle label={t('profile_new:gender')} value={formData.gender || ''} onChange={(val) => updateField('gender', val)} options={GENDER_OPTIONS} name="gender" error={touchedFields.has('gender') ? fieldErrors.gender : undefined} required />
                    <DobInput label={t('profile_new:dob')} value={formData.dob?.split('T')[0] || ''} onChange={(val) => updateField('dob', val)} min={minDobDate} max={maxDobDate} error={touchedFields.has('dob') ? fieldErrors.dob : undefined} onBlur={() => markTouched?.('dob')} required />
                    <Select label={t('profile_new:profile_for')} value={formData.profileFor || ''} onChange={(val) => updateField('profileFor', val)} options={PROFILE_FOR_OPTIONS} error={touchedFields.has('profileFor') ? fieldErrors.profileFor : undefined} onBlur={() => markTouched?.('profileFor')} required />
                </div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">accessibility_new</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.body_lifestyle')}</h3></div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"><Select label={t('profile_new:marital_status')} value={formData.maritalStatus || ''} onChange={(val) => updateField('maritalStatus', val)} options={MARITAL_STATUS_OPTIONS} error={touchedFields.has('maritalStatus') ? fieldErrors.maritalStatus : undefined} onBlur={() => markTouched?.('maritalStatus')} required /><Toggle label={t('profile_new:diet')} value={formData.diet || ''} onChange={(val) => updateField('diet', val)} options={DIET_OPTIONS} name="diet" error={touchedFields.has('diet') ? fieldErrors.diet : undefined} required /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 border-t border-gold-soft/5">
                        <Select label={t('profile_new:blood_group')} value={formData.bloodGroup || ''} onChange={(val) => updateField('bloodGroup', val)} options={BLOOD_GROUP_OPTIONS} error={touchedFields.has('bloodGroup') ? fieldErrors.bloodGroup : undefined} onBlur={() => markTouched?.('bloodGroup')} required />
                        <Select label={t('profile_new:height')} value={formData.height?.toString() || ''} onChange={(val) => updateField('height', parseInt(val))} options={HEIGHT_OPTIONS} error={touchedFields.has('height') ? fieldErrors.height : undefined} required />
                        <Input label={t('profile_new:weight')} name="weight" value={formData.weight?.toString() || ''} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); if (val === '') { updateField('weight', undefined); return; } const numVal = parseInt(val); if (isNaN(numVal)) return; updateField('weight', numVal); }} icon="monitor_weight" placeholder={t('profile_new:placeholders.weight')} inputMode="numeric" error={touchedFields.has('weight') ? fieldErrors.weight : undefined} onBlur={() => markTouched?.('weight')} required><span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-[10px] text-slate-300 group-hover/input:text-rosewood transition-colors">KG</span></Input>
                        <Select label={t('profile_new:complexion')} value={formData.complexion || 'NOT_SPECIFIED'} onChange={(val) => updateField('complexion', val)} options={COMPLEXION_OPTIONS} />
                    </div>
                </div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">location_on</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.locations')}</h3></div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Select label={t('profile_new:current_district')} value={formData.currentDistrict || ''} onChange={(val) => { updateField('currentDistrict', val); if (val !== 'OTHER') { updateField('currentDistrictEn', val); updateField('currentDistrictTa', DISTRICT_TAMIL[val] || val); updateField('currentStateEn', 'Tamil Nadu'); updateField('currentStateTa', 'தமிழ்நாடு'); updateField('currentCountryEn', 'India'); updateField('currentCountryTa', 'இந்தியா'); } else { updateField('currentDistrictEn', ''); updateField('currentDistrictTa', ''); updateField('currentTaluk', ''); updateField('currentCityEn', ''); updateField('currentCityTa', ''); } }} options={districtToStringOptions(DISTRICTS)} error={touchedFields.has('currentDistrict') ? fieldErrors.currentDistrict : undefined} onBlur={() => markTouched?.('currentDistrict')} required />
                        {formData.currentDistrict !== 'OTHER' && <Select label={t('profile_new:current_taluk')} disabled={!formData.currentDistrict} value={formData.currentTaluk || ''} onChange={(val) => { updateField('currentTaluk', val); updateField('currentCityEn', val); updateField('currentCityTa', TALUK_TAMIL[val] || val); }} options={talukToStringOptions(formData.currentDistrict ? TALUKS_BY_DISTRICT[formData.currentDistrict] : [])} placeholder={formData.currentDistrict ? t('profile_new:placeholders.select_taluk') : t('profile_new:placeholders.select_district_first')} required />}
                    </div>
                    {formData.currentDistrict === 'OTHER' && (<div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                        <TranslatableInput label={t('profile_new:current_city')} valueEn={formData.currentCityEn || ''} valueTa={formData.currentCityTa || ''} onChangeEn={(val) => updateField('currentCityEn', val)} onChangeTa={(val) => updateField('currentCityTa', val)} placeholder={t('profile_new:placeholders.city')} required />
                        <TranslatableInput label={t('profile_new:current_state')} valueEn={formData.currentStateEn || ''} valueTa={formData.currentStateTa || ''} onChangeEn={(val) => updateField('currentStateEn', val)} onChangeTa={(val) => updateField('currentStateTa', val)} placeholder={t('profile_new:placeholders.state')} required />
                        <TranslatableInput label={t('profile_new:current_country')} valueEn={formData.currentCountryEn || ''} valueTa={formData.currentCountryTa || ''} onChangeEn={(val) => updateField('currentCountryEn', val)} onChangeTa={(val) => updateField('currentCountryTa', val)} placeholder={t('profile_new:placeholders.country')} required />
                    </div>)}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gold-soft/5">
                        <Select label={t('profile_new:native_district')} value={formData.nativeDistrict || ''} onChange={(val) => { updateField('nativeDistrict', val); if (val !== 'OTHER') { updateField('nativeTaluk', ''); } else { updateField('nativeTaluk', ''); updateField('nativeCityEn', ''); updateField('nativeCityTa', ''); updateField('nativeStateEn', ''); updateField('nativeStateTa', ''); updateField('nativeCountryEn', ''); updateField('nativeCountryTa', ''); } }} options={districtToStringOptions(DISTRICTS)} error={touchedFields.has('nativeDistrict') ? fieldErrors.nativeDistrict : undefined} onBlur={() => markTouched?.('nativeDistrict')} required />
                        {formData.nativeDistrict !== 'OTHER' && <Select label={t('profile_new:native_taluk')} disabled={!formData.nativeDistrict} value={formData.nativeTaluk || ''} onChange={(val) => updateField('nativeTaluk', val)} options={talukToStringOptions(formData.nativeDistrict ? TALUKS_BY_DISTRICT[formData.nativeDistrict] : [])} placeholder={formData.nativeDistrict ? t('profile_new:placeholders.select_taluk') : t('profile_new:placeholders.select_district_first')} error={touchedFields.has('nativeTaluk') ? fieldErrors.nativeTaluk : undefined} onBlur={() => markTouched?.('nativeTaluk')} required />}
                    </div>
                    {formData.nativeDistrict === 'OTHER' && (<div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                        <TranslatableInput label={t('profile_new:native_city')} valueEn={formData.nativeCityEn || ''} valueTa={formData.nativeCityTa || ''} onChangeEn={(val) => updateField('nativeCityEn', val)} onChangeTa={(val) => updateField('nativeCityTa', val)} placeholder={t('profile_new:placeholders.city')} required />
                        <TranslatableInput label={t('profile_new:native_state')} valueEn={formData.nativeStateEn || ''} valueTa={formData.nativeStateTa || ''} onChangeEn={(val) => updateField('nativeStateEn', val)} onChangeTa={(val) => updateField('nativeStateTa', val)} placeholder={t('profile_new:placeholders.state')} required />
                        <TranslatableInput label={t('profile_new:native_country')} valueEn={formData.nativeCountryEn || ''} valueTa={formData.nativeCountryTa || ''} onChangeEn={(val) => updateField('nativeCountryEn', val)} onChangeTa={(val) => updateField('nativeCountryTa', val)} placeholder={t('profile_new:placeholders.country')} required />
                    </div>)}
                </div>
            </div>
        </div>
    );
};

export default Step1Personal;
