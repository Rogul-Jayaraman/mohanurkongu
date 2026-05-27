import React from 'react';
import { useTranslation } from 'react-i18next';
import { useProfileUtils } from '@/hooks/useProfileUtils';
import { SouthIndianChart } from '@/components/shared/horoscope';
import type { PlanetData, HoroscopeResult } from '@/types/horoscope';
import { getBilingualValue } from '@/utils/bilingual';
import {
    RASI_OPTIONS, NAKSHATRA_OPTIONS, DIET_OPTIONS, MARITAL_STATUS_OPTIONS,
    COMPLEXION_OPTIONS, BLOOD_GROUP_OPTIONS,
    HEIGHT_OPTIONS, KULAM_OPTIONS, RESIDENCE_OPTIONS, DOSHAM_OPTIONS
} from '@/constants/index';
import logo from '@/assets/images/logo.png';
const getImageUrl = (url: string | null | undefined): string | null => { if (!url || typeof url !== 'string') return null; if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url; if (url.startsWith('/media/')) { const b = import.meta.env.VITE_API_URL || 'http://localhost:4000'; return `${b}${url}`; } return null; };

/* ---------- Shared helpers ---------- */

const DataRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex items-baseline py-1 border-b border-gray-200 last:border-b-0">
        <span className="text-gray-500 text-[10px] uppercase font-semibold tracking-wider w-[130px] shrink-0">{label}</span>
        <span className="text-gray-400 mx-1.5">:</span>
        <span className="text-gray-800 text-[11px] font-medium">{value || '-'}</span>
    </div>
);

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
    <div className="mb-3 pb-1.5 border-b border-gray-300">
        <h2 className="text-gray-700 text-[12px] font-bold uppercase tracking-[0.15em]">{title}</h2>
    </div>
);

const JDataRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex py-1 border-b border-gray-200 last:border-0 items-baseline">
        <span className="w-[90px] text-[8px] uppercase font-semibold tracking-wider text-gray-500 whitespace-nowrap">{label}</span>
        <span className="text-gray-400 mx-1">:</span>
        <span className="text-[10px] font-medium text-gray-800">{value || '-'}</span>
    </div>
);

/* ---------- Admin section components ---------- */

const PrintHeader: React.FC<{ name: string; regNo: string; location: string; isTamil: boolean }> = ({ name, regNo, location, isTamil }) => (
    <header className="pb-3 mb-4 border-b border-gray-400">
        <div className="flex justify-between items-end">
            <div className="flex items-end gap-3">
                <img src={logo} alt="MK" className="w-[40px] h-[40px] object-contain shrink-0" />
                <div>
                    <h1 className="font-heading text-lg font-semibold text-gray-900">
                    {isTamil ? 'மோகனூர் கொங்கு சமுதாய நல அறக்கட்டளை' : 'Mohanur Kongu Samudhaya Nala Arakattalai'}
                </h1>
                </div>
            </div>
            <div className="text-right">
<h1 className="font-serif text-2xl text-gray-900 leading-tight font-bold">{name}</h1>
            </div>
        </div>
    </header>
);

const PrintBasicDetail: React.FC<{ profile: any; isTamil: boolean; age: string; profilePhotoUrl: string; name: string; maritalStatus: string; height: string; weight: string; bloodGroup: string; currentLocation: string; gender: string; dob: string }> = ({ isTamil, age, profilePhotoUrl, name, maritalStatus, height, weight, bloodGroup, currentLocation, gender, dob }) => (
    <div className="col-span-12 grid grid-cols-12 gap-4 p-4 border border-gray-200">
        <div className="col-span-8 flex flex-col justify-center">
            <SectionTitle title={isTamil ? 'அடிப்படை விவரங்கள்' : 'Basic Detail'} />
            <div>
                <DataRow label={isTamil ? 'பிறந்த தேதி' : 'DOB'} value={dob} />
                <DataRow label={isTamil ? 'வயது' : 'Age'} value={`${age} ${isTamil ? 'வயது' : 'Years'}`} />
                <DataRow label={isTamil ? 'பாலினம்' : 'Gender'} value={gender} />
                <DataRow label={isTamil ? 'திருமண நிலை' : 'Marital Status'} value={maritalStatus} />
                <DataRow label={isTamil ? 'உயரம்' : 'Height'} value={height} />
                <DataRow label={isTamil ? 'எடை' : 'Weight'} value={weight} />
                <DataRow label={isTamil ? 'இரத்த வகை' : 'Blood Group'} value={bloodGroup} />
                <DataRow label={isTamil ? 'தற்போதைய இடம்' : 'Current Location'} value={currentLocation} />
            </div>
        </div>
        <div className="col-span-4 flex justify-end items-start">
            <div className="w-40 border border-gray-200 p-0.5 bg-white">
                {profilePhotoUrl ? (
                    <img src={profilePhotoUrl} alt={name} className="w-full h-52 object-cover" />
                ) : (
                    <div className="w-full h-52 bg-gray-50 flex items-center justify-center">
                        <span className="text-gray-300 text-3xl font-serif font-bold">{name?.charAt(0)}</span>
                    </div>
                )}
            </div>
        </div>
    </div>
);

