import React, { useState, useEffect, useRef } from "react";
import { OpenStreetMapAutocomplete } from "@amraneze/osm-autocomplete";
import { useLanguage } from '@/context/LanguageContext';

interface BirthPlaceAutocompleteProps {
    value: string;
    onChange: (data: { name: string; lat?: number; lon?: number }) => void;
    label: string;
    placeholder?: string;
    required?: boolean;
    className?: string;
    error?: string;
}

const BirthPlaceAutocomplete: React.FC<BirthPlaceAutocompleteProps> = ({
    value,
    onChange,
    label,
    placeholder: _placeholder,
    required = false,
    className = "",
    error
}) => {
    const { t } = useLanguage();
    const placeholder = _placeholder || t('common:search');
    const [selectedLocation, setSelectedLocation] = useState<any>(
        value ? { display_name: value } : null
    );
    const wrapperRef = useRef<HTMLDivElement>(null);

    const handleOnOptionSelected = (item: any) => {
        if (!item) return;
        setSelectedLocation(item);
        onChange({
            name: item.display_name,
            lat: item.lat ? parseFloat(item.lat) : undefined,
            lon: item.lon ? parseFloat(item.lon) : undefined
        });
    };

    return (
        <div className={`w-full space-y-1 ${className}`} ref={wrapperRef}>
            {/* Label - Matching Input.tsx */}
            <div className="flex items-center justify-start gap-2 px-1">
                {label && (
                    <label className="block text-[11px] sm:text-xs font-bold text-rosewood tracking-tight">
                        {label}
                        {required && <span className="text-gold ml-1 text-xs">*</span>}
                    </label>
                )}
            </div>

            <div 
                className="relative osm-premium-wrapper"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        // Prevent the default behavior which might be form submission
                        // but don't stop propagation yet so the library can still handle it for selection
                        // Actually, most libraries call e.preventDefault() themselves when they handle Enter.
                        // If they DON'T, it bubbles up.
                        // Since we see it "resetting" to step 1, it's a reload.
                        e.preventDefault();
                    }
                }}
            >
                <OpenStreetMapAutocomplete 
                    value={selectedLocation} 
                    onChange={handleOnOptionSelected}
                    placeholder={placeholder}
                    debounce={500}
                />
            </div>

            {error && (
                <p className="text-[10px] font-bold text-red-500 ml-2 animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}

            {/* Premium Styling Overrides for the Library */}
            <style dangerouslySetInnerHTML={{ __html: `
                .osm-premium-wrapper { width: 100%; position: relative; }
                .osm-premium-wrapper > div { width: 100% !important; background: transparent !important; }
                
                /* Target the internal input of @amraneze/osm-autocomplete */
                .osm-premium-wrapper input { 
                    width: 100% !important;
                    height: 3.5rem !important; /* h-14 */
                    padding-left: 1.25rem !important; /* Standardized for no-icon inputs */
                    padding-right: 1.25rem !important;
                    border-radius: 0.75rem !important; /* rounded-xl */
                    border: 2px solid var(--color-input-border) !important;
                    background-color: var(--color-input-bg) !important;
                    font-family: inherit !important;
                    font-size: 0.875rem !important; /* text-sm */
                    font-weight: 500 !important;
                    color: var(--color-input-text) !important;
                    outline: none !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    box-shadow: 0 1px 2px 0 var(--color-input-shadow) !important;
                }
                
                .osm-premium-wrapper input::placeholder {
                    color: var(--color-input-placeholder) !important;
                    opacity: 1 !important;
                }

                .osm-premium-wrapper input:hover {
                    border-color: var(--color-input-border-hover) !important;
                }

                .osm-premium-wrapper input:focus {
                    border-color: var(--color-input-focus) !important;
                    box-shadow: 0 0 0 4px var(--color-input-ring) !important;
                }

                /* Target the suggestion list */
                .osm-premium-wrapper ul {
                    position: absolute !important;
                    top: calc(100% + 8px) !important;
                    left: 0 !important;
                    right: 0 !important;
                    background: white !important;
                    border: 1px solid #f1f5f9 !important;
                    border-radius: 0.75rem !important;
                    box-shadow: 0 25px 50px -12px rgba(139, 29, 61, 0.15) !important;
                    z-index: 100 !important; /* Higher Z to clear everything */
                    max-height: 250px !important;
                    overflow-y: auto !important;
                    padding: 8px !important;
                    margin: 0 !important;
                    list-style: none !important;
                    animation: osm-in 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    transform-origin: top;
                }

                @keyframes osm-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }

                .osm-premium-wrapper li {
                    padding: 0.875rem 1rem !important;
                    font-size: 0.8125rem !important;
                    color: #475569 !important;
                    font-weight: 500 !important;
                    cursor: pointer !important;
                    transition: all 0.2s !important;
                    border-radius: 0.5rem !important;
                    margin-bottom: 2px !important;
                    border-bottom: 1px solid #f8fafc !important;
                }

                .osm-premium-wrapper li:last-child {
                    border-bottom: none !important;
                }

                .osm-premium-wrapper li:hover {
                    background: #f8fafc !important;
                    color: var(--color-rosewood) !important;
                    padding-left: 1.25rem !important;
                }
            `}} />
        </div>
    );
};

export default BirthPlaceAutocomplete;
