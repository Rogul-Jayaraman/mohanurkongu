// Common Enum Mappings from list.md
// Used for Dropdowns across the application

export const PROFILE_FOR_OPTIONS = [
  { value: 'MYSELF', label: { en: 'Myself', ta: 'எனக்காக' } },
  { value: 'MY_SON', label: { en: 'My Son', ta: 'என் மகன்' } },
  { value: 'MY_DAUGHTER', label: { en: 'My Daughter', ta: 'என் மகள்' } },
  { value: 'MY_SISTER', label: { en: 'My Sister', ta: 'என் தங்கை / அக்கா' } },
  { value: 'MY_BROTHER', label: { en: 'My Brother', ta: 'என் தம்பி / அண்ணன்' } },
];

export const GENDER_OPTIONS = [
  { value: 'MALE', label: { en: 'Male', ta: 'ஆண்' } },
  { value: 'FEMALE', label: { en: 'Female', ta: 'பெண்' } },
];

export const MARITAL_STATUS_OPTIONS = [
  { value: 'NEVER_MARRIED', label: { en: 'Never Married', ta: 'திருமணம் ஆகாதவர்' } },
  { value: 'DIVORCED', label: { en: 'Divorced', ta: 'விவாகரத்து பெற்றவர்' } },
  { value: 'WIDOWED', label: { en: 'Widowed', ta: 'விதவை / விதுரர்' } },
];

export const DIET_OPTIONS = [
  { value: 'VEGETARIAN', label: { en: 'Vegetarian', ta: 'சைவம்' } },
  { value: 'NON_VEGETARIAN', label: { en: 'Non-Vegetarian', ta: 'அசைவம்' } },
];

export const COMPLEXION_OPTIONS = [
  { value: 'VERY_FAIR', label: { en: 'Very Fair', ta: 'மிகவும் வெண்மை' } },
  { value: 'FAIR', label: { en: 'Fair', ta: 'வெண்மை' } },
  { value: 'WHEATISH', label: { en: 'Wheatish', ta: 'கோதுமை நிறம்' } },
  { value: 'DARK', label: { en: 'Dark', ta: 'கருமை' } },
  { value: 'NOT_SPECIFIED', label: { en: 'Not Specified', ta: 'குறிப்பிடவில்லை' } },
];

export const JOB_SECTOR_OPTIONS = [
  { value: 'PRIVATE', label: { en: 'Private', ta: 'தனியார்' } },
  { value: 'FOREIGN', label: { en: 'Foreign', ta: 'வெளிநாடு' } },
  { value: 'BUSINESS', label: { en: 'Business', ta: 'தொழில்' } },
  { value: 'DOCTOR', label: { en: 'Doctor', ta: 'மருத்துவர்' } },
  { value: 'GOVT', label: { en: 'Government', ta: 'அரசு' } },
  { value: 'SELF_EMPLOYED', label: { en: 'Self Employed', ta: 'சுயதொழில்' } },
  { value: 'OTHERS', label: { en: 'Others', ta: 'மற்றவை' } },
];

export const RESIDENCE_OPTIONS = [
  { value: 'OWNED', label: { en: 'Own House', ta: 'சொந்த வீடு' } },
  { value: 'RENTED', label: { en: 'Rented', ta: 'வாடகை வீடு' } },
];

// Rasi & Nakshatra simplified mapping
export const RASI_OPTIONS = [
  { value: 'MESHA', label: { en: 'Mesha (Aries)', ta: 'மேஷம்' } },
  { value: 'VRISHABHA', label: { en: 'Vrishabha (Taurus)', ta: 'ரிஷபம்' } },
  { value: 'MITHUNA', label: { en: 'Mithuna (Gemini)', ta: 'மிதுனம்' } },
  { value: 'KATAKA', label: { en: 'Kataka (Cancer)', ta: 'கடகம்' } },
  { value: 'SIMHA', label: { en: 'Simha (Leo)', ta: 'சிம்மம்' } },
  { value: 'KANYA', label: { en: 'Kanya (Virgo)', ta: 'கன்னி' } },
  { value: 'TULA', label: { en: 'Tula (Libra)', ta: 'துலாம்' } },
  { value: 'VRISCHIKA', label: { en: 'Vrischika (Scorpio)', ta: 'விருச்சிகம்' } },
  { value: 'DHANUS', label: { en: 'Dhanus (Sagittarius)', ta: 'தனுசு' } },
  { value: 'MAKARA', label: { en: 'Makara (Capricorn)', ta: 'மகரம்' } },
  { value: 'KUMBHA', label: { en: 'Kumbha (Aquarius)', ta: 'கும்பம்' } },
  { value: 'MEENA', label: { en: 'Meena (Pisces)', ta: 'மீனம்' } },
];

