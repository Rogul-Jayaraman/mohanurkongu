import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { motion } from 'framer-motion';
import { AdminMembershipCard } from './AdminMembershipCard';

const MembershipManagement: React.FC = () => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';
  const { t } = useTranslation();

  const basicFeatures = t('dashboard:basic_features', { returnObjects: true }) as string[] || [];

  const basicPlan = {
    id: 'basic',
    name: t('dashboard:basic_plan'),
    price: 0,
    priceLabel: isTamil ? 'இலவசம்' : 'Free',
    period: isTamil ? 'வாழ்நாள் முழுவதும்' : 'Lifetime Access',
    features: basicFeatures,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-8 max-w-7xl mx-auto pb-16 pt-8">
      <div className="grid grid-cols-1 md:grid-cols-1 gap-8 px-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <AdminMembershipCard plan={basicPlan} isTamil={isTamil} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MembershipManagement;
