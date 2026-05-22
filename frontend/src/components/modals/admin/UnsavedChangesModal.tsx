import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Save, X, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { scrollToTop } from '@/components/ui/layout/ScrollToTop';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDraft: () => void;
  onDiscard: () => void;
  isSubmitting?: boolean;
}

const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onClose,
  onSaveDraft,
  onDiscard,
  isSubmitting
}) => {
  const { t } = useTranslation('common');

  useEffect(() => {
    if (!isOpen) {
      scrollToTop();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gold-soft/10"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                  <AlertCircle size={28} />
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-ivory rounded-xl text-gray-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-2xl font-serif font-black text-rosewood mb-3">
                {t('unsaved_modal.title')}
              </h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                {t('unsaved_modal.description')}
              </p>
              <p className="mt-2 text-xs text-amber-600 font-semibold leading-relaxed bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
                {t('unsaved_modal.discard_note', {
                  defaultValue: 'Your existing saved draft will be kept. Only the current unsaved changes will be lost.'
                })}
              </p>

              <div className="mt-8 space-y-3">
                <button
                  disabled={isSubmitting}
                  onClick={onSaveDraft}
                  className="w-full flex items-center justify-center gap-3 bg-linear-to-r from-rosewood to-rosewood-dark text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rosewood/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <Save size={16} />
                  {t('unsaved_modal.save_draft')}
                </button>
                
                <button
                  disabled={isSubmitting}
                  onClick={onDiscard}
                  className="w-full flex items-center justify-center gap-3 bg-white text-gray-500 p-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 hover:text-gray-700 transition-all border border-gray-200"
                >
                  <ArrowLeft size={16} />
                  {t('unsaved_modal.discard', { defaultValue: 'Leave Without Saving' })}
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={onClose}
                  className="w-full text-xs font-black text-gray-400 uppercase tracking-widest p-2 hover:text-rosewood transition-colors"
                >
                  {t('unsaved_modal.keep_editing')}
                </button>
              </div>
            </div>
            
            <div className="h-1.5 w-full bg-ivory overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gold-soft"
                />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UnsavedChangesModal;
