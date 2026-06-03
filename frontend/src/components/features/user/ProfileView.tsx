import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useProfileView } from '@/hooks/useProfileView';
import { useMyCapabilitiesQuery } from '@/queries/useMembershipQueries';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { ArrowLeft, Printer, FileText, Shield } from 'lucide-react';
import { SectionDivider } from '@/components/features/matrimony/ProfileViewPrimitives';
import PrintProfile, { JathagamPrintView } from './PrintProfile';

import QuickNav from './profile-sections/QuickNav';
import ProfileHeaderSection from './profile-sections/ProfileHeaderSection';
import StatusReasonsSection from './profile-sections/StatusReasonsSection';
import LockedSectionUpgrade from './profile-sections/LockedSectionUpgrade';
import ActionBar from './profile-sections/ActionBar';
import PersonalSection from './profile-sections/PersonalSection';
import CommunitySection from './profile-sections/CommunitySection';
import ProfessionalSection from './profile-sections/ProfessionalSection';
import FamilySection from './profile-sections/FamilySection';
import AssetsSection from './profile-sections/AssetsSection';
import PartnerPreferenceSection from './profile-sections/PartnerPreferenceSection';
import ContactSection from './profile-sections/ContactSection';
import HoroscopeSection from './profile-sections/HoroscopeSection';
import GallerySection from './profile-sections/GallerySection';

