import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface StatusReasonsSectionProps {
  rejectionReasonEn?: string | null;
  rejectionReasonTa?: string | null;
  statusReasonEn?: string | null;
  statusReasonTa?: string | null;
  isTamil: boolean;
  show: boolean;
}

const StatusReasonsSection: React.FC<StatusReasonsSectionProps> = ({
  rejectionReasonEn,
  rejectionReasonTa,
  statusReasonEn,
  statusReasonTa,
  isTamil,
  show,
}) => {
  if (!show) return null;
  if (!rejectionReasonEn && !statusReasonEn) return null;

  return (
    <div className="space-y-3">
      {rejectionReasonEn && (
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert size={16} className="text-red-500" />
            <p className="text-[9px] text-red-400 font-bold">
              {isTamil ? "நிராகரிப்பு காரணம்" : "Rejection Reason"}
            </p>
          </div>
          <p className="text-sm font-bold text-red-800 ml-7">
            {isTamil && rejectionReasonTa ? rejectionReasonTa : rejectionReasonEn}
          </p>
        </div>
      )}
      {statusReasonEn && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert size={16} className="text-amber-500" />
            <p className="text-[9px] text-amber-400 font-bold">
              {isTamil ? "தடை காரணம்" : "Block Reason"}
            </p>
          </div>
          <p className="text-sm font-bold text-amber-800 ml-7">
            {isTamil && statusReasonTa ? statusReasonTa : statusReasonEn}
          </p>
        </div>
      )}
    </div>
  );
};

export default StatusReasonsSection;
