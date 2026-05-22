import React, { useState, useEffect, useRef } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility for cleaner tailwind classes (shadcn style) */
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface RangeSliderProps {
    min: number;
    max: number;
    step?: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    label: string;
    unit?: string;
}

/**
 * Premium Heritage-Styled Slider using Radix UI (shadcn style)
 * 
 * Features:
 * - Native Radix Primitives for accessibility and focus management.
 * - Buttery smooth dragging without interruption.
 * - Heritage design tokens (Rosewood, Gold, Ivory).
 * - Debounced reporting to parent.
 */
const RangeSlider: React.FC<RangeSliderProps> = ({
    min,
    max,
    step = 1,
    value,
    onChange,
    label,
    unit = ''
}) => {
    // Local state for immediate UI feedback (60fps)
    const [localValue, setLocalValue] = useState<[number, number]>(value);
    // Sync from parent when filters are reset or updated externally
    useEffect(() => {
        if (value[0] !== localValue[0] || value[1] !== localValue[1]) {
            setLocalValue(value);
        }
    }, [value[0], value[1]]); // Deep compare primitive values to avoid infinite loops

    const handleValueChange = (newValues: number[]) => {
        setLocalValue(newValues as [number, number]);
    };

    const handleValueCommit = (newValues: number[]) => {
        onChange(newValues as [number, number]);
    };

    return (
        <div className="space-y-3 group text-left w-full py-2">
            {/* Header with Visual Badges */}
            <div className="flex items-center justify-between gap-2 px-1">
                <label className="block text-[11px] sm:text-xs font-bold text-rosewood tracking-tight ml-1">
                    {label}
                </label>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-ivory border border-gold/20 rounded-xl shadow-sm opacity-80 group-hover:opacity-100 transition-opacity">
                    <span className="text-[11px] font-black text-rosewood">{localValue[0]}{unit}</span>
                    <div className="w-1.5 h-px bg-rosewood/20" />
                    <span className="text-[11px] font-black text-rosewood">{localValue[1]}{unit}</span>
                </div>
            </div>

            {/* Radix Slider Implementation */}
            <div className="relative h-12 w-full bg-white/50 border border-slate-200 rounded-xl px-5 flex items-center group-focus-within:border-gold/50 group-focus-within:ring-4 group-focus-within:ring-gold/5 transition-all shadow-sm overflow-visible">
                
                {/* Contextual Icon Badge */}
                <div className="shrink-0 w-8 flex items-center text-gold/40 group-focus-within:text-gold transition-all">
                    <span className="material-symbols-outlined text-[22px]">
                        {label.toLowerCase().includes('age') || label.toLowerCase().includes('வயது') ? 'cake' : 
                         (label.toLowerCase().includes('height') || label.toLowerCase().includes('உயரம்')) ? 'straighten' : 
                         (label.toLowerCase().includes('weight') || label.toLowerCase().includes('எடை')) ? 'weight' : 'analytics'}
                    </span>
                </div>

                <SliderPrimitive.Root
                    className="relative flex items-center select-none touch-none w-full h-8 ml-2"
                    value={localValue}
                    min={min}
                    max={max}
                    step={step}
                    minStepsBetweenThumbs={1}
                    onValueChange={handleValueChange}
                    onValueCommit={handleValueCommit}
                >
                    {/* The Track Background */}
                    <SliderPrimitive.Track className="bg-rosewood/10 relative grow rounded-full h-[6px]">
                        {/* The Active Fill */}
                        <SliderPrimitive.Range className="absolute bg-rosewood rounded-full h-full shadow-[0_0_12px_rgba(107,0,40,0.1)]" />
                    </SliderPrimitive.Track>

                    {/* Left Thumb */}
                    <SliderPrimitive.Thumb 
                        key="thumb-1"
                        className={cn(
                            "block size-5 min-w-5 rounded-full bg-white border-[2.5px] border-rosewood shadow-lg cursor-grab active:scale-125 active:cursor-grabbing transition-transform focus:outline-none focus:ring-4 focus:ring-rosewood/20 group/thumb relative",
                            "hover:shadow-[0_0_15px_rgba(107,0,40,0.2)]"
                        )}
                        aria-label="Minimum value"
                    >
                        {/* Floating Tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-rosewood text-white text-[10px] font-black rounded-lg opacity-0 group-hover/thumb:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                            {localValue[0]}{unit}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-rosewood" />
                        </div>
                    </SliderPrimitive.Thumb>

                    {/* Right Thumb */}
                    <SliderPrimitive.Thumb 
                        key="thumb-2"
                        className={cn(
                            "flex size-5 min-w-5 rounded-full bg-white border-[2.5px] border-rosewood shadow-lg cursor-grab active:scale-125 active:cursor-grabbing transition-transform focus:outline-none focus:ring-4 focus:ring-rosewood/20 group/thumb relative text-center items-center justify-center",
                            "hover:shadow-[0_0_15px_rgba(107,0,40,0.2)]"
                        )}
                        aria-label="Maximum value"
                    >
                        {/* Floating Tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-rosewood text-white text-[10px] font-black rounded-lg opacity-0 group-hover/thumb:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                            {localValue[1]}{unit}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-rosewood" />
                        </div>
                    </SliderPrimitive.Thumb>
                </SliderPrimitive.Root>
            </div>
            
            {/* Range Legend */}
            <div className="flex justify-between px-2 opacity-40">
                <span className="text-[10px] font-bold text-slate-400 tracking-tighter uppercase font-mono">{min}{unit}</span>
                <span className="text-[10px] font-bold text-slate-400 tracking-tighter uppercase font-mono">{max}{unit}</span>
            </div>
        </div>
    );
};

export default RangeSlider;
