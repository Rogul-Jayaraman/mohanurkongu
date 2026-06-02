import React from 'react';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProfileUtils } from '@/hooks/useProfileUtils';
import { KULAM_OPTIONS } from '@/constants/index';
import { SectionCard3D, SectionHeaderRedesigned, DetailRow } from '@/components/features/matrimony/ProfileViewPrimitives';

interface CommunitySectionProps {
  profile: any;
  isLoading: boolean;
}

const CommunitySection: React.FC<CommunitySectionProps> = ({ profile, isLoading }) => {
  const { t: tCommon, i18n } = useTranslation(['common']);
  const { t, getEnumLabel, getLocationLabel } = useProfileUtils();
  const isTamil = i18n.language === 'ta';

  const getCommunityLabel = () => {
    if (!profile) return '';
    const comm = profile.community || 'Kongu Vellalar';
    if (isTamil && (comm === 'Kongu Vellalar' || comm === 'கொங்கு வேளாளர்' || comm === 'கொங்கு வெள்ளாளர்')) return 'கொங்கு வேளாளர்';
    return comm;
  };

  return (
    <SectionCard3D isLoading={isLoading}>
      <SectionHeaderRedesigned
        title={t('profile_new:sections.community_details')}
        icon={<Users size={16} />}
        gradient="bg-rosewood-gradient"
        isTamil={isTamil}
        isLoading={isLoading}
      />
      <div className="space-y-0">
        <DetailRow label={t('profile_new:caste')} value={profile?.caste || 'BC'} isLoading={isLoading} />
        <DetailRow label={t('profile_new:community')} value={getCommunityLabel()} isLoading={isLoading} />
        <DetailRow label={isTamil ? 'குலம்' : 'Kulam'} value={profile?.kulam ? getEnumLabel(profile.kulam, KULAM_OPTIONS) : ''} isLoading={isLoading} />
        <DetailRow label={t('profile_new:kuladeivam')} value={profile ? (isTamil ? profile.kuladeivamTa || profile.kuladeivamEn : profile.kuladeivamEn) || '' : ''} isLoading={isLoading} />
        <DetailRow label={t('profile_new:birth_place')} value={profile ? (isTamil ? profile.birthPlaceTa || profile.birthPlaceEn : profile.birthPlaceEn) || '' : ''} isLoading={isLoading} />
        <DetailRow
          label={t('profile_new:native_location')}
          value={profile ? getLocationLabel(profile.nativeDistrictEn || profile.nativeDistrict, profile.nativeTaluk || undefined, profile.nativeDistrictTa, profile.nativeTalukTa) : ''}
          isLoading={isLoading}
        />
      </div>
    </SectionCard3D>
  );
};

export default CommunitySection;
