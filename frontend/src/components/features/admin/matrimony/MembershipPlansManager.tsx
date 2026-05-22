import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { AdminMembershipCard } from './AdminMembershipCard';

const MembershipPlansManager: React.FC = () => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';

  const plan = {
    id: 'plan-1',
    name: `${isTamil ? 'அடிப்படை' : 'Basic'} ${isTamil ? 'சந்தா' : 'Plan'}`,
    price: 0,
    priceLabel: isTamil ? 'இலவசம்' : 'Free',
    period: isTamil ? 'வாழ்நாள் முழுவதும்' : 'Lifetime Access',
    features: isTamil
      ? ['தினமும் 10 வரன்கள் வரை பார்க்கலாம்', 'பிரீமியம் உறுப்பினர்களுக்கு உங்கள் விவரம் தெரியும்', 'குறைந்த புகைப்பட வசதி']
      : ['View up to 10 Profiles/day', 'Visible to Premium members', 'Limited Photo access'],
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <AdminMembershipCard plan={plan} isTamil={isTamil} />
      </div>
    </div>
  );
};

export default MembershipPlansManager;
