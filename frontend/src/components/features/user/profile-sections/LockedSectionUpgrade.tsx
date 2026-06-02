import React from 'react';
import { Lock } from 'lucide-react';

interface LockedSectionUpgradeProps {
  message: string;
  messageTa: string;
  isTamil?: boolean;
}

const LockedSectionUpgrade: React.FC<LockedSectionUpgradeProps> = ({ message, messageTa, isTamil }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl bg-gradient-to-b from-rosewood/[0.02] to-transparent border border-rosewood/10">
      <div className="w-16 h-16 rounded-2xl bg-rosewood/5 flex items-center justify-center mb-4 border border-rosewood/10">
        <Lock size={28} className="text-rosewood/30" />
      </div>
      <p className="text-sm text-slate-500 font-medium max-w-[220px]">
        {isTamil ? messageTa : message}
      </p>
    </div>
  );
};

export default LockedSectionUpgrade;