const PrintPersonalInfo: React.FC<{
    isTamil: boolean;
    education: string; monthlyIncome: string; nativeLocation: string;
    fatherName: string; fatherJob: string; brothers: number;
    occupation: string; jobLocation: string; residence: string;
    motherName: string; motherJob: string; sisters: number;
}> = ({ isTamil, education, monthlyIncome, nativeLocation, fatherName, fatherJob, brothers, occupation, jobLocation, residence, motherName, motherJob, sisters }) => (
    <div className="col-span-12 p-4 border border-gray-200">
        <SectionTitle title={isTamil ? 'தனிப்பட்ட தகவல்கள்' : 'Personal Information'} />
        <div className="grid grid-cols-2 gap-x-6">
            <div>
                <DataRow label={isTamil ? 'கல்வி' : 'Education'} value={education} />
                <DataRow label={isTamil ? 'மாத வருமானம்' : 'Monthly Income'} value={monthlyIncome} />
                <DataRow label={isTamil ? 'சொந்த ஊர்' : 'Native Location'} value={nativeLocation} />
                <DataRow label={isTamil ? 'தந்தை பெயர்' : 'Father Name'} value={fatherName} />
                <DataRow label={isTamil ? 'தந்தை தொழில்' : 'Father Job'} value={fatherJob} />
                <DataRow label={isTamil ? 'சகோதரர்கள்' : 'Brothers'} value={brothers.toString()} />
            </div>
            <div>
                <DataRow label={isTamil ? 'தொழில்' : 'Occupation'} value={occupation} />
                <DataRow label={isTamil ? 'பணிபுரியும் இடம்' : 'Job Location'} value={jobLocation} />
                <DataRow label={isTamil ? 'இருப்பிட வகை' : 'Residence Type'} value={residence} />
                <DataRow label={isTamil ? 'தாய் பெயர்' : 'Mother Name'} value={motherName} />
                <DataRow label={isTamil ? 'தாய் தொழில்' : 'Mother Job'} value={motherJob} />
                <DataRow label={isTamil ? 'சகோதரிகள்' : 'Sisters'} value={sisters.toString()} />
            </div>
        </div>
    </div>
);

const PrintCommunityDetails: React.FC<{
    isTamil: boolean;
    caste: string; kulam: string;
    community: string; kuladeivam: string;
}> = ({ isTamil, caste, kulam, community, kuladeivam }) => (
    <div className="col-span-12 p-4 border border-gray-200">
        <SectionTitle title={isTamil ? 'சமுதாய விவரங்கள்' : 'Community Details'} />
        <div className="grid grid-cols-2 gap-x-6">
            <div>
                <DataRow label={isTamil ? 'சாதி' : 'Caste'} value={caste} />
                <DataRow label={isTamil ? 'குலம்' : 'Kulam'} value={kulam} />
            </div>
            <div>
                <DataRow label={isTamil ? 'சமூகம்' : 'Community'} value={community} />
                <DataRow label={isTamil ? 'குலதெய்வம்' : 'Kula Deivam'} value={kuladeivam} />
            </div>
        </div>
    </div>
);

