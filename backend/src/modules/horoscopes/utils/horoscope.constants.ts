export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export type Sign = (typeof SIGNS)[number];

export const SIGNS_TAMIL: Record<Sign, string> = {
  Aries: 'மேஷம்',
  Taurus: 'ரிஷபம்',
  Gemini: 'மிதுனம்',
  Cancer: 'கடகம்',
  Leo: 'சிம்மம்',
  Virgo: 'கன்னி',
  Libra: 'துலாம்',
  Scorpio: 'விருச்சிகம்',
  Sagittarius: 'தனுசு',
  Capricorn: 'மகரம்',
  Aquarius: 'கும்பம்',
  Pisces: 'மீனம்',
};

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini',
  'Mrigashirsha', 'Ardra', 'Punarvasu', 'Pushya',
  'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha',
  'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
  'Uttara Ashadha', 'Shravana', 'Dhanistha', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
] as const;

export type Nakshatra = (typeof NAKSHATRAS)[number];

export const NAKSHATRAS_TAMIL: Record<Nakshatra, string> = {
  Ashwini: 'அஸ்வினி',
  Bharani: 'பரணி',
  Krittika: 'கார்த்திகை',
  Rohini: 'ரோகிணி',
  Mrigashirsha: 'மிருகசீரிஷம்',
  Ardra: 'திருவாதிரை',
  Punarvasu: 'புனர்பூசம்',
  Pushya: 'பூசம்',
  Ashlesha: 'ஆயில்யம்',
  Magha: 'மகம்',
  'Purva Phalguni': 'பூரம்',
  'Uttara Phalguni': 'உத்திரம்',
  Hasta: 'ஹஸ்தம்',
  Chitra: 'சித்திரை',
  Swati: 'சுவாதி',
  Vishakha: 'விசாகம்',
  Anuradha: 'அனுஷம்',
  Jyeshtha: 'கேட்டை',
  Mula: 'மூலம்',
  'Purva Ashadha': 'பூராடம்',
  'Uttara Ashadha': 'உத்திராடம்',
  Shravana: 'திருவோணம்',
  Dhanistha: 'அவிட்டம்',
  Shatabhisha: 'சதயம்',
  'Purva Bhadrapada': 'பூரட்டாதி',
  'Uttara Bhadrapada': 'உத்திரட்டாதி',
  Revati: 'ரேவதி',
};

export const PLANETS = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu',
] as const;

export type PlanetName = (typeof PLANETS)[number];

export const PLANETS_TAMIL: Record<PlanetName, string> = {
  Sun: 'சூரியன்',
  Moon: 'சந்திரன்',
  Mars: 'செவ்வாய்',
  Mercury: 'புதன்',
  Jupiter: 'குரு',
  Venus: 'சுக்கிரன்',
  Saturn: 'சனி',
  Rahu: 'ராகு',
  Ketu: 'கேது',
};

export const SIGN_LORDS: Record<Sign, PlanetName> = {
  Aries: 'Mars',
  Taurus: 'Venus',
  Gemini: 'Mercury',
  Cancer: 'Moon',
  Leo: 'Sun',
  Virgo: 'Mercury',
  Libra: 'Venus',
  Scorpio: 'Mars',
  Sagittarius: 'Jupiter',
  Capricorn: 'Saturn',
  Aquarius: 'Saturn',
  Pisces: 'Jupiter',
};

export const NAKSHATRA_LORDS: Record<Nakshatra, PlanetName> = {
  Ashwini: 'Ketu',
  Bharani: 'Venus',
  Krittika: 'Sun',
  Rohini: 'Moon',
  Mrigashirsha: 'Mars',
  Ardra: 'Rahu',
  Punarvasu: 'Jupiter',
  Pushya: 'Saturn',
  Ashlesha: 'Mercury',
  Magha: 'Ketu',
  'Purva Phalguni': 'Venus',
  'Uttara Phalguni': 'Sun',
  Hasta: 'Moon',
  Chitra: 'Mars',
  Swati: 'Rahu',
  Vishakha: 'Jupiter',
  Anuradha: 'Saturn',
  Jyeshtha: 'Mercury',
  Mula: 'Ketu',
  'Purva Ashadha': 'Venus',
  'Uttara Ashadha': 'Sun',
  Shravana: 'Moon',
  Dhanistha: 'Mars',
  Shatabhisha: 'Rahu',
  'Purva Bhadrapada': 'Jupiter',
  'Uttara Bhadrapada': 'Saturn',
  Revati: 'Mercury',
};
