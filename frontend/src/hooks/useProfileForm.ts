import { useState, useCallback } from 'react';
import { Profile } from '../types/profile';
import { useInputFormatting, type InputFormattingMode } from './useInputFormatting';

const DEFAULT_FORM_DATA = {
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

    const updateField = (field: keyof Profile, value: any) => {
        let formattedValue = value;

        if (typeof value === 'string' && value.length > 0) {
            const excluded = ['dob', 'birthTime', 'mobile', 'status', 'adminVerified'];
            const titleCaseFields = [
                'nameEn', 'fatherNameEn', 'motherNameEn', 'companyName', 
                'birthPlace', 'jobLocationEn', 'kuladeivamEn', 'jobDetail',
                'fatherJob', 'motherJob', 'community', 'education',
                'currentDistrictEn', 'currentCityEn', 'currentStateEn', 'currentCountryEn'
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

    const restoreDraft = useCallback((draftData: any) => {
        if (!draftData) return;
        const restored = {
            ...DEFAULT_FORM_DATA,
            ...draftData.basic,
            ...draftData.personal,
            ...draftData.community,
            ...draftData.professional,
            ...draftData.family,
            ...draftData.assets,
            gallery: draftData.gallery ?? [],
            profilePhoto: draftData.profilePhoto ?? null,
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
        isDirty,
        setIsDirty
    };
};
