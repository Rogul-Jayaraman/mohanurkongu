import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDualScript } from '@/hooks/useDualScript';
import { useLanguage } from '@/context/LanguageContext';
import { TransliteratingInput } from './PhoneticInput';
import { TamilKeyboard } from './TamilKeyboard';

interface TransliteratedInputPreviewProps {
    text: string;
    onPreviewChange?: (value: string) => void;
    value?: string;
}

export const TransliteratedInputPreview: React.FC<TransliteratedInputPreviewProps> = ({
    text,
    onPreviewChange,
    value,
}) => {
    const { language } = useLanguage();
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
    } = useDualScript({ text, targetLanguage: targetLang });

    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const editInputRef = React.useRef<HTMLInputElement>(null);

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

    React.useEffect(() => {
        if (value !== undefined && value !== preview) {
            setPreview(value);
        }
    }, [value]);

    React.useEffect(() => {
        if (preview && onPreviewChange) {
            onPreviewChange(preview);
        }
    }, [preview]);

    const handleEditClick = () => {
        setEditValue(preview);
        setIsEditing(true);
    };

    const handleConfirm = () => {
        setPreview(editValue);
        if (onPreviewChange) onPreviewChange(editValue);
        setIsEditing(false);
    };

    const handleCancel = () => setIsEditing(false);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleConfirm();
        if (e.key === 'Escape') handleCancel();
    };

    const previewLabel = language === 'en' ? 'Tamil' : 'English';
    const shouldShow = !!(text && text.trim());

    return (
        <AnimatePresence>
            {shouldShow && (
                <motion.div
                    key="preview"
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="mt-1.5"
                >
                    <div className="relative group overflow-hidden">
                        <div className="absolute inset-0 bg-linear-to-r from-gold/5 via-gold-soft/10 to-transparent blur-sm" />
                        <div className="relative px-3 py-2 bg-white/40 backdrop-blur-md border border-gold/10 rounded-xl flex items-center gap-3 transition-all group-hover:border-gold/30 group-hover:bg-white/60 shadow-sm">
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                                <span className="text-[10px] font-bold text-gold/80 uppercase tracking-widest">
                                    {previewLabel}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                {isPending ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-12 h-2 bg-gold/5 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gold/30"
                                                animate={{ x: [-48, 48] }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            />
                                        </div>
                                    </div>
                                ) : isEditing ? (
                                    <div className="flex items-center gap-1.5 pr-1">
                                        <TransliteratingInput
                                            ref={editInputRef}
                                            autoFocus
                                            value={editValue}
                                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => { setEditValue(e.target.value); }}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            targetLanguage={targetLang}
                                            className="w-full text-sm font-semibold text-rosewood bg-transparent border-none p-0 outline-none placeholder:text-rosewood/30"
                                            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') e.preventDefault(); }}
                                        />
                                        <div className="flex items-center gap-1">
                                            {language === 'en' && (
                                                <button type="button" onClick={toggleKeyboard} className={`p-1 rounded-md transition-all active:scale-90 ${isKeyboardOpen ? 'bg-rosewood text-white shadow-sm' : 'hover:bg-gold-soft/20 text-rosewood/60 hover:text-rosewood'}`} title="Tamil Keyboard">
                                                    <span className="material-symbols-outlined text-[18px]">keyboard</span>
                                                </button>
                                            )}
                                            <button type="button" onClick={handleConfirm} className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-md transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">done</span>
                                            </button>
                                            <button type="button" onClick={handleCancel} className="p-1 hover:bg-red-50 text-red-400 rounded-md transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">close</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between group/val">
                                        <span className="text-sm font-semibold text-rosewood/90 leading-tight truncate">
                                            {preview || '—'}
                                        </span>
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                                            <button type="button" onClick={handleEditClick} className="p-1 text-gold hover:text-rosewood hover:scale-110 transition-all font-variation-medium" title="Edit">
                                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
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
