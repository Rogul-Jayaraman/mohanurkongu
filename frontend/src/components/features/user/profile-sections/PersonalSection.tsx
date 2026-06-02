import React from 'react';
import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProfileUtils } from '@/hooks/useProfileUtils';
import { PROFILE_FOR_OPTIONS, MARITAL_STATUS_OPTIONS, DIET_OPTIONS, COMPLEXION_OPTIONS, BLOOD_GROUP_OPTIONS, HEIGHT_OPTIONS } from '@/constants/index';
import { SectionCard3D, SectionHeaderRedesigned, DetailRow } from '@/components/features/matrimony/ProfileViewPrimitives';

interface PersonalSectionProps {
  profile: any;
  isLoading: boolean;
}

const PersonalSection: React.FC<PersonalSectionProps> = ({ profile, isLoading }) => {
  const { t: tCommon, i18n } = useTranslation(['common']);
  const isTamil = i18n.language === 'ta';
  const { getEnumLabel } = useProfileUtils();

  return (
    <SectionCard3D isLoading={isLoading}>
      <SectionHeaderRedesigned
        title={tCommon('personal_info')}
        icon={<User size={16} />}
        gradient="bg-ivory-gold-gradient text-rosewood"
        isLoading={isLoading}
        isTamil={isTamil}
      />
      <div className="space-y-0">
        <DetailRow label={tCommon('profile_new:profile_for')} value={profile?.profileFor ? getEnumLabel(profile.profileFor, PROFILE_FOR_OPTIONS) : ''} isLoading={isLoading} />
        <DetailRow label={tCommon('profile_new:marital_status')} value={profile?.maritalStatus ? getEnumLabel(profile.maritalStatus, MARITAL_STATUS_OPTIONS) : ''} isLoading={isLoading} />
        <DetailRow label={tCommon('profile_new:diet')} value={profile?.diet ? getEnumLabel(profile.diet, DIET_OPTIONS) : ''} isLoading={isLoading} />
        <DetailRow label={tCommon('profile_new:height')} value={profile?.height ? getEnumLabel(profile.height.toString(), HEIGHT_OPTIONS) : ''} isLoading={isLoading} />
        <DetailRow label={tCommon('profile_new:weight')} value={profile?.weight ? `${profile.weight} kg` : ''} isLoading={isLoading} />
        <DetailRow label={tCommon('profile_new:complexion')} value={profile?.complexion ? getEnumLabel(profile.complexion, COMPLEXION_OPTIONS) : ''} isLoading={isLoading} />
        <DetailRow label={tCommon('profile_new:blood_group')} value={profile?.bloodGroup ? getEnumLabel(profile.bloodGroup, BLOOD_GROUP_OPTIONS) : ''} isLoading={isLoading} />
      </div>
    </SectionCard3D>
  );
};

export default PersonalSection;