const PrintJathagamBrief: React.FC<{ isTamil: boolean; star: string; rasi: string; lagna: string; dosham: string }> = ({ isTamil, star, rasi, lagna, dosham }) => (
    <div className="col-span-12 p-4 border border-gray-200 mb-1">
        <SectionTitle title={isTamil ? 'ஜாதக விவரங்கள்' : 'Jathagam Details'} />
        <div className="grid grid-cols-2 gap-2">
            <DataRow label={isTamil ? 'நட்சத்திரம்' : 'Star'} value={star} />
            <DataRow label={isTamil ? 'ராசி' : 'Rasi'} value={rasi} />
            <DataRow label={isTamil ? 'லக்னம்' : 'Lagnam'} value={lagna} />
            <DataRow label={isTamil ? 'தோஷம்' : 'Dhosam'} value={dosham} />
        </div>
    </div>
);

const PrintHoroscopeCharts: React.FC<{ profile: any; isTamil: boolean }> = ({ profile, isTamil }) => {
    const hasCharts = profile?.horoscope && (profile.horoscope.rasi || profile.horoscope.navamsa);

    if (!hasCharts) {
        return (
            <div className="col-span-12 p-4 border border-gray-200">
                <p className="text-sm text-gray-400 italic text-center py-6">{isTamil ? 'ஜாதக கட்டங்கள் வழங்கப்படவில்லை' : 'Horoscope charts not provided'}</p>
            </div>
        );
    }

    const chart = (type: 'rasi' | 'navamsa') => {
        const data = profile.horoscope[type];
        if (!data) return null;
        const label = type === 'rasi'
            ? (isTamil ? 'ராசி' : 'RASI')
            : (isTamil ? 'நவாம்சம்' : 'NAVAMSA');
        const hJson = profile.horoscope?.horoscopeJson;
        if (profile.horoscope?.mode === 'GENERATED' && hJson) {
            const parsed = typeof hJson === 'string' ? JSON.parse(hJson) : hJson as HoroscopeResult;
            const d9Planets = parsed.planets.map((p: PlanetData) => ({...p, signIndex: p.navamsaSignIndex}));
            const isRasi = type === 'rasi';
            return (
                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold text-gray-500 mb-2 uppercase tracking-[.3em]">{label}</span>
                    <div className="w-[260px] h-[260px] bg-white border border-gray-200 print-chart-box">
                        <SouthIndianChart lagnaSignIndex={parsed.lagna.signIndex} planets={isRasi ? parsed.planets : d9Planets} rotateHouses={isRasi} />
                    </div>
                </div>
            );
        }
        return (
            <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold text-gray-500 mb-2 uppercase tracking-[.3em]">{label}</span>
                <img
                    src={getImageUrl(data?.url || data) || ''}
                    alt={label}
                    className="w-[260px] h-[260px] object-contain border border-gray-200 bg-white"
                />
            </div>
        );
    };

    return (
        <div className="col-span-12 p-4 border border-gray-200">
            <div className="flex justify-center items-center gap-6">
                {chart('rasi')}
                {chart('navamsa')}
            </div>
        </div>
    );
};

const PrintAssets: React.FC<{ isTamil: boolean; residence: string; vehicle: string; land: string; otherAssets: string }> = ({ isTamil, residence, vehicle, land, otherAssets }) => (
    <div className="col-span-6 p-4 border border-gray-200">
        <SectionTitle title={isTamil ? 'சொத்துக்கள்' : 'Assets'} />
        <DataRow label={isTamil ? 'இருப்பிடம்' : 'Residence'} value={residence} />
        <DataRow label={isTamil ? 'வாகனம்' : 'Vehicle'} value={vehicle || '-'} />
        <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-[9px] uppercase font-semibold tracking-wider text-gray-500 mb-1">{isTamil ? 'நிலம்/சொத்து' : 'Land / Other Assets'}</p>
            <p className="text-[11px] leading-relaxed text-gray-700">{(land || otherAssets) ? [land, otherAssets].filter(Boolean).join(', ') : (isTamil ? 'குறிப்பிடப்படவில்லை' : 'Not specified')}</p>
        </div>
    </div>
);

