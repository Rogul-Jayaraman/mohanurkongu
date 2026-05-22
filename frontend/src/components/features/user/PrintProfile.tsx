import React from 'react';
import { useTranslation } from 'react-i18next';
import { useProfileUtils } from '@/hooks/useProfileUtils';
import {
    RASI_OPTIONS, NAKSHATRA_OPTIONS, MARITAL_STATUS_OPTIONS,
    BLOOD_GROUP_OPTIONS, HEIGHT_OPTIONS, KULAM_OPTIONS, RESIDENCE_OPTIONS, DOSHAM_OPTIONS
} from '@/constants/index';
import { SouthIndianChart } from '@/components/shared/horoscope';
import type { PlanetData, HoroscopeResult } from '@/types/horoscope';
import { getBilingualValue } from '@/utils/bilingual';
import logo from '@/assets/images/logo.png';
import { getImageUrl } from '@/utils/getImageUrl';
const safeGetImageUrl = (url: string) => getImageUrl(url) ?? '';


/* ---------- Shared helpers ---------- */

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="mb-4 mt-6 first:mt-0">
        <h2 className="text-rosewood text-base font-semibold mb-1">{title}</h2>
        <div className="w-full h-px bg-gold"></div>
    </div>
);

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex items-baseline mb-1">
        <span className="text-gray-500 text-xs font-semibold w-[150px] shrink-0">{label}</span>
        <span className="text-gray-00 mx-1.5 mr-4 font-semibold">:</span>
        <span className="text-xs font-semibold">{value || '-'}</span>
    </div>
);

/* ---------- User section components ---------- */

const BiodataHeader: React.FC<{ isTamil: boolean; profileId: string }> = ({ isTamil, profileId }) => (
    <div className="flex justify-center items-end mb-2">
        <div className="flex items-center gap-3">
            <img src={logo} alt="MK" className="w-[36px] h-[36px] object-contain shrink-0" />
            <div>
                <h1 className="font-heading text-lg font-semibold text-rosewood">
                    {isTamil ? 'மோகனூர் கொங்கு சமுதாய நல அறக்கட்டளை' : 'Mohanur Kongu Samudhaya Nala Arakattalai'}
                </h1>
            </div>
        </div>
    </div>
);

const BiodataBasicDetail: React.FC<{
    name: string; dob: string; age: string; gender: string;
    height: string; weight: string; bloodGroup: string;
    currentLocation: string; isTamil: boolean;
}> = ({ name, dob, age, gender, height, weight, bloodGroup, currentLocation, isTamil }) => (
    <div className="grid grid-cols-2 gap-y-0 mb-[-12px]">
        <DetailItem label={isTamil ? 'பெயர்' : 'Name'} value={name} />
        <DetailItem label={isTamil ? 'பிறந்த தேதி' : 'DOB'} value={dob} />
        <DetailItem label={isTamil ? 'வயது' : 'Age'} value={`${age} yrs`} />
        <DetailItem label={isTamil ? 'பாலினம்' : 'Gender'} value={gender} />
        <DetailItem label={isTamil ? 'உயரம்' : 'Height'} value={height} />
        <DetailItem label={isTamil ? 'எடை' : 'Weight'} value={weight} />
        <DetailItem label={isTamil ? 'இரத்த வகை' : 'Blood Group'} value={bloodGroup} />
        <DetailItem label={isTamil ? 'தற்போதைய இடம்' : 'Current Location'} value={currentLocation} />
    </div>
);

const BiodataPersonalInfo: React.FC<{
    education: string; occupation: string; monthlyIncome: string;
    residence: string; jobLocation: string; nativeLocation: string;
    fatherName: string; motherName: string; fatherJob: string;
    motherJob: string; brothers: number; sisters: number; isTamil: boolean;
}> = ({ education, occupation, monthlyIncome, residence, jobLocation, nativeLocation, fatherName, motherName, fatherJob, motherJob, brothers, sisters, isTamil }) => (
    <>
        <SectionHeader title={isTamil ? 'தனிப்பட்ட தகவல்கள்' : 'Personal Information'} />
        <div className="grid grid-cols-2">
            <DetailItem label={isTamil ? 'கல்வி' : 'Education'} value={education} />
            <DetailItem label={isTamil ? 'தொழில்' : 'Occupation'} value={occupation} />
            <DetailItem label={isTamil ? 'மாத வருமானம்' : 'Monthly Income'} value={monthlyIncome} />
            <DetailItem label={isTamil ? 'இருப்பிட வகை' : 'Residence Type'} value={residence} />
            <DetailItem label={isTamil ? 'பணிபுரியும் இடம்' : 'Job Location'} value={jobLocation} />
            <DetailItem label={isTamil ? 'சொந்த ஊர்' : 'Native Location'} value={nativeLocation} />
            <DetailItem label={isTamil ? 'தந்தை பெயர்' : 'Father Name'} value={fatherName} />
            <DetailItem label={isTamil ? 'தாய் பெயர்' : 'Mother Name'} value={motherName} />
            <DetailItem label={isTamil ? 'தந்தை தொழில்' : 'Father Job'} value={fatherJob} />
            <DetailItem label={isTamil ? 'தாய் தொழில்' : 'Mother Job'} value={motherJob} />
            <DetailItem label={isTamil ? 'சகோதரர்கள்' : 'Brothers'} value={brothers.toString()} />
            <DetailItem label={isTamil ? 'சகோதரிகள்' : 'Sisters'} value={sisters.toString()} />
        </div>
    </>
);

