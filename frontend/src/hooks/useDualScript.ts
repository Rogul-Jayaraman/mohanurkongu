import { useState, useCallback, useEffect, useRef } from 'react';
import { useTransliterate } from './useTransliterate';

export interface TamilInputState {
    text: string;
    cursorPosition: number;
}

interface UseDualScriptOptions {
    text?: string;
    targetLanguage?: 'ta' | 'en';
    mode?: 'title' | 'uppercase' | 'none';
}

export interface UseDualScriptReturn {
    preview: string;
    isPending: boolean;
    isKeyboardOpen: boolean;
    openKeyboard: () => void;
    closeKeyboard: () => void;
    toggleKeyboard: () => void;
    insertKey: (state: TamilInputState, key: string) => TamilInputState;
    handleBackspace: (state: TamilInputState) => TamilInputState;
    handleSpace: (state: TamilInputState) => TamilInputState;
    handleEnter: (state: TamilInputState) => TamilInputState;
    setPreview: (value: string) => void;
}

export function useDualScript(options: UseDualScriptOptions = {}): UseDualScriptReturn {
    const { text = '', targetLanguage = 'ta', mode = 'title' } = options;
    const { preview, isPending, setPreview } = useTransliterate(text, { targetLanguage, mode });
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    const insertKey = useCallback((state: TamilInputState, key: string): TamilInputState => {
        const { text: t, cursorPosition } = state;
        const prefix = t.slice(0, cursorPosition);
        const suffix = t.slice(cursorPosition);
        return {
            text: prefix + key + suffix,
            cursorPosition: cursorPosition + key.length,
        };
    }, []);

    const handleBackspace = useCallback((state: TamilInputState): TamilInputState => {
        const { text: t, cursorPosition } = state;
        if (cursorPosition === 0) return state;
        const prefix = t.slice(0, cursorPosition - 1);
        const suffix = t.slice(cursorPosition);
        return {
            text: prefix + suffix,
            cursorPosition: cursorPosition - 1,
        };
    }, []);

    const handleSpace = useCallback((state: TamilInputState): TamilInputState => {
        return insertKey(state, ' ');
    }, [insertKey]);

    const handleEnter = useCallback((state: TamilInputState): TamilInputState => {
        return insertKey(state, '\n');
    }, [insertKey]);

    const openKeyboard = useCallback(() => setIsKeyboardOpen(true), []);
    const closeKeyboard = useCallback(() => setIsKeyboardOpen(false), []);
    const toggleKeyboard = useCallback(() => setIsKeyboardOpen(prev => !prev), []);

    return {
        preview,
        isPending,
        isKeyboardOpen,
        openKeyboard,
        closeKeyboard,
        toggleKeyboard,
        insertKey,
        handleBackspace,
        handleSpace,
        handleEnter,
        setPreview,
    };
}