// ═══════════════════════════════════════════════════════════
// ProfileView (Main Orchestrator)
// ═══════════════════════════════════════════════════════════
const ProfileView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['common']);
  const isTamil = i18n.language === 'ta';
  const { user } = useAuth();

  const {
    profile,
    loading,
    errorType,
    errorMessage,
    viewerRole,
    shortlisted,
    handleRetry,
    handleToggleShortlist,
  } = useProfileView(id);

  const [viewDetails, setViewDetails] = useState<string>('FULL');
  const [canPrintProfile, setCanPrintProfile] = useState(false);
  const [canPrintHoroscope, setCanPrintHoroscope] = useState(false);
  const { data: capsData } = useMyCapabilitiesQuery();
  useEffect(() => {
    const caps = (capsData as any)?.capabilities as { viewDetails?: string; printProfile?: boolean; printHoroscope?: boolean } | undefined;
    if (caps?.viewDetails) setViewDetails(caps.viewDetails);
    if (caps?.printProfile !== undefined) setCanPrintProfile(caps.printProfile);
    if (caps?.printHoroscope !== undefined) setCanPrintHoroscope(caps.printHoroscope);
  }, [capsData]);

  const levels = ['BASIC', 'EXTENDED', 'ADVANCED', 'FULL'];
  const vd = (min: string) => levels.indexOf(viewDetails) >= levels.indexOf(min);
  const isStaff = viewerRole === 'admin';
  const isOwner = !!(profile && user && (profile.isOwner || profile.userId === user.id));
  const bypassLocks = isOwner || isStaff;
  const professionalLocked = !vd('EXTENDED') && !bypassLocks;
  const familyLocked = !vd('EXTENDED') && !bypassLocks;
  const horoscopeLabelsLocked = !vd('EXTENDED') && !bypassLocks;
  const horoscopeChartsLocked = !vd('ADVANCED') && !bypassLocks;
  const contactLocked = !vd('FULL') && !bypassLocks;
  const galleryLocked = !vd('EXTENDED') && !bypassLocks;

  const [isPrintingJathagam, setIsPrintingJathagam] = useState(false);
  const [isPrintingBiodata, setIsPrintingBiodata] = useState(false);

  const userGalleryImages = (profile?.gallery || []).filter((url: string) => !!url);
  const hasUserGalleryContent = loading || userGalleryImages.length > 0;

  useEffect(() => {
    if (isPrintingJathagam && profile) {
      document.body.classList.add('printing-jathagam');
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [isPrintingJathagam, profile]);

  useEffect(() => {
    if (isPrintingJathagam) {
      const handler = () => {
        setIsPrintingJathagam(false);
        document.body.classList.remove('printing-jathagam');
      };
      window.addEventListener('afterprint', handler);
      return () => window.removeEventListener('afterprint', handler);
    }
  }, [isPrintingJathagam]);

  useEffect(() => {
    if (isPrintingBiodata && profile) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [isPrintingBiodata, profile]);

  useEffect(() => {
    if (isPrintingBiodata) {
      const handler = () => setIsPrintingBiodata(false);
      window.addEventListener('afterprint', handler);
      return () => window.removeEventListener('afterprint', handler);
    }
  }, [isPrintingBiodata]);

  const handlePrintJathagam = () => setIsPrintingJathagam(true);

  if (isPrintingJathagam && profile) {
    return <JathagamPrintView profile={profile} />;
  }

  if (isPrintingBiodata && profile) {
    return <PrintProfile profile={profile} />;
  }

  if (errorType) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-rosewood/5 flex items-center justify-center mx-auto mb-6">
            <span className="text-rosewood/30 text-2xl font-serif font-bold">!</span>
          </div>
          <h2 className="text-xl font-serif font-black text-rosewood mb-2">
            {errorType === 'NOT_FOUND' && t('common:profile_not_found')}
            {errorType === 'FORBIDDEN' && 'Access Restricted'}
            {errorType === 'NETWORK_ERROR' && 'Connection Error'}
          </h2>
          <p className="text-gray-500 text-sm mb-6 max-w-md">
            {errorMessage || t('common:profile_not_found_desc', { defaultValue: 'This profile may have been removed.' })}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="px-8 py-3 bg-rosewood text-white rounded-xl font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-rosewood/20"
            >
              {t('common:back')}
            </button>
            {errorType === 'NETWORK_ERROR' && (
              <button
                onClick={handleRetry}
                className="px-8 py-3 bg-gold/20 text-rosewood rounded-xl font-black text-xs hover:scale-105 active:scale-95 transition-all"
              >
                Retry
              </button>
            )}
            {errorType === 'FORBIDDEN' && (
              <button
                onClick={() => navigate('/manamaalai/my-account?tab=plans')}
                className="px-8 py-3 bg-gold/20 text-rosewood rounded-xl font-black text-xs hover:scale-105 active:scale-95 transition-all"
              >
                Upgrade Plan
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-manrope selection:bg-gold/20">
      {/* Section Tabs */}
      <div className="sticky top-0 z-20 relative -mt-4 lg:-mt-8">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-screen bg-white border-b border-gold/10 shadow-sm pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <QuickNav />
        </div>
      </div>

      {/* Main Content */}
      <div className="no-print max-w-6xl mx-auto px-4 sm:px-6 pb-10">
        {/* Back + Print + Actions */}
        <div className="flex items-center justify-between pt-4 sm:pt-6 pb-4 sm:pb-8 gap-2">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2
                       bg-ivory-gold-gradient rounded-xl text-[10px] sm:text-xs
                       font-black shadow-sm btn-shine shrink-0"
          >
            <ArrowLeft size={14} className="sm:size-4" />
            <span className="hidden sm:inline">{t('common:back')}</span>
          </motion.button>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <ActionBar viewerRole={viewerRole} isShortlisted={shortlisted} isOwner={isOwner} onToggleShortlist={handleToggleShortlist} />
            {profile && (
              <>
                {(canPrintHoroscope || bypassLocks) ? (
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrintJathagam}
                    className="btn-shine flex items-center gap-1 sm:gap-2 px-2 sm:px-5 py-1.5 sm:py-2
                               bg-rosewood-gradient text-white rounded-xl text-[10px] sm:text-[11px]
                               font-bold shadow-sm border border-rosewood/20 shrink-0"
                  >
                    <FileText size={13} className="sm:size-[14px]" />
                    <span className="hidden sm:inline">{t('common:print_jathagam')}</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/manamaalai/my-account?tab=plans')}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-5 py-1.5 sm:py-2
                               bg-gray-200 text-gray-400 rounded-xl text-[10px] sm:text-[11px]
                               font-bold shadow-sm shrink-0"
                    title={t('common:upgrade_to_print', { defaultValue: 'Upgrade to print' })}
                  >
                    <FileText size={13} className="sm:size-[14px]" />
                    <span className="hidden sm:line-through">{t('common:print_jathagam')}</span>
                  </motion.button>
                )}
                {(canPrintProfile || bypassLocks) ? (
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsPrintingBiodata(true)}
                    className="btn-shine flex items-center gap-1 sm:gap-2 px-2 sm:px-5 py-1.5 sm:py-2
                                bg-rosewood-gradient text-white rounded-xl text-[10px] sm:text-[11px]
                                font-bold shadow-sm border border-rosewood/20 shrink-0"
                  >
                    <Printer size={13} className="sm:size-[14px]" />
                    <span className="hidden sm:inline">{t('common:print')}</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/manamaalai/my-account?tab=plans')}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-5 py-1.5 sm:py-2
                                bg-gray-200 text-gray-400 rounded-xl text-[10px] sm:text-[11px]
                                font-bold shadow-sm shrink-0"
                    title={t('common:upgrade_to_print', { defaultValue: 'Upgrade to print' })}
                  >
                    <Printer size={13} className="sm:size-[14px]" />
                    <span className="hidden sm:line-through">{t('common:print')}</span>
                  </motion.button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Staff badge */}
        {viewerRole === 'admin' && profile && (
          <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-700">
            <Shield size={14} />
            <span>{t('common:admin_view')}</span>
          </div>
        )}

        {/* Hero */}
        <AnimatedSection>
          <div id="section-basic" className="scroll-mt-20 mb-6">
            <ProfileHeaderSection profile={profile} isLoading={loading} isTamil={isTamil} isOwner={isOwner} />
          </div>
        </AnimatedSection>

        {/* Rejection / Block reasons */}
        <AnimatedSection>
          <div className="mb-6">
            <StatusReasonsSection
              rejectionReasonEn={profile?.rejectionReasonEn}
              rejectionReasonTa={profile?.rejectionReasonTa}
              statusReasonEn={profile?.statusReasonEn}
              statusReasonTa={profile?.statusReasonTa}
              isTamil={isTamil}
              show={!!profile && isOwner}
            />
          </div>
        </AnimatedSection>

        {/* Sections 1 + 2: Personal + Community */}
        <AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div id="section-personal" className="scroll-mt-20">
              <PersonalSection profile={profile} isLoading={loading} />
            </div>
            <div id="section-community" className="scroll-mt-20">
              <CommunitySection profile={profile} isLoading={loading} />
            </div>
          </div>
        </AnimatedSection>
        <SectionDivider />

        {/* Section 3: Professional */}
        <AnimatedSection>
          <div id="section-professional" className="scroll-mt-20">
            {professionalLocked ? (
              <LockedSectionUpgrade
                message="Upgrade to view professional details"
                messageTa="தொழில் விவரங்களைக் காண மேம்படுத்தவும்"
                isTamil={isTamil}
              />
            ) : (
              <ProfessionalSection profile={profile} isLoading={loading} />
            )}
          </div>
        </AnimatedSection>
        <SectionDivider />

        {/* Section 4: Family */}
        <AnimatedSection>
          <div id="section-family" className="scroll-mt-20">
            {familyLocked ? (
              <LockedSectionUpgrade
                message="Upgrade to view family details"
                messageTa="குடும்ப விவரங்களைக் காண மேம்படுத்தவும்"
                isTamil={isTamil}
              />
            ) : (
              <FamilySection profile={profile} isLoading={loading} />
            )}
          </div>
        </AnimatedSection>
        <SectionDivider />

        {/* Section 5: Assets */}
        <AnimatedSection>
          <div id="section-assets" className="scroll-mt-20">
            <AssetsSection profile={profile} isLoading={loading} />
          </div>
        </AnimatedSection>
        <SectionDivider />

        {/* Section 6: Contact */}
        <AnimatedSection>
          <div id="section-contact" className="scroll-mt-20">
            {contactLocked ? (
              <LockedSectionUpgrade
                message="Upgrade to Platinum to view contact information"
                messageTa="தொடர்பு தகவலைக் காண பிளாட்டினத்திற்கு மேம்படுத்தவும்"
                isTamil={isTamil}
              />
            ) : (
              <ContactSection profile={profile} isLoading={loading} />
            )}
          </div>
        </AnimatedSection>
        <SectionDivider />

        {/* Section 7: Partner Preference */}
        <AnimatedSection>
          <div id="section-partner-preference" className="scroll-mt-20">
            <PartnerPreferenceSection profile={profile} isLoading={loading} />
          </div>
        </AnimatedSection>
        <SectionDivider />

        {/* Section 8: Horoscope */}
        <AnimatedSection>
          <div id="section-horoscope" className="scroll-mt-20">
            {horoscopeLabelsLocked && !isOwner ? (
              <LockedSectionUpgrade
                message="Upgrade to view horoscope details"
                messageTa="ஜாதக விவரங்களைக் காண மேம்படுத்தவும்"
                isTamil={isTamil}
              />
            ) : (
              <HoroscopeSection profile={profile} isLoading={loading} />
            )}
          </div>
        </AnimatedSection>
        {hasUserGalleryContent && (
          <>
            <SectionDivider />

            {/* Section 9: Gallery */}
            <AnimatedSection>
              <div id="section-gallery" className="scroll-mt-20 mb-6">
                {galleryLocked ? (
                  <LockedSectionUpgrade
                    message="Upgrade to view photos"
                    messageTa="புகைப்படங்களைக் காண மேம்படுத்தவும்"
                    isTamil={isTamil}
                  />
                ) : (
                  <GallerySection profile={profile} isLoading={loading} />
                )}
              </div>
            </AnimatedSection>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileView;
