import React from 'react';
import { Info, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SectionCard3D, SectionHeaderRedesigned, DetailRow } from '@/components/features/matrimony/ProfileViewPrimitives';

interface ContactSectionProps {
  profile: any;
  isLoading: boolean;
}

const ContactSection: React.FC<ContactSectionProps> = ({ profile, isLoading }) => {
  const { i18n } = useTranslation(['common']);
  const isTamil = i18n.language === 'ta';
  const locked = profile?.contactLocked;

  return (
    <SectionCard3D isLoading={isLoading}>
      <SectionHeaderRedesigned
        title={isTamil ? 'தொடர்பு தகவல்' : 'Contact'}
        icon={<Info size={16} />}
        gradient="bg-rosewood-gradient"
        isTamil={isTamil}
        isLoading={isLoading}
      />
      {isLoading ? null : locked ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Lock size={32} className="text-slate-300 mb-3" />
          <p className="text-sm text-slate-500 font-medium">
            {isTamil ? 'தொடர்பு தகவலைப் பார்க்க மேம்படுத்தவும்' : 'Upgrade your plan to view contact information'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
          <DetailRow label={isTamil ? 'தொலைபேசி' : 'Phone'} value={profile?.phone || '-'} isLoading={isLoading} />
          <DetailRow label={isTamil ? 'மின்னஞ்சல்' : 'Email'} value={profile?.email || '-'} isLoading={isLoading} />
        </div>
      )}
    </SectionCard3D>
  );
};

export default ContactSection;
