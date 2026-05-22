import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  priceLabel?: string;
  period?: string;
  features: string[];
}

interface AdminMembershipCardProps {
  plan: MembershipPlan;
  isTamil: boolean;
}

export const AdminMembershipCard: React.FC<AdminMembershipCardProps> = ({ plan, isTamil }) => {
  const { name, price, priceLabel, period, features } = plan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      whileHover={{ rotateX: -0.8, scale: 1.004 }}
      className="relative flex flex-col h-full rounded-xl p-8 transition-all duration-500 hover:shadow-xl border-2 border-slate-200/50 shadow-sm bg-white/10 backdrop-blur-2xl"
    >
      {/* Glass inner gradient layer */}
      <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl overflow-hidden pointer-events-none" />

      {/* 3D decorative blur spots */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gold/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

      {/* Pill Badge */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 pb-1 bg-linear-to-br from-gold-soft via-ivory via-ivory to-gold-soft rounded-full z-10 border border-gold/30 shadow-md">
        <span className="text-[10px] font-black text-rosewood tracking-wide whitespace-nowrap">
          {isTamil ? 'இலவச திட்டம்' : 'FREE PLAN'}
        </span>
      </div>

      <div className="relative flex flex-col flex-1">
        <div className="my-4">
          <h3 className="text-lg font-bold text-rosewood tracking-tight leading-tight uppercase">{name}</h3>
        </div>

        <div className="mb-4">
          <span className="text-xl font-semibold text-gold/80">
            {priceLabel ? priceLabel : `₹${price.toLocaleString('en-IN')}`}
          </span>
          {period && <span className="text-sage text-[9px] ml-1">{period}</span>}
        </div>

        <div className="grow space-y-3 mb-4 px-2">
          {features.map((feature, i) => (
            <div key={i} className="flex items-start gap-3 group/item">
              <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                <Check size={10} className="text-emerald-500" strokeWidth={4} />
              </div>
              <span className="text-xs font-bold text-slate-700 leading-tight">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
