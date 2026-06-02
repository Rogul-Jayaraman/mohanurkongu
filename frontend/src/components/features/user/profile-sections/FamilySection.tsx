import React from 'react';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProfileUtils } from '@/hooks/useProfileUtils';
import { SectionCard3D, SectionHeaderRedesigned, DetailRow } from '@/components/features/matrimony/ProfileViewPrimitives';

interface FamilySectionProps {
  profile: any;
  isLoading: boolean;
}

const FamilySection: React.FC<FamilySectionProps> = ({ profile, isLoading }) => {
  const { t: tCommon, i18n } = useTranslation(['common']);
  const { t, formatSalary } = useProfileUtils();
  const isTamil = i18n.language === 'ta';

  const fatherNameRaw = profile ? (isTamil ? profile.fatherNameTa || profile.fatherNameEn : profile.fatherNameEn) || tCommon('not_provided') : '';
  const motherNameRaw = profile ? (isTamil ? profile.motherNameTa || profile.motherNameEn : profile.motherNameEn) || tCommon('not_provided') : '';
  const lateSuffix = ` (${t('profile_new:is_late')})`;
  const fatherName = profile?.fatherIsLate ? `${fatherNameRaw}${lateSuffix}` : fatherNameRaw;
  const motherName = profile?.motherIsLate ? `${motherNameRaw}${lateSuffix}` : motherNameRaw;

  return (
    <SectionCard3D isLoading={isLoading}>
      <SectionHeaderRedesigned
        title={t('profile_new:sections.family_details')}
        icon={<Heart size={16} />}
        gradient="bg-ivory-gold-gradient text-rosewood"
        isTamil={isTamil}
        isLoading={isLoading}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
        <div>
          <h3 className="font-semibold text-rosewood text-sm mt-1 mb-2 border-b border-rosewood/10 pb-1">
            {isLoading ? <div className="h-4 w-28 bg-gold/10 rounded animate-pulse" /> : `${t('profile_new:father_details_label')}:`}
          </h3>
          <DetailRow label={t('profile_new:father_name')} value={fatherName} isLoading={isLoading} />
          <DetailRow label={t('profile_new:father_job')} value={profile?.fatherJob || ''} isLoading={isLoading} />
          <DetailRow label={tCommon('salary_monthly')} value={profile?.fatherSalary ? formatSalary(profile.fatherSalary) : ''} isLoading={isLoading} />
          <h3 className="font-semibold text-rosewood text-sm mt-5 mb-2 border-b border-rosewood/10 pb-1">
            {isLoading ? <div className="h-4 w-24 bg-gold/10 rounded animate-pulse" /> : `${t('profile_new:sections.siblings')}:`}
          </h3>
          <DetailRow label={t('profile_new:no_of_brothers')} value={profile?.noOfBrothers ?? 0} isLoading={isLoading} />
        </div>
        <div>
          <h3 className="font-semibold text-rosewood text-sm mt-1 mb-2 border-b border-rosewood/10 pb-1">
            {isLoading ? <div className="h-4 w-24 bg-gold/10 rounded animate-pulse" /> : `${t('profile_new:mother_details_label')}:`}
          </h3>
          <DetailRow label={t('profile_new:mother_name')} value={motherName} isLoading={isLoading} />
          <DetailRow label={t('profile_new:mother_job')} value={profile?.motherJob || ''} isLoading={isLoading} />
          <DetailRow label={tCommon('salary_monthly')} value={profile?.motherSalary ? formatSalary(profile.motherSalary) : ''} isLoading={isLoading} />
          <h3 className="font-semibold text-rosewood text-sm mt-5 mb-2 border-b border-rosewood/10 pb-1">
            {isLoading ? <div className="h-4 w-24 bg-gold/10 rounded animate-pulse" /> : `${t('profile_new:sections.siblings')}:`}
          </h3>
          <DetailRow label={t('profile_new:no_of_sisters')} value={profile?.noOfSisters ?? 0} isLoading={isLoading} />
        </div>
      </div>
    </SectionCard3D>
  );
};

export default FamilySection;