export const NAKSHATRA_OPTIONS = [
  { value: 'ASHWINI', label: { en: 'Ashwini', ta: 'அஸ்வினி' } },
  { value: 'BHARANI', label: { en: 'Bharani', ta: 'பரணி' } },
  { value: 'KRITTIKA', label: { en: 'Krittika', ta: 'கார்த்திகை' } },
  { value: 'ROHINI', label: { en: 'Rohini', ta: 'ரோகிணி' } },
  { value: 'MRIGASHIRA', label: { en: 'Mrigashira', ta: 'மிருகசீரிடம்' } },
  { value: 'ARDRA', label: { en: 'Ardra', ta: 'திருவாதிரை' } },
  { value: 'PUNARVASU', label: { en: 'Punvasu', ta: 'புனர்பூசம்' } },
  { value: 'PUSHYA', label: { en: 'Pushya', ta: 'பூசம்' } },
  { value: 'ASHLESHA', label: { en: 'Ashlesha', ta: 'ஆயில்யம்' } },
  { value: 'MAGHA', label: { en: 'Magha', ta: 'மகம்' } },
  { value: 'PURVA_PHALGUNI', label: { en: 'Purva Phalguni', ta: 'பூரம்' } },
  { value: 'UTTARA_PHALGUNI', label: { en: 'Uttara Phalguni', ta: 'உத்திரம்' } },
  { value: 'HASTA', label: { en: 'Hasta', ta: 'அஸ்தம்' } },
  { value: 'CHITRA', label: { en: 'Chitra', ta: 'சித்திரை' } },
  { value: 'SWATI', label: { en: 'Swati', ta: 'சுவாதி' } },
  { value: 'VISHAKHA', label: { en: 'Vishakha', ta: 'விசாகம்' } },
  { value: 'ANURADHA', label: { en: 'Anuradha', ta: 'அனுஷம்' } },
  { value: 'JYESHTHA', label: { en: 'Jyeshtha', ta: 'கேட்டை' } },
  { value: 'MULA', label: { en: 'Mula', ta: 'மூலம்' } },
  { value: 'PURVA_ASHADHA', label: { en: 'Purva Ashadha', ta: 'பூராடம்' } },
  { value: 'UTTARA_ASHADHA', label: { en: 'Uttara Ashadha', ta: 'உத்திராடம்' } },
  { value: 'SHRAVANA', label: { en: 'Shravana', ta: 'திருவோணம்' } },
  { value: 'DHANISHTHA', label: { en: 'Dhanistha', ta: 'அவிட்டம்' } },
  { value: 'SHATABHISHA', label: { en: 'Shatabhisha', ta: 'சதயம்' } },
  { value: 'PURVA_BHADRAPADA', label: { en: 'Purva Bhadrapada', ta: 'பூரட்டாதி' } },
  { value: 'UTTARA_BHADRAPADA', label: { en: 'Uttara Bhadrapada', ta: 'உத்திரட்டாதி' } },
  { value: 'REVATI', label: { en: 'Revati', ta: 'ரேவதி' } },
];
export const BLOOD_GROUP_OPTIONS = [
  { value: 'A_POSITIVE', label: { en: 'A+', ta: 'A+' } },
  { value: 'A_NEGATIVE', label: { en: 'A-', ta: 'A-' } },
  { value: 'B_POSITIVE', label: { en: 'B+', ta: 'B+' } },
  { value: 'B_NEGATIVE', label: { en: 'B-', ta: 'B-' } },
  { value: 'AB_POSITIVE', label: { en: 'AB+', ta: 'AB+' } },
  { value: 'AB_NEGATIVE', label: { en: 'AB-', ta: 'AB-' } },
  { value: 'O_POSITIVE', label: { en: 'O+', ta: 'O+' } },
  { value: 'O_NEGATIVE', label: { en: 'O-', ta: 'O-' } },
];

export const HEIGHT_OPTIONS = Array.from({ length: 110 }, (_, i) => {
  const cm = i + 122; // starts at 122 cm (approx 4 feet)
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return {
    value: cm.toString(),
    label: { 
      en: `${feet}'${inches}" - ${cm} cm`, 
      ta: `${feet}'${inches}" - ${cm} செ.மீ` 
    }
  };
});

export const HEIGHT_FEET_OPTIONS = Array.from({ length: 4 }, (_, i) => ({
  value: (i + 4).toString(),
  label: { en: `${i + 4} ft`, ta: `${i + 4} அடி` }
}));

export const HEIGHT_INCHES_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i.toString(),
  label: { en: `${i} in`, ta: `${i} அங்குலம்` }
}));

export const DOSHAM_OPTIONS = [
  { value: 'NO', label: { en: 'No Dosham', ta: 'தோஷம் இல்லை' } },
  { value: 'CHEVVAI', label: { en: 'Chevvai Dosham', ta: 'செவ்வாய் தோஷம்' } },
  { value: 'NAGA', label: { en: 'Naga Dosham', ta: 'நாக தோஷம்' } },
  { value: 'KALA_SARPA', label: { en: 'Kala Sarpa Dosham', ta: 'கால சர்ப்ப தோஷம்' } },
  { value: 'RAHU_KETHU', label: { en: 'Rahu Kethu Dosham', ta: 'ராகு கேது தோஷம்' } },
  { value: 'OTHERS', label: { en: 'Others', ta: 'மற்றவை' } },
];

export * from './kulam';
export * from './calendar';
export * from './gallery';
