import { useState, useCallback, useEffect, useRef } from 'react';
import { Profile } from '../types/profile';
import { useInputFormatting, type InputFormattingMode } from './useInputFormatting';
import { useIndexedDB } from './useIndexedDB';
import { formToDraft, draftToForm } from '../adapters/profile.adapter';

export const DEFAULT_FORM_DATA = {
    profileFor: 'MYSELF',
    gender: 'MALE',
    maritalStatus: 'NEVER_MARRIED',
    diet: 'VEGETARIAN',
    caste: 'BC',
    community: 'Kongu Vellalar',
    noOfBrothers: 0,
    noOfSisters: 0,
    fatherIsLate: false,
    motherIsLate: false,
    status: 'ACTIVE' as any,
    astrology: { mode: 'none' }
};

export const useProfileForm = () => {
    const { formatValue } = useInputFormatting();
    const [isDirty, setIsDirty] = useState(false);
    const [formData, setFormData] = useState<Partial<Profile>>({ ...DEFAULT_FORM_DATA });
    const { data: draftData, isLoaded, hydrate, persist, update } = useIndexedDB();
    const formDataRef = useRef(formData);
    formDataRef.current = formData;

    useEffect(() => {
        if (isLoaded && draftData) {
            const restored = draftToForm(draftData);
            setFormData(prev => ({ ...DEFAULT_FORM_DATA, ...restored }));
            setIsDirty(false);
        }
    }, [isLoaded, draftData]);

    const updateField = (field: keyof Profile, value: any) => {
        let formattedValue = value;

        if (typeof value === 'string' && value.length > 0) {
            const excluded = ['dob', 'birthTime', 'mobile', 'status', 'adminVerified'];
            const titleCaseFields = [
                'nameEn', 'fatherNameEn', 'motherNameEn', 'companyName', 
                'birthPlace', 'jobLocationEn', 'kuladeivamEn', 'jobDetail',
                'fatherJob', 'motherJob', 'community', 'education',
                'currentDistrictEn', 'currentCityEn', 'currentStateEn', 'currentCountryEn',
                'landEn', 'otherAssetsEn', 'expectationNoteEn', 'preferredLocationEn'
            ];
            
            let mode: InputFormattingMode = 'sentence';
            if (excluded.includes(field as string)) mode = 'none';
            if (field === 'email') mode = 'email';
            if (field === 'caste') mode = 'uppercase';
            if (titleCaseFields.includes(field as string)) mode = 'title';

            formattedValue = formatValue(value, { mode });
        }

        setFormData(prev => ({ ...prev, [field]: formattedValue }));
        setIsDirty(true);
    };

    const persistDraft = useCallback(async () => {
        const current = formDataRef.current;
        if (!current) return;
        const draft = formToDraft(current as any);
        update(draft);
        await persist();
    }, [persist, update]);

    const restoreDraft = useCallback((draftData: any) => {
        if (!draftData) return;
        const toLocalDateStr = (d: Date) => { const offset = d.getTimezoneOffset(); const local = new Date(d.getTime() - offset * 60000); return local.toISOString().split('T')[0]; };
        const maxDobDate = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 21); return toLocalDateStr(d); })();
        const minDobDate = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 40); return toLocalDateStr(d); })();
        const rawDob = draftData.basic?.dob || draftData.personal?.dob;
        const validDob = rawDob && rawDob >= minDobDate && rawDob <= maxDobDate ? rawDob : undefined;
        const restored = {
            ...DEFAULT_FORM_DATA,
            ...draftData.basic,
            ...draftData.personal,
            ...draftData.community,
            ...draftData.professional,
            ...draftData.family,
            ...draftData.assets,
            dob: validDob,
            astrology: draftData.basic?.astrology || { mode: 'none' },
        };
        setFormData(restored);
        setIsDirty(false);
    }, []);

    const reset = useCallback(() => {
        setFormData({ ...DEFAULT_FORM_DATA });
        setIsDirty(false);
    }, []);

    return {
        formData,
        updateField,
        setFormData,
        reset,
        restoreDraft,
        persistDraft,
        isDirty,
        setIsDirty,
        formDataRef,
    };
};
