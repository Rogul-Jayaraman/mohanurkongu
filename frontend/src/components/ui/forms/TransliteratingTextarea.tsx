import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { getLocalTransliteration } from '@/utils/transliterationService';
import { useInputFormatting } from '@/hooks/useInputFormatting';

export interface TransliteratingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** If 'en', works like normal textarea. If 'ta', transliterates English to Tamil live. */
    targetLanguage?: 'ta' | 'en'; 
    onValueChange?: (value: string) => void;
    autoFormat?: boolean;
}

/**
 * Enhanced Textarea that transliterates English to Tamil in real-time.
 */
export const TransliteratingTextarea = forwardRef<HTMLTextAreaElement, TransliteratingTextareaProps>(
    ({ targetLanguage = 'en', onChange, onValueChange, value, autoFormat = false, ...props }, ref) => {
        const [localValue, setLocalValue] = useState<string>(value as string || '');
        const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
        const { formatValue } = useInputFormatting();
        
        useEffect(() => {
            if (value !== undefined && value !== localValue) {
                setLocalValue(value as string);
            }
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            let rawVal = e.target.value;
            
            // Use standardized formatting
            rawVal = formatValue(rawVal, { mode: 'sentence', autoFormat });
            
            setLocalValue(rawVal);
            
            if (onChange) {
                const syntheticEvent = {
                    ...e,
                    target: { ...e.target, value: rawVal, name: props.name }
                } as React.ChangeEvent<HTMLTextAreaElement>;
                onChange(syntheticEvent);
            }
            if (onValueChange) onValueChange(rawVal);

            if (targetLanguage === 'en' || !/[a-zA-Z]/.test(rawVal)) {
                if (debounceRef.current) clearTimeout(debounceRef.current);
                return;
            }

            if (debounceRef.current) clearTimeout(debounceRef.current);

            debounceRef.current = setTimeout(() => {
                const transliterated = getLocalTransliteration(rawVal);
                if (transliterated && transliterated !== rawVal) {
                    setLocalValue(transliterated);
                    
                    if (onChange) {
                        const syntheticEvent = {
                            ...e,
                            target: { ...e.target, name: props.name, value: transliterated }
                        } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
                        onChange(syntheticEvent);
                    }
                    if (onValueChange) onValueChange(transliterated);
                }
            }, 200); 
        };

        return (
            <textarea
                {...props}
                ref={ref}
                value={localValue}
                onChange={handleChange}
            />
        );
    }
);

TransliteratingTextarea.displayName = 'TransliteratingTextarea';
