import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { useAuditTrailQuery } from '@/queries/useProfileQueries';
import { History, Shield, RotateCcw, CheckCircle, XCircle, Clock, User, X, Loader2 } from 'lucide-react';

interface AuditTrailData {
  stateHistory: Array<{ from: string; to: string; changedBy: string; changedAt: string; reason: string | null }>;
  reviews: Array<{ verifierName: string; decision: string; comment: string | null; createdAt: string }>;
  queue: { assignedTo: string | null; priority: number | null; createdAt: string | null; completedAt: string | null } | null;
}

interface AuditPanelProps {
  profileId: string;
  isOpen: boolean;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  ACTIVE: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  PENDING: 'text-amber-600 bg-amber-50 border-amber-200',
  REJECTED: 'text-red-600 bg-red-50 border-red-200',
  ARCHIVED: 'text-slate-600 bg-slate-50 border-slate-200',
  DELETED: 'text-rose-600 bg-rose-50 border-rose-200',
  DRAFT: 'text-blue-600 bg-blue-50 border-blue-200',
};

const decisionIcons: Record<string, React.ReactNode> = {
  APPROVED: <CheckCircle size={14} className="text-emerald-500" />,
  REJECTED: <XCircle size={14} className="text-red-500" />,
  ARCHIVE: <Shield size={14} className="text-slate-500" />,
  RESTORE: <RotateCcw size={14} className="text-blue-500" />,
};

const AuditPanel: React.FC<AuditPanelProps> = ({ profileId, isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const isTamil = language === 'ta';

  const auditQuery = useAuditTrailQuery(isOpen ? profileId : undefined);
  const data = auditQuery.data as AuditTrailData | null;
  const isLoading = auditQuery.isPending && isOpen;
  const [activeTab, setActiveTab] = React.useState<'history' | 'reviews'>('history');

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(isTamil ? 'ta-IN' : 'en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gold-soft/20 overflow-hidden max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gold-soft/10 bg-ivory/50">
              <div className="flex items-center gap-2">
                <History size={18} className="text-rosewood" />
                <h2 className="text-lg font-serif font-bold text-rosewood">
                  {t('adminMatrimony.audit.trailTitle') || 'Audit Trail'}
                </h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-rosewood/5 text-rosewood/60 hover:text-rosewood transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Queue status bar */}
            {!isLoading && data?.queue && (
              <div className="px-6 py-3 bg-amber-50/50 border-b border-amber-200/50 flex items-center gap-4 text-xs flex-wrap">
                {data.queue.assignedTo && (
                  <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                    <User size={12} />
                    {t('adminMatrimony.audit.assignedTo') || 'Assigned to'}: {data.queue.assignedTo}
                  </span>
                )}
                {data.queue.priority != null && (
                  <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                    <Clock size={12} />
                    {t('adminMatrimony.audit.priority') || 'Priority'}: {data.queue.priority}
                  </span>
                )}
                {data.queue.createdAt && (
                  <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                    <Clock size={12} />
                    {t('adminMatrimony.audit.queuedAt') || 'Queued'}: {formatDateTime(data.queue.createdAt)}
                  </span>
                )}
              </div>
            )}

            {/* Tab nav */}
            <div className="flex border-b border-gold-soft/10 px-6">
              {(['history', 'reviews'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-[1px] ${
                    activeTab === tab
                      ? 'text-rosewood border-rosewood'
                      : 'text-slate-400 border-transparent hover:text-slate-600'
                  }`}
                >
                  {tab === 'history'
                    ? (t('adminMatrimony.audit.statusHistory') || 'Status History')
                    : (t('adminMatrimony.audit.reviews') || 'Reviews')}
                  {tab === 'history' && data?.stateHistory && (
                    <span className="ml-1.5 text-[10px] text-slate-400">({data.stateHistory.length})</span>
                  )}
                  {tab === 'reviews' && data?.reviews && (
                    <span className="ml-1.5 text-[10px] text-slate-400">({data.reviews.length})</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={24} className="text-gold animate-spin" />
                </div>
              ) : activeTab === 'history' ? (
                data?.stateHistory && data.stateHistory.length > 0 ? (
                  <div className="space-y-3">
                    {data.stateHistory.map((entry, i) => (
                      <div key={i} className="flex gap-3 items-start p-3 rounded-xl border border-gold-soft/10 bg-white hover:bg-ivory/30 transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          (statusColors[entry.to] || 'bg-slate-100 text-slate-500').split(' ').slice(1).join(' ')
                        }`}>
                          {entry.to === 'ACTIVE' ? <CheckCircle size={14} /> : entry.to === 'REJECTED' ? <XCircle size={14} /> : <Shield size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${statusColors[entry.from] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{entry.from}</span>
                            <span className="text-slate-300 text-xs">→</span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${statusColors[entry.to] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{entry.to}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1"><User size={10} /> {entry.changedBy || 'System'}</span>
                            <span>{formatDateTime(entry.changedAt)}</span>
                          </div>
                          {entry.reason && (
                            <p className="mt-1.5 text-xs text-slate-600 bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100">
                              {entry.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-12 text-sm font-medium">
                    {t('adminMatrimony.audit.noHistory') || 'No status history found'}
                  </p>
                )
              ) : (
                data?.reviews && data.reviews.length > 0 ? (
                  <div className="space-y-3">
                    {data.reviews.map((review, i) => (
                      <div key={i} className="flex gap-3 items-start p-3 rounded-xl border border-gold-soft/10 bg-white hover:bg-ivory/30 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-rosewood/5 flex items-center justify-center shrink-0">
                          {decisionIcons[review.decision] || <Shield size={14} className="text-slate-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-rosewood">{review.verifierName || 'Unknown'}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              review.decision === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                              review.decision === 'REJECTED' ? 'bg-red-50 text-red-600' :
                              'bg-slate-50 text-slate-600'
                            }`}>{review.decision}</span>
                            <span className="text-[10px] text-slate-400 ml-auto">{formatDateTime(review.createdAt)}</span>
                          </div>
                          {review.comment && (
                            <p className="mt-1.5 text-xs text-slate-600 bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-12 text-sm font-medium">
                    {t('adminMatrimony.audit.noReviews') || 'No reviews found'}
                  </p>
                )
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuditPanel;
