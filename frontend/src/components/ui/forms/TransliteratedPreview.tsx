import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDualScript } from '@/hooks/useDualScript';
import { useLanguage } from '@/context/LanguageContext';
import { TransliteratingInput } from './PhoneticInput';
import { TamilKeyboard } from './TamilKeyboard';

interface TransliteratedPreviewProps {
    text: string;
    value?: string;
    onPreviewChange?: (value: string, isManual: boolean) => void;
    isFocused?: boolean;
    mode?: 'title' | 'uppercase' | 'none';
}

export const TransliteratedPreview: React.FC<TransliteratedPreviewProps> = ({
    text,
    value,
    onPreviewChange,
    isFocused,
    mode = 'title',
}) => {
    const { t, language } = useLanguage();
    const targetLang = language === 'en' ? 'ta' : 'en';

    const {
        preview,
        isPending,
        isKeyboardOpen,
        openKeyboard,
        closeKeyboard,
        toggleKeyboard,
        insertKey,
        handleBackspace,
        setPreview,
    } = useDualScript({ text, targetLanguage: targetLang, mode });

    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const editInputRef = useRef<HTMLInputElement>(null);

    const handleKeyboardSelect = (char: string) => {
        const input = editInputRef.current;
        if (!input) return;
        const newState = insertKey({ text: editValue, cursorPosition: input.selectionStart || 0 }, char);
        setEditValue(newState.text);
        setTimeout(() => {
            input.focus();
            input.setSelectionRange(newState.cursorPosition, newState.cursorPosition);
        }, 0);
    };

    const handleKeyboardBackspace = () => {
        const input = editInputRef.current;
        if (!input) return;
        const newState = handleBackspace({ text: editValue, cursorPosition: input.selectionStart || 0 });
        setEditValue(newState.text);
        setTimeout(() => {
            input.focus();
            input.setSelectionRange(newState.cursorPosition, newState.cursorPosition);
        }, 0);
    };

    const onPreviewChangeRef = useRef(onPreviewChange);
    const isFocusedRef = useRef(isFocused);
    useEffect(() => { onPreviewChangeRef.current = onPreviewChange; });
    useEffect(() => { isFocusedRef.current = isFocused; });

    const lastValueSource = useRef<'manual' | 'auto'>('auto');

    useEffect(() => {
        if (value && value !== preview && !isFocused && lastValueSource.current === 'manual') {
            setPreview(value);
        }
    }, [value, preview, isFocused]);

    const hasInteracted = useRef(false);
    useEffect(() => {
        if (isFocused) hasInteracted.current = true;
    }, [isFocused]);

    useEffect(() => {
        if (preview && onPreviewChangeRef.current && (isFocusedRef.current || hasInteracted.current) && !isEditing) {
            if (preview !== value) {
                onPreviewChangeRef.current(preview, false);
                lastValueSource.current = 'auto';
            }
        }
    }, [preview, value, isFocused, isEditing]);

    const handleEditClick = () => {
        setEditValue(preview);
        setIsEditing(true);
    };

    const handleConfirm = () => {
        setPreview(editValue);
        if (onPreviewChange) onPreviewChange(editValue, true);
        lastValueSource.current = 'manual';
        setIsEditing(false);
    };

    const handleCancel = () => setIsEditing(false);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleConfirm();
        if (e.key === 'Escape') handleCancel();
    };

    const handleBlur = (e: React.FocusEvent) => {
        const relatedTarget = e.relatedTarget as Node | null;
        if (relatedTarget && e.currentTarget.parentElement?.contains(relatedTarget)) return;
        handleConfirm();
    };

    const previewLabel = language === 'en'
        ? t('transliterate.tamilLabel', { defaultValue: 'Tamil:' })
        : t('transliterate.englishLabel', { defaultValue: 'English:' });

    const editBtn = t('transliterate.edit', { defaultValue: 'Edit' });
    const confirmBtn = t('transliterate.confirm', { defaultValue: 'OK' });
    const cancelBtn = t('transliterate.cancel', { defaultValue: 'Cancel' });
    const pendingText = t('transliterate.pending', { defaultValue: 'Converting...' });

    const shouldShow = !!text?.trim() || !!value?.trim();

    return (
        <AnimatePresence>
            {shouldShow && (
                <motion.div
                    key="preview"
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="overflow-hidden"
                >
                    <div className="mt-1.5 px-3 py-2 bg-gold-soft/10 border border-gold/20 rounded-lg flex flex-col sm:flex-row sm:items-center gap-2 overflow-hidden w-full">
                        <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-start">
                            <span className="text-[10px] sm:text-[11px] font-bold text-gold/80 tracking-normal">
                                {previewLabel}
                            </span>
                            {isPending && (
                                <span className="text-[11px] sm:text-[12px] text-slate-400 italic animate-pulse">
                                    {pendingText}
                                </span>
                            )}
                        </div>
                        {!isPending && (
                            isEditing ? (
                                <div className="flex flex-row items-center gap-1.5 w-full sm:flex-1 min-w-0">
                                    <TransliteratingInput
                                        ref={editInputRef}
                                        autoFocus
                                        value={editValue}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        onBlur={handleBlur}
                                        targetLanguage={targetLang}
                                        className="flex-1 min-w-0 w-full text-[13px] font-medium text-rosewood bg-white border border-rosewood/30 rounded-md px-2 py-1 outline-none focus:border-rosewood/60 focus:ring-1 focus:ring-rosewood/20 transition shadow-sm"
                                        onKeyPress={e => { if (e.key === 'Enter') e.preventDefault(); }}
                                    />
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {language === 'en' && (
                                            <button type="button" onMouseDown={e => e.preventDefault()} onTouchStart={e => e.preventDefault()} onClick={toggleKeyboard} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-95 shadow-sm ${isKeyboardOpen ? 'bg-rosewood text-white border-rosewood' : 'bg-gold-soft/10 text-rosewood border border-gold/20 hover:bg-gold-soft/20'}`} title="Tamil Keyboard">
                                                <span className="material-symbols-outlined text-[18px]">keyboard</span>
                                            </button>
                                        )}
                                        <button type="button" onMouseDown={e => e.preventDefault()} onTouchStart={e => e.preventDefault()} onClick={handleConfirm} className="w-8 h-8 flex items-center justify-center text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-300 transition-all active:scale-90 shadow-sm" title={confirmBtn}>
                                            <span className="material-symbols-outlined text-[18px]">check</span>
                                        </button>
                                        <button type="button" onMouseDown={e => e.preventDefault()} onTouchStart={e => e.preventDefault()} onClick={handleCancel} className="w-8 h-8 flex items-center justify-center text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-600 hover:border-slate-300 transition-all active:scale-90 shadow-sm" title={cancelBtn}>
                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:flex-1 min-w-0">
                                    <span className="text-[14px] font-semibold text-rosewood flex-1 leading-snug whitespace-pre-wrap">
                                        {preview || value || '—'}
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button type="button" onClick={handleEditClick} className="w-8 h-8 flex items-center justify-center text-rosewood/60 bg-white border border-rosewood/10 rounded-lg hover:bg-gold-soft/10 hover:text-rosewood hover:border-gold/30 transition-all active:scale-90 shadow-sm" title={editBtn}>
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </motion.div>
            )}
            <TamilKeyboard
                isOpen={isKeyboardOpen}
                onClose={closeKeyboard}
                onKeyPress={handleKeyboardSelect}
                onBackspace={handleKeyboardBackspace}
                onSpace={() => handleKeyboardSelect(' ')}
                onEnter={closeKeyboard}
            />
        </AnimatePresence>
    );
};
