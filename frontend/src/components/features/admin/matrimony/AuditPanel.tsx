import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuditTrailQuery } from '@/queries/useProfileQueries';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { History, Shield, RotateCcw, CheckCircle, XCircle, Clock, User, Loader2 } from 'lucide-react';

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
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="text-gold animate-spin" />
        </div>
      );
    }

    return (
      <>
        {data?.queue && (
          <div className="flex items-center gap-4 flex-wrap mb-5 px-4 py-3 bg-amber-50/60 rounded-xl border border-amber-200/50 text-xs">
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

        <div className="flex border-b border-gold/10 mb-6">
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

        {activeTab === 'history' ? (
          data?.stateHistory && data.stateHistory.length > 0 ? (
            <div className="space-y-3">
              {data.stateHistory.map((entry, i) => (
                <div key={i} className="flex gap-3 items-start p-4 rounded-xl border border-gold/10 bg-white/60 hover:bg-ivory/40 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    (statusColors[entry.to] || 'bg-slate-100 text-slate-500').split(' ').slice(1).join(' ')
                  }`}>
                    {entry.to === 'ACTIVE' ? <CheckCircle size={16} /> : entry.to === 'REJECTED' ? <XCircle size={16} /> : <Shield size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${statusColors[entry.from] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{entry.from}</span>
                      <span className="text-gold/50 text-xs">→</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${statusColors[entry.to] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{entry.to}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1"><User size={10} /> {entry.changedBy || 'System'}</span>
                      <span>{formatDateTime(entry.changedAt)}</span>
                    </div>
                    {entry.reason && (
                      <p className="mt-2 text-xs text-slate-600 bg-white rounded-lg px-3 py-2 border border-gold/10">
                        {entry.reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-400 py-16 text-sm font-medium">
              {t('adminMatrimony.audit.noHistory') || 'No status history found'}
            </p>
          )
        ) : (
          data?.reviews && data.reviews.length > 0 ? (
            <div className="space-y-3">
              {data.reviews.map((review, i) => (
                <div key={i} className="flex gap-3 items-start p-4 rounded-xl border border-gold/10 bg-white/60 hover:bg-ivory/40 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-rosewood/5 flex items-center justify-center shrink-0">
                    {decisionIcons[review.decision] || <Shield size={16} className="text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-rosewood">{review.verifierName || 'Unknown'}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        review.decision === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                        review.decision === 'REJECTED' ? 'bg-red-50 text-red-600' :
                        'bg-slate-50 text-slate-600'
                      }`}>{review.decision}</span>
                      <span className="text-[10px] text-slate-400 ml-auto">{formatDateTime(review.createdAt)}</span>
                    </div>
                    {review.comment && (
                      <p className="mt-2 text-xs text-slate-600 bg-white rounded-lg px-3 py-2 border border-gold/10">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-400 py-16 text-sm font-medium">
              {t('adminMatrimony.audit.noReviews') || 'No reviews found'}
            </p>
          )
        )}
      </>
    );
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      icon={<div className="p-2 bg-rosewood/10 rounded-xl"><History className="text-rosewood" size={20} /></div>}
      title={t('adminMatrimony.audit.trailTitle') || 'Audit Trail'}
      size="2xl"
      noFooter
    >
      {renderContent()}
    </ModalShell>
  );
};

export default AuditPanel;
