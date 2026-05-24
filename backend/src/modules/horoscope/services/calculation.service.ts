import {
  setSiderealMode,
  SiderealMode,
  CalculationFlag,
  julianDay,
  calculatePosition,
  calculateHouses,
  getAyanamsa,
  Planet as SwissephPlanet,
  LunarPoint,
  HouseSystem,
} from '@swisseph/node';
import { DateTime } from 'luxon';
import { find as tzLookup } from 'geo-tz';
import { normalizeDec, getSignIndex, getNakshatraIndex, getPada, calcD9 } from '../utils/horoscope.utils.js';
import type { BirthInput, GenerateResponse, PlanetData, HouseData } from '../types/horoscope.types.js';

setSiderealMode(SiderealMode.Lahiri);

const SIDEREAL_FLAGS =
  CalculationFlag.Sidereal | CalculationFlag.Speed | CalculationFlag.SwissEphemeris;

const PLANET_DEFS: { body: number; name: string }[] = [
  { body: SwissephPlanet.Sun,     name: 'Sun' },
  { body: SwissephPlanet.Moon,    name: 'Moon' },
  { body: SwissephPlanet.Mars,    name: 'Mars' },
  { body: SwissephPlanet.Mercury, name: 'Mercury' },
  { body: SwissephPlanet.Jupiter, name: 'Jupiter' },
  { body: SwissephPlanet.Venus,   name: 'Venus' },
  { body: SwissephPlanet.Saturn,  name: 'Saturn' },
  { body: LunarPoint.TrueNode,    name: 'Rahu' },
];

export function generateHoroscope(input: BirthInput): GenerateResponse {
  const [tz] = tzLookup(input.location.latitude, input.location.longitude);
  const localDT = DateTime.fromISO(`${input.dateOfBirth}T${input.timeOfBirth}`, { zone: tz });
  if (!localDT.isValid) {
    throw new Error(`Invalid date/time: ${input.dateOfBirth}T${input.timeOfBirth}`);
  }

  const utcDT = localDT.toUTC();
  const decimalHour = utcDT.hour + utcDT.minute / 60 + utcDT.second / 3600;
  const jd = julianDay(utcDT.year, utcDT.month, utcDT.day, decimalHour);
  const ayanamsa = getAyanamsa(jd);

  const planets: PlanetData[] = [];

  for (const p of PLANET_DEFS) {
    const pos = calculatePosition(jd, p.body, SIDEREAL_FLAGS);
    const lon = normalizeDec(pos.longitude);
    const signIndex = getSignIndex(lon);

    planets.push({
      name: p.name,
      longitude: lon,
      signIndex,
      degree: normalizeDec(lon % 30),
      house: 0,
      nakshatraIndex: getNakshatraIndex(lon),
      pada: getPada(lon),
      navamsaSignIndex: calcD9(lon),
      navamsaHouse: 0,
    });
  }

  const rahu = planets.find((p) => p.name === 'Rahu')!;
  const ketuLon = normalizeDec(rahu.longitude + 180);
  const ketuSignIndex = getSignIndex(ketuLon);

  planets.push({
    name: 'Ketu',
    longitude: ketuLon,
    signIndex: ketuSignIndex,
    degree: normalizeDec(ketuLon % 30),
    house: 0,
    nakshatraIndex: getNakshatraIndex(ketuLon),
    pada: getPada(ketuLon),
    navamsaSignIndex: calcD9(ketuLon),
    navamsaHouse: 0,
  });

  const housesResult = calculateHouses(
    jd,
    input.location.latitude,
    input.location.longitude,
    HouseSystem.WholeSign,
  );
  const tropicalAsc = housesResult.ascendant;
  const lagnaLongitude = normalizeDec(tropicalAsc - ayanamsa);
  const lagnaIdx = getSignIndex(lagnaLongitude);
  const lagnaNakshatraIndex = getNakshatraIndex(lagnaLongitude);

  for (const p of planets) {
    p.house = ((p.signIndex - lagnaIdx + 12) % 12) + 1;
  }

  const lagnaNavamsaIdx = calcD9(lagnaLongitude);

  const houses: HouseData[] = [];
  for (let i = 0; i < 12; i++) {
    const signIdx = (lagnaIdx + i) % 12;
    const houseNum = i + 1;
    const planetNames = planets
      .filter((p) => p.house === houseNum)
      .map((p) => p.name);
    houses.push({
      number: houseNum,
      signIndex: signIdx,
      planets: planetNames,
    });
  }

  for (const p of planets) {
    p.navamsaHouse = ((p.navamsaSignIndex - lagnaNavamsaIdx + 12) % 12) + 1;
  }

  const moon = planets.find((p) => p.name === 'Moon')!;
  const lagnaPada = getPada(lagnaLongitude);

  const summary = {
    rasiSignIndex: moon.signIndex,
    lagnaSignIndex: lagnaIdx,
    nakshatraIndex: moon.nakshatraIndex,
    nakshatraPada: moon.pada,
    ayanamsa: `${ayanamsa.toFixed(4)}°`,
    locationName: input.location.displayName,
  };

  return {
    input,
    meta: {
      ayanamsa,
      julianDay: jd,
      timezone: tz,
    },
    lagna: {
      signIndex: lagnaIdx,
      longitude: lagnaLongitude % 30,
      pada: lagnaPada,
      nakshatraIndex: lagnaNakshatraIndex,
    },
    lagnaNavamsa: {
      signIndex: lagnaNavamsaIdx,
      longitude: lagnaLongitude % 30,
    },
    planets,
    houses,
    summary,
  };
}
