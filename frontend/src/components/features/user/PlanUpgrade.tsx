import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const PlanUpgrade: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/manamaalai/my-account?tab=membership', { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin text-slate-400" />
    </div>
  );
};

export default PlanUpgrade;
