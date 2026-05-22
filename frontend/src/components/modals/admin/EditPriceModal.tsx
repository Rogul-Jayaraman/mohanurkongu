import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, X, Loader2, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { scrollToTop } from '@/components/ui/layout/ScrollToTop';

interface EditPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrice: number;
  onSave: (price: number) => void;
  isUpdating: boolean;
}

export const EditPriceModal: React.FC<EditPriceModalProps> = ({
  isOpen, onClose, currentPrice, onSave, isUpdating
}) => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setPrice(currentPrice.toString());
    } else {
      document.body.style.overflow = 'unset';
      scrollToTop();
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, currentPrice]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSave = () => {
    const numPrice = Number(price.replace(/,/g, ''));
    if (numPrice > 0) onSave(numPrice);
  };

  const isDirty = price !== currentPrice.toString();

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-linear-to-br from-ivory/40 via-gold-soft/20 to-ivory/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white/10 backdrop-blur-2xl border-2 border-gold/30 rounded-xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
          >
            <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl overflow-hidden pointer-events-none" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-gold/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col max-h-[95vh]"
          >
            <div className="px-6 py-5 bg-linear-to-r from-ivory/80 via-gold-soft/10 to-ivory/80 backdrop-blur-xl border-b border-gold/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  <DollarSign size={24} className="text-rosewood" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-rosewood tracking-tight leading-tight">
                    {isTamil ? 'பிரீமியம் விலையை மாற்றவும்' : 'Update Premium Price'}
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-rosewood-gradient text-white rounded-full transition-all hover:brightness-110 hover:rotate-90 duration-300 ml-4 shadow-md"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 p-6">
              <div className="space-y-6">
                <div className="p-4 bg-linear-to-br from-ivory via-ivory to-gold-soft/30 rounded-xl border border-gold/20 shadow-sm">
                  <span className="text-[9px] text-rosewood/40 font-black uppercase tracking-widest block mb-1">
                    {isTamil ? 'தற்போதைய விலை' : 'CURRENT PRICE'}
                  </span>
                  <span className="text-2xl font-black text-rosewood">₹{currentPrice.toLocaleString('en-IN')}</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] text-rosewood/50 font-black uppercase tracking-widest ml-1">
                    {isTamil ? 'புதிய விலை' : 'NEW PRICE'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rosewood/40 font-bold text-lg">₹</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 bg-linear-to-br from-ivory/80 to-white border-2 border-gold/20 rounded-xl text-xl font-black text-rosewood outline-none focus:border-gold/40 transition-all"
                      placeholder="1500"
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-5  backdrop-blur-xl border-t border-gold/10 shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-rosewood-gradient border-2 border-gold/20 text-rosewood font-bold rounded-xl hover:shadow-md hover:border-gold/40 transition-all text-sm shadow-sm"
                >
                  {isTamil ? 'ரத்து' : 'Cancel'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isUpdating || !price || !isDirty}
                  className="flex-1 px-6 py-3 bg-linear-to-br from-gold/30 via-ivory to-gold/30 text-rosewood font-bold rounded-xl hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={16} strokeWidth={3} />}
                  {isUpdating ? '...' : (isTamil ? 'சேமி' : 'Save')}
                </button>
              </div>
            </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