const BiodataCommunity: React.FC<{
    caste: string; kulam: string; community: string;
    kuladeivam: string; isTamil: boolean;
}> = ({ caste, kulam, community, kuladeivam, isTamil }) => (
    <div className="mt-2">
        <SectionHeader title={isTamil ? 'சமுதாய விவரங்கள்' : 'Community Details'} />
        <div className="grid grid-cols-2 mb-4">
            <DetailItem label={isTamil ? 'சாதி' : 'Caste'} value={caste} />
            <DetailItem label={isTamil ? 'குலம்' : 'Kulam'} value={kulam} />
            <DetailItem label={isTamil ? 'சமூகம்' : 'Community'} value={community} />
            <DetailItem label={isTamil ? 'குலதெய்வம்' : 'Kula Deivam'} value={kuladeivam} />
        </div>
    </div>
);

const BiodataJathagam: React.FC<{
    star: string; rasi: string; lagna: string; dosham: string;
    horoscope: any; isTamil: boolean; mode?: string;
    getImageUrl: (url: string) => string;
    parseHoroscopeData: (data: any) => any;
}> = ({ star, rasi, lagna, dosham, horoscope, isTamil, mode, getImageUrl, parseHoroscopeData }) => (
    <div className="mt-[-6px]">
        <SectionHeader title={isTamil ? 'ஜாதக விவரங்கள்' : 'Jathagam Details'} />
        <div className="grid grid-cols-2 mb-4">
            <DetailItem label={isTamil ? 'நட்சத்திரம்' : 'Star'} value={star} />
            <DetailItem label={isTamil ? 'ராசி' : 'Rasi'} value={rasi} />
            <DetailItem label={isTamil ? 'லக்னம்' : 'Lagnam'} value={lagna} />
            <DetailItem label={isTamil ? 'தோஷம்' : 'Dhosam'} value={dosham} />
        </div>

        <div className="grid grid-cols-2 gap-6">
            {mode === 'CREATE' && horoscope?.horoscopeJson ? (
                (() => {
                    const result = parseHoroscopeData(horoscope.horoscopeJson);
                    const d9Planets = result.planets.map((p: PlanetData) => ({...p, signIndex: p.navamsaSignIndex}));
                    return (
                        <>
                            <div className="flex flex-col items-center">
                                <div className="w-full max-w-[280px] chart-container">
                                    <SouthIndianChart lagnaSignIndex={result.lagna.signIndex} planets={result.planets} rotateHouses={true} title={isTamil ? 'ராசி' : 'Rasi'} />
                                </div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-full max-w-[280px] chart-container">
                                    <SouthIndianChart lagnaSignIndex={result.lagnaNavamsa.signIndex} planets={d9Planets} rotateHouses={false} title={isTamil ? 'நவாம்சம்' : 'Navamsa'} />
                                </div>
                            </div>
                        </>
                    );
                })()
            ) : (
                <>
                    <div className="flex flex-col items-center">
                        <div className="w-full max-w-[280px] chart-container">
                            {horoscope?.rasi ? (
                                mode === 'CREATE' ? (
                                    <div className="w-full h-full border border-gray-200 bg-white flex items-center justify-center p-2">
                                        <img
                                            src={getImageUrl(horoscope.rasi as string)}
                                            alt="Rasi Chart"
                                            className="max-w-full max-h-full object-contain grayscale"
                                            crossOrigin="anonymous"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-full border border-gray-200 bg-white flex items-center justify-center p-2">
                                        <img
                                            src={getImageUrl(horoscope.rasi as string)}
                                            alt="Rasi Chart"
                                            className="max-w-full max-h-full object-contain grayscale"
                                            crossOrigin="anonymous"
                                        />
                                    </div>
                                )
                            ) : (
                                <div className="w-full h-full border border-dashed border-gray-200 flex items-center justify-center text-[10px] text-gray-300 uppercase tracking-widest italic">No Data</div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-full max-w-[280px] chart-container">
                            {horoscope?.navamsa ? (
                                mode === 'CREATE' ? (
                                    <div className="w-full h-full border border-gray-200 bg-white flex items-center justify-center p-2">
                                        <img
                                            src={getImageUrl(horoscope.navamsa as string)}
                                            alt="Navamsa Chart"
                                            className="max-w-full max-h-full object-contain grayscale"
                                            crossOrigin="anonymous"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-full border border-gray-200 bg-white flex items-center justify-center p-2">
                                        <img
                                            src={getImageUrl(horoscope.navamsa as string)}
                                            alt="Navamsa Chart"
                                            className="max-w-full max-h-full object-contain grayscale"
                                            crossOrigin="anonymous"
                                        />
                                    </div>
                                )
                            ) : (
                                <div className="w-full h-full border border-dashed border-gray-200 flex items-center justify-center text-[10px] text-gray-300 uppercase tracking-widest italic">No Data</div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    </div>
);

const BiodataFooter: React.FC = () => (
    <div className="mt-6 border-t-[1.5px] border-gold flex justify-between items-center text-gray-600">
        <p className="text-[8px]">Printed via Mohanur Kongu Manamaalai</p>
        <p className="text-[8px]">{new Date().toLocaleDateString()}</p>
    </div>
);

/* ---------- Main Component ---------- */

const PrintProfile: React.FC<{ profile: any }> = ({ profile }) => {
    const { t, i18n } = useTranslation(['profile_new', 'common']);
    const { getEnumLabel, getLocationLabel, formatSalary } = useProfileUtils();
    const isTamil = i18n.language === 'ta';

    const parseHoroscopeData = (data: any) => {
        if (!data) return null;
        if (typeof data === 'object') return data;
        if (typeof data === 'string') {
            try { return JSON.parse(data); } catch { return null; }
        }
        return data;
    };

    const name = !isTamil ? [profile.firstNameTa, profile.lastNameTa].filter(Boolean).join(' ') || [profile.firstNameEn, profile.lastNameEn].filter(Boolean).join(' ') : [profile.firstNameEn, profile.lastNameEn].filter(Boolean).join(' ') || [profile.firstNameTa, profile.lastNameTa].filter(Boolean).join(' ');
    const age = profile.dob ? `${new Date().getFullYear() - new Date(profile.dob).getFullYear()}` : '-';
    const dob = profile.dob ? new Date(profile.dob).toLocaleDateString(isTamil ? 'ta-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
    const gender = profile.gender ? (isTamil ? (profile.gender === 'MALE' ? 'ஆண்' : 'பெண்') : (profile.gender === 'MALE' ? 'Male' : 'Female')) : '-';
    const height = profile.height ? getEnumLabel(profile.height.toString(), HEIGHT_OPTIONS) : '-';
    const weight = profile.weight ? `${profile.weight} kg` : '-';
    const bloodGroup = profile.bloodGroup ? getEnumLabel(profile.bloodGroup, BLOOD_GROUP_OPTIONS) : '-';
    const currentLocation = getLocationLabel(profile.currentDistrictEn || profile.currentDistrict, profile.currentTaluk || profile.currentCityEn, profile.currentDistrictTa, profile.currentTalukTa, profile.currentCityEn, profile.currentStateEn, profile.currentCountryEn, profile.currentCityTa, profile.currentStateTa, profile.currentCountryTa) || '-';

    const education = (isTamil ? (profile.educationTa || profile.education) : profile.education) || '-';
    const occupation = (isTamil ? (profile.jobDetailTa || profile.jobDetail) : profile.jobDetail) || '-';
    const income = formatSalary(profile.salaryMonthly);
    const jobLocation = (isTamil ? (profile.jobLocationTa || profile.jobLocationEn) : profile.jobLocationEn) || '-';
    const nativeLocation = getLocationLabel(profile.nativeDistrictEn || profile.nativeDistrict, profile.nativeTaluk || undefined, profile.nativeDistrictTa, profile.nativeTalukTa) || '-';
    const residence = profile.residence ? getEnumLabel(profile.residence, RESIDENCE_OPTIONS) : '-';

    const lateSuffix = isTamil ? ` (${t('common:is_late', { defaultValue: 'மறைவு' })})` : ' (Late)';
    const fatherNameRaw = (isTamil ? (profile.fatherNameTa || profile.fatherNameEn) : profile.fatherNameEn) || '-';
    const fatherName = profile.fatherIsLate ? `${fatherNameRaw}${lateSuffix}` : fatherNameRaw;
    const fatherJob = (isTamil ? (profile.fatherJobTa || profile.fatherJob) : profile.fatherJob) || '-';
    const motherNameRaw = (isTamil ? (profile.motherNameTa || profile.motherNameEn) : profile.motherNameEn) || '-';
    const motherName = profile.motherIsLate ? `${motherNameRaw}${lateSuffix}` : motherNameRaw;
    const motherJob = (isTamil ? (profile.motherJobTa || profile.motherJob) : profile.motherJob) || '-';
    const brothers = profile.noOfBrothers ?? 0;
    const sisters = profile.noOfSisters ?? 0;

    const community = (isTamil ? (profile.communityTa || profile.community) : profile.community) || (isTamil ? 'கொங்கு வேளாளர்' : 'Kongu Vellalar');
    const caste = (isTamil ? (profile.casteTa || profile.caste) : profile.caste) || '-';
    const kulam = profile.kulam ? getEnumLabel(profile.kulam, KULAM_OPTIONS) : '-';
    const kuladeivam = (isTamil ? (profile.kuladeivamTa || profile.kuladeivamEn) : profile.kuladeivamEn) || '-';

    const lang = i18n.language as 'en' | 'ta';
    const star = profile.star ? getBilingualValue(NAKSHATRA_OPTIONS, profile.star, lang) : '-';
    const rasiComputed = profile.rasi ? getBilingualValue(RASI_OPTIONS, profile.rasi, lang) : '-';
    const lagna = profile.laganam ? getBilingualValue(RASI_OPTIONS, profile.laganam, lang) : '-';
    const dosham = profile.dosham ? getEnumLabel(profile.dosham, DOSHAM_OPTIONS) : '-';

    return (
        <div id="biodata-print-canvas" className="min-h-screen font-sans text-gray-900 p-6 flex justify-center items-start bg-white">
            <div className="w-[794px] min-h-[1123px] bg-white p-8 box-border flex flex-col relative overflow-hidden">

                <BiodataHeader isTamil={isTamil} profileId={profile.profileId || profile.id?.slice(-4).toUpperCase()} />

                <div className='w-full h-[1.5px] bg-gold mb-2'></div>

                <BiodataBasicDetail
                    name={name} dob={dob} age={age} gender={gender}
                    height={height} weight={weight} bloodGroup={bloodGroup}
                    currentLocation={currentLocation} isTamil={isTamil}
                />

                <BiodataPersonalInfo
                    education={education} occupation={occupation}
                    monthlyIncome={income} residence={residence}
                    jobLocation={jobLocation} nativeLocation={nativeLocation}
                    fatherName={fatherName} motherName={motherName}
                    fatherJob={fatherJob} motherJob={motherJob}
                    brothers={brothers} sisters={sisters} isTamil={isTamil}
                />

                <BiodataCommunity
                    caste={caste} kulam={kulam}
                    community={community} kuladeivam={kuladeivam}
                    isTamil={isTamil}
                />

                <BiodataJathagam
                    star={star} rasi={rasiComputed} lagna={lagna} dosham={dosham}
                    horoscope={profile.horoscope} isTamil={isTamil}
                    mode={profile.horoscope?.mode}
                     getImageUrl={safeGetImageUrl}
                    parseHoroscopeData={parseHoroscopeData}
                />

                <BiodataFooter />
            </div>

            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 20px; }
                    html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
                    #biodata-print-canvas { background: white !important; padding: 0 !important; margin: 0 !important; width: 100% !important; height: auto !important; }
                    #biodata-print-canvas > div { width: 100%  !important; margin: 0 !important; padding: 0 !important; min-height: auto !important; height: auto !important; box-shadow: none !important; border: none !important; background: white !important; }
                    .font-serif { font-family: 'Playfair Display', 'Georgia', serif !important; }
                }
                .chart-container > div { width: 100% !important; height: 100% !important; display: flex !important; flex-direction: column !important; }
                .chart-container > div > div { width: 100% !important; height: 100% !important; }
                .chart-container svg { width: 100% !important; height: 100% !important; display: block !important; }
            `}</style>
        </div>
    );
};

export default PrintProfile;

export const JathagamPrintView: React.FC<{ profile: any }> = ({ profile }) => {
    const { i18n } = useTranslation(['profile_new', 'common']);
    const { getEnumLabel, getLocationLabel } = useProfileUtils();
    const isTamil = i18n.language === 'ta';

    const name = !isTamil ? [profile.firstNameTa, profile.lastNameTa].filter(Boolean).join(' ') || [profile.firstNameEn, profile.lastNameEn].filter(Boolean).join(' ') : [profile.firstNameEn, profile.lastNameEn].filter(Boolean).join(' ') || [profile.firstNameTa, profile.lastNameTa].filter(Boolean).join(' ');
    const age = profile.dob ? `${new Date().getFullYear() - new Date(profile.dob).getFullYear()}` : '-';
    const dob = profile.dob ? new Date(profile.dob).toLocaleDateString(isTamil ? 'ta-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
    const gender = profile.gender ? (isTamil ? (profile.gender === 'MALE' ? 'ஆண்' : 'பெண்') : (profile.gender === 'MALE' ? 'Male' : 'Female')) : '-';
    const height = profile.height ? getEnumLabel(profile.height.toString(), HEIGHT_OPTIONS) : '-';
    const weight = profile.weight ? `${profile.weight} kg` : '-';
    const bloodGroup = profile.bloodGroup ? getEnumLabel(profile.bloodGroup, BLOOD_GROUP_OPTIONS) : '-';
    const currentLocation = getLocationLabel(profile.currentDistrictEn || profile.currentDistrict, profile.currentTaluk || profile.currentCityEn, profile.currentDistrictTa, profile.currentTalukTa, profile.currentCityEn, profile.currentStateEn, profile.currentCountryEn, profile.currentCityTa, profile.currentStateTa, profile.currentCountryTa) || '-';

    const star = profile.star ? getEnumLabel(profile.star, NAKSHATRA_OPTIONS) : '-';
    const rasiComputed = profile.rasi ? getEnumLabel(profile.rasi, RASI_OPTIONS) : '-';
    const lagna = profile.laganam ? getEnumLabel(profile.laganam, RASI_OPTIONS) : '-';
    const dosham = profile.dosham ? getEnumLabel(profile.dosham, DOSHAM_OPTIONS) : '-';

    const getImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
        return `${base}${url.startsWith('/') ? url : '/' + url}`;
    };

    const parseHoroscopeData = (data: any) => {
        if (!data) return null;
        if (typeof data === 'object') return data;
        if (typeof data === 'string') {
            try { return JSON.parse(data); } catch { return null; }
        }
        return data;
    };

    return (
        <div id="jathagam-print-layout" className="min-h-screen font-sans text-gray-900 p-6 flex justify-center items-start bg-white">
            <div className="w-[794px] min-h-[1123px] bg-white p-8 box-border flex flex-col relative overflow-hidden">

                <BiodataHeader isTamil={isTamil} profileId={profile.profileId || profile.id?.slice(-4).toUpperCase()} />

                <div className='w-full h-[1.5px] bg-gold mb-2'></div>

                <BiodataBasicDetail
                    name={name} dob={dob} age={age} gender={gender}
                    height={height} weight={weight} bloodGroup={bloodGroup}
                    currentLocation={currentLocation} isTamil={isTamil}
                />
<div className='w-full h-[1.5px] my-4'></div>
                <BiodataJathagam
                    star={star} rasi={rasiComputed} lagna={lagna} dosham={dosham}
                    horoscope={profile.horoscope} isTamil={isTamil}
                    mode={profile.horoscope?.mode}
                     getImageUrl={safeGetImageUrl}
                    parseHoroscopeData={parseHoroscopeData}
                />

                <BiodataFooter />
            </div>

            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 20px; }
                    html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
                    #jathagam-print-layout { display: block !important; background: white !important; padding: 0 !important; margin: 0 !important; width: 100% !important; height: auto !important; }
                    #jathagam-print-layout > div { width: 100%  !important; margin: 0 !important; padding: 0 !important; min-height: auto !important; height: auto !important; box-shadow: none !important; border: none !important; background: white !important; }
                    .font-serif { font-family: 'Playfair Display', 'Georgia', serif !important; }
                }
                .chart-container > div { width: 100% !important; height: 100% !important; display: flex !important; flex-direction: column !important; }
                .chart-container > div > div { width: 100% !important; height: 100% !important; }
                .chart-container svg { width: 100% !important; height: 100% !important; display: block !important; }
            `}</style>
        </div>
    );
};