const PrintExpectations: React.FC<{ isTamil: boolean; expectations: string }> = ({ isTamil, expectations }) => (
    <div className="col-span-6 p-4 border border-gray-200">
        <SectionTitle title={isTamil ? 'எதிர்பார்ப்புகள்' : 'Expectations'} />
        <p className="text-[11px] font-medium leading-relaxed text-gray-700">
            {expectations || (isTamil ? 'குறிப்பிடப்படவில்லை' : 'Not specified')}
        </p>
    </div>
);

const PrintFooter: React.FC<{ regNo: string; isTamil: boolean }> = ({ regNo, isTamil }) => (
    <footer className="mt-4 pt-3 border-t border-gray-300">
        <div className="flex justify-between items-center text-gray-500">
            <div>
                <p className="text-[8px] uppercase tracking-[0.2em] font-bold">{isTamil ? 'மோகனூர் கொங்கு மணமாலை' : 'MOHANUR KONGU MANAMAALAI'}</p>
                <p className="text-[7px] mt-0.5">{isTamil ? 'திருமண நோக்கத்திற்காக மட்டுமே' : 'For private matrimonial purposes only'}</p>
            </div>
            <div className="text-right">
                <p className="text-[8px] font-semibold uppercase tracking-wider">Printed: {new Date().toLocaleDateString(isTamil ? 'ta-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                <p className="text-[7px] mt-0.5">Ref: {regNo || 'PENDING'}</p>
            </div>
        </div>
    </footer>
);

/* ---------- Main Component ---------- */

const PrintProfile: React.FC<{ profile: any }> = ({ profile }) => {
    const { t, i18n } = useTranslation(['profile_new', 'common']);
    const { getEnumLabel, getLocationLabel, formatSalary } = useProfileUtils();

    const isTamil = i18n.language === 'ta';

    const name = isTamil ? ([profile.firstNameTa, profile.lastNameTa].filter(Boolean).join(' ') || [profile.firstNameEn, profile.lastNameEn].filter(Boolean).join(' ')) : ([profile.firstNameEn, profile.lastNameEn].filter(Boolean).join(' ') || [profile.firstNameTa, profile.lastNameTa].filter(Boolean).join(' '));
    const age = profile.dob ? new Date().getFullYear() - new Date(profile.dob).getFullYear() : '';
    const dob = profile.dob ? new Date(profile.dob).toLocaleDateString(isTamil ? 'ta-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
    const gender = profile.gender ? (isTamil ? (profile.gender === 'MALE' ? 'ஆண்' : 'பெண்') : (profile.gender === 'MALE' ? 'Male' : 'Female')) : '-';

    const education = (isTamil ? (profile.educationTa || profile.education) : profile.education) || '-';
    const jobDetail = (isTamil ? (profile.jobDetailTa || profile.jobDetail) : profile.jobDetail) || '-';
    const jobLocation = (isTamil ? (profile.jobLocationTa || profile.jobLocationEn) : profile.jobLocationEn) || '-';
    const income = formatSalary(profile.salaryMonthly);
    const residence = profile.residence ? getEnumLabel(profile.residence, RESIDENCE_OPTIONS) : '-';

    const getCommunityLabel = () => {
        const comm = (isTamil ? (profile.communityTa || profile.community) : profile.community) || 'Kongu Vellalar';
        if (isTamil && (comm === 'Kongu Vellalar' || comm.includes('கொங்கு'))) return 'கொங்கு வேளாளர்';
        return comm;
    };
    const community = getCommunityLabel();
    const caste = (isTamil ? (profile.casteTa || profile.caste) : profile.caste) || '-';
    const kulam = profile.kulam ? getEnumLabel(profile.kulam, KULAM_OPTIONS) : '-';
    const kuladeivam = (isTamil ? (profile.kuladeivamTa || profile.kuladeivamEn) : profile.kuladeivamEn) || '-';
    const nativeLocation = getLocationLabel(profile.nativeDistrictEn || profile.nativeDistrict, profile.nativeTaluk || undefined, profile.nativeDistrictTa, profile.nativeTalukTa) || '-';

    const lateSuffix = isTamil ? ` (${t('common:is_late', { defaultValue: 'மறைவு' })})` : ' (Is Late)';
    const fatherNameRaw = (isTamil ? (profile.fatherNameTa || profile.fatherNameEn) : profile.fatherNameEn) || '-';
    const fatherName = profile.fatherIsLate ? `${fatherNameRaw}${lateSuffix}` : fatherNameRaw;
    const fatherJob = (isTamil ? (profile.fatherJobTa || profile.fatherJob) : profile.fatherJob) || '-';
    const motherNameRaw = (isTamil ? (profile.motherNameTa || profile.motherNameEn) : profile.motherNameEn) || '-';
    const motherName = profile.motherIsLate ? `${motherNameRaw}${lateSuffix}` : motherNameRaw;
    const motherJob = (isTamil ? (profile.motherJobTa || profile.motherJob) : profile.motherJob) || '-';
    const brothers = profile.noOfBrothers ?? 0;
    const sisters = profile.noOfSisters ?? 0;

    const lang = i18n.language as 'en' | 'ta';
    const star = profile.star ? getBilingualValue(NAKSHATRA_OPTIONS, profile.star, lang) : '-';
    const rasi = profile.rasi ? getBilingualValue(RASI_OPTIONS, profile.rasi, lang) : '-';
    const lagna = profile.lagnam ? getBilingualValue(RASI_OPTIONS, profile.lagnam, lang) : '-';
    const dosham = profile.dosham ? getEnumLabel(profile.dosham, DOSHAM_OPTIONS) : '-';

    const vehicle = profile?.vehicle || '';
    const land = isTamil ? (profile.landTa || profile.landEn) : profile.landEn;
    const otherAssets = isTamil ? (profile.otherAssetsTa || profile.otherAssetsEn) : profile.otherAssetsEn;
    const expectationNote = isTamil ? (profile.expectationNoteTa || profile.expectationNoteEn) : profile.expectationNoteEn;

    const maritalStatus = profile.maritalStatus ? getEnumLabel(profile.maritalStatus, MARITAL_STATUS_OPTIONS) : '-';
    const height = profile.height ? getEnumLabel(profile.height.toString(), HEIGHT_OPTIONS) : '-';
    const weight = profile.weight ? `${profile.weight} kg` : '-';
    const bloodGroup = profile.bloodGroup ? getEnumLabel(profile.bloodGroup, BLOOD_GROUP_OPTIONS) : '-';

    const currentLocation = getLocationLabel(profile.currentDistrictEn || profile.currentDistrict, profile.currentTaluk || profile.currentCityEn, profile.currentDistrictTa, profile.currentTalukTa, profile.currentCityEn, profile.currentStateEn, profile.currentCountryEn, profile.currentCityTa, profile.currentStateTa, profile.currentCountryTa);

    const profilePhotoUrl = profile.profilePhoto
      ? (typeof profile.profilePhoto === 'object' && profile.profilePhoto?.url
          ? getImageUrl(profile.profilePhoto.url)
          : getImageUrl(profile.profilePhoto as string)) || ''
      : '';

    return (
        <div id="premium-print-layout" className="hidden-print-container bg-white min-h-screen flex flex-col text-gray-900 overflow-visible relative font-sans">
            <div className="max-w-[210mm] mx-auto w-full p-4">
                <PrintHeader name={name} regNo={profile.regNo} location={currentLocation} isTamil={isTamil} />

                <main className="w-full grid grid-cols-12 gap-3 flex-1">
                    <PrintBasicDetail
                        profile={profile}
                        isTamil={isTamil}
                        age={age.toString()}
                        profilePhotoUrl={profilePhotoUrl}
                        name={name}
                        maritalStatus={maritalStatus}
                        height={height}
                        weight={weight}
                        bloodGroup={bloodGroup}
                        currentLocation={currentLocation}
                        gender={gender}
                        dob={dob}
                    />

                    <PrintPersonalInfo
                        isTamil={isTamil}
                        education={education}
                        monthlyIncome={income}
                        nativeLocation={nativeLocation}
                        fatherName={fatherName}
                        fatherJob={fatherJob}
                        brothers={brothers}
                        occupation={jobDetail}
                        jobLocation={jobLocation}
                        residence={residence}
                        motherName={motherName}
                        motherJob={motherJob}
                        sisters={sisters}
                    />

                    <PrintCommunityDetails
                        isTamil={isTamil}
                        caste={caste}
                        kulam={kulam}
                        community={community}
                        kuladeivam={kuladeivam}
                    />

                    <PrintJathagamBrief
                        isTamil={isTamil}
                        star={star}
                        rasi={rasi}
                        lagna={lagna}
                        dosham={dosham}
                    />
                    <PrintHoroscopeCharts profile={profile} isTamil={isTamil} />

                    <div className="col-span-12 grid grid-cols-2 gap-3">
                        <PrintAssets isTamil={isTamil} residence={residence} vehicle={vehicle} land={land || ''} otherAssets={otherAssets || ''} />
                        <PrintExpectations isTamil={isTamil} expectations={expectationNote} />
                    </div>
                </main>

                <PrintFooter regNo={profile.regNo} isTamil={isTamil} />
            </div>

            <style>{`
                @media screen { .hidden-print-container { display: none; } }
                @media print {
                    @page { size: A4; margin: 10mm; }
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .hidden-print-container { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; height: auto !important; min-height: 0 !important; }
                    .hidden-print-container > div { padding: 0 !important; }
                    * { -webkit-print-color-adjust: exact; overflow: visible !important; }
                    .print-chart-box { display: flex !important; align-items: center !important; justify-content: center !important; }
                    .print-chart-box > div { width: 100% !important; height: 100% !important; display: flex !important; flex-direction: column !important; }
                    .print-chart-box svg { width: 100% !important; height: 100% !important; display: block !important; }
                }
            `}</style>
        </div>
    );
};

export default PrintProfile;

/* ---------- JathagamPrintView ---------- */

export const JathagamPrintView: React.FC<{ profile: any }> = ({ profile }) => {
    const { t, i18n } = useTranslation(['profile_new', 'common']);
    const { getEnumLabel, getLocationLabel } = useProfileUtils();

    const isTamil = i18n.language === 'ta';

    const name = isTamil ? ([profile.firstNameTa, profile.lastNameTa].filter(Boolean).join(' ') || [profile.firstNameEn, profile.lastNameEn].filter(Boolean).join(' ')) : ([profile.firstNameEn, profile.lastNameEn].filter(Boolean).join(' ') || [profile.firstNameTa, profile.lastNameTa].filter(Boolean).join(' '));
    const regNo = profile.regNo || 'PENDING';

    const dob = profile.dob ? new Date(profile.dob).toLocaleDateString(isTamil ? 'ta-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
    const age = profile.dob ? `${new Date().getFullYear() - new Date(profile.dob).getFullYear()} ${isTamil ? 'வயது' : 'Yrs'}` : '-';
    const gender = profile.gender ? (isTamil ? (profile.gender === 'MALE' ? 'ஆண்' : 'பெண்') : (profile.gender === 'MALE' ? 'Male' : 'Female')) : '-';
    const maritalStatus = profile.maritalStatus ? getEnumLabel(profile.maritalStatus, MARITAL_STATUS_OPTIONS) : '-';
    const height = profile.height ? getEnumLabel(profile.height.toString(), HEIGHT_OPTIONS) : '-';
    const diet = profile.diet ? getEnumLabel(profile.diet, DIET_OPTIONS) : '-';
    const complexion = profile.complexion ? getEnumLabel(profile.complexion, COMPLEXION_OPTIONS) : '-';
    const bloodGroup = profile.bloodGroup ? getEnumLabel(profile.bloodGroup, BLOOD_GROUP_OPTIONS) : '-';

    const lang = i18n.language as 'en' | 'ta';
    const star = profile.star ? getBilingualValue(NAKSHATRA_OPTIONS, profile.star, lang) : '-';
    const rasi = profile.rasi ? getBilingualValue(RASI_OPTIONS, profile.rasi, lang) : '-';
    const lagna = profile.lagnam ? getBilingualValue(RASI_OPTIONS, profile.lagnam, lang) : '-';
    const dosham = profile.dosham ? getEnumLabel(profile.dosham, DOSHAM_OPTIONS) : '-';
    const birthTime = profile.birthTime || '-';
    const kuladeivam = (isTamil ? (profile.kuladeivamTa || profile.kuladeivamEn) : profile.kuladeivamEn) || '-';
    const birthPlace = (isTamil ? (profile.birthPlaceTa || profile.birthPlaceEn) : profile.birthPlaceEn) || '-';
    const nativeLocation = getLocationLabel(profile.nativeDistrictEn || profile.nativeDistrict, profile.nativeTaluk || undefined, profile.nativeDistrictTa, profile.nativeTalukTa) || '-';

    const currentLocation = getLocationLabel(profile.currentDistrictEn || profile.currentDistrict, profile.currentTaluk || profile.currentCityEn, profile.currentDistrictTa, profile.currentTalukTa, profile.currentCityEn, profile.currentStateEn, profile.currentCountryEn, profile.currentCityTa, profile.currentStateTa, profile.currentCountryTa);

    return (
        <div className="hidden-jathagam-container bg-white min-h-screen">
            <div className="max-w-[210mm] mx-auto p-3">
                <div className="pb-2 mb-3 border-b border-gray-300">
                    <div className="flex justify-between items-end">
                        <div className="flex items-end gap-3">
                <img src={logo} alt="MK" className="w-[40px] h-[40px] object-contain shrink-0" />
                <div>
                    <h1 className="font-heading text-lg font-semibold text-gray-900">
                    {isTamil ? 'மோகனூர் கொங்கு சமுதாய நல அறக்கட்டளை' : 'Mohanur Kongu Samudhaya Nala Arakattalai'}
                </h1>
                </div>
            </div>
            <div className="text-right">
<h1 className="font-serif text-2xl text-gray-900 leading-tight font-bold">{name}</h1>
            </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="border border-gray-200 p-3">
                        <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-2 pb-1.5 border-b border-gray-200">
                            {isTamil ? 'தனிப்பட்ட விவரங்கள்' : 'Personal Details'}
                        </h2>
                        <JDataRow label={isTamil ? 'பிறந்த தேதி' : 'DOB'} value={dob} />
                        <JDataRow label={isTamil ? 'வயது' : 'Age'} value={age} />
                        <JDataRow label={isTamil ? 'பாலினம்' : 'Gender'} value={gender} />
                        <JDataRow label={isTamil ? 'திருமண நிலை' : 'Marital'} value={maritalStatus} />
                        <JDataRow label={isTamil ? 'உயரம்' : 'Height'} value={height} />
                        <JDataRow label={isTamil ? 'உணவு' : 'Diet'} value={diet} />
                        <JDataRow label={isTamil ? 'நிறம்' : 'Complexion'} value={complexion} />
                        <JDataRow label={isTamil ? 'இரத்தம்' : 'Blood'} value={bloodGroup} />
                    </div>

                    <div className="border border-gray-200 p-3 bg-gray-50/30">
                        <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-2 pb-1.5 border-b border-gray-200">
                            {isTamil ? 'ஜாதக விவரங்கள்' : 'Horoscope Details'}
                        </h2>
                        <JDataRow label={isTamil ? 'நட்சத்திரம்' : 'Star'} value={star} />
                        <JDataRow label={isTamil ? 'ராசி' : 'Rasi'} value={rasi} />
                        <JDataRow label={isTamil ? 'லக்னம்' : 'Lagna'} value={lagna} />
                        <JDataRow label={isTamil ? 'பிறந்த நேரம்' : 'Time'} value={birthTime} />
                        <JDataRow label={isTamil ? 'தோஷம்' : 'Dosham'} value={dosham} />
                        <JDataRow label={isTamil ? 'குலதெய்வம்' : 'Deity'} value={kuladeivam} />
                        <JDataRow label={isTamil ? 'பிறந்த இடம்' : 'Birth'} value={birthPlace} />
                        <JDataRow label={isTamil ? 'சொந்த ஊர்' : 'Native'} value={nativeLocation} />
                    </div>
                </div>

                <div className="border border-gray-200 p-3 mb-3">
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-700 mb-4 text-center pb-2 border-b border-gray-200">
                        {isTamil ? 'ஜாதக கட்டங்கள்' : 'Horoscope Charts'}
                    </h2>
                    {(() => {
                        const hJson = profile.horoscope?.horoscopeJson;
                        if (profile.horoscope?.mode === 'GENERATED' && hJson) {
                            const parsed = typeof hJson === 'string' ? JSON.parse(hJson) : hJson as HoroscopeResult;
                            const d9Planets = parsed.planets.map((p: PlanetData) => ({...p, signIndex: p.navamsaSignIndex}));
                            return (
                                <div className="flex justify-center items-start gap-6">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[8px] font-bold text-gray-500 mb-2 uppercase tracking-[.3em]">{isTamil ? 'ராசி' : 'RASI'}</span>
                                        <div className="w-[260px] h-[260px] bg-white border border-gray-200 print-chart-box">
                                            <SouthIndianChart lagnaSignIndex={parsed.lagna.signIndex} planets={parsed.planets} rotateHouses={true} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[8px] font-bold text-gray-500 mb-2 uppercase tracking-[.3em]">{isTamil ? 'நவாம்சம்' : 'NAVAMSA'}</span>
                                        <div className="w-[260px] h-[260px] bg-white border border-gray-200 print-chart-box">
                                            <SouthIndianChart lagnaSignIndex={parsed.lagnaNavamsa.signIndex} planets={d9Planets} rotateHouses={false} />
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        const hasRasi = profile.horoscope?.rasi?.url;
                        const hasNavamsa = profile.horoscope?.navamsa?.url;
                        if (hasRasi || hasNavamsa) {
                            return (
                                <div className="flex justify-center items-start gap-6">
                                    {hasRasi && (
                                        <div className="flex flex-col items-center">
                                            <span className="text-[8px] font-bold text-gray-500 mb-2 uppercase tracking-[.3em]">{isTamil ? 'ராசி' : 'RASI'}</span>
                                            <img src={getImageUrl(profile.horoscope.rasi.url) || ''} alt="Rasi" className="w-[260px] h-[260px] object-contain border border-gray-200 bg-white" />
                                        </div>
                                    )}
                                    {hasNavamsa && (
                                        <div className="flex flex-col items-center">
                                            <span className="text-[8px] font-bold text-gray-500 mb-2 uppercase tracking-[.3em]">{isTamil ? 'நவாம்சம்' : 'NAVAMSA'}</span>
                                            <img src={getImageUrl(profile.horoscope.navamsa.url) || ''} alt="Navamsa" className="w-[260px] h-[260px] object-contain border border-gray-200 bg-white" />
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        return (
                            <div className="col-span-12 p-4 border border-gray-200">
                                <p className="text-sm text-gray-400 italic text-center py-6">{isTamil ? 'ஜாதக கட்டங்கள் வழங்கப்படவில்லை' : 'Horoscope charts not provided'}</p>
                            </div>
                        );
                    })()}
                </div>

                <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center text-[8px] text-gray-500">
                        <div>
                            <p className="uppercase tracking-[0.15em] font-bold">{isTamil ? 'மோகனூர் கொங்கு மணமாலை' : 'MOHANUR KONGU MANAMAALAI'}</p>
                            <p className="mt-0.5">{isTamil ? 'திருமண நோக்கத்திற்காக மட்டுமே' : 'For matrimonial purposes only'}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold uppercase tracking-wider">{isTamil ? 'அச்சிட்ட தேதி' : 'Printed'}: {new Date().toLocaleDateString(isTamil ? 'ta-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            <p className="font-semibold mt-0.5">Ref: {regNo}</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media screen { .hidden-jathagam-container { display: none; } }
                @media print {
                    @page { size: A4; margin: 8mm; }
                    body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .hidden-jathagam-container { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .print-chart-box { display: flex !important; align-items: center !important; justify-content: center !important; }
                    .print-chart-box > div { width: 100% !important; height: 100% !important; display: flex !important; flex-direction: column !important; }
                    .print-chart-box svg { width: 100% !important; height: 100% !important; display: block !important; }
                }
            `}</style>
        </div>
    );
};
