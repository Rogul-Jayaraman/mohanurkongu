import { SIGNS, PLANET_SHORT_NAMES, PLANET_TAMIL_SHORT_NAMES, PLANETS_TAMIL, SignName, SignCell, ChartRenderData } from '@/types/horoscope';

export const SIGN_GRID: { sign: SignName; signIndex: number; row: number; col: number }[] = [
  { sign: 'Pisces',       signIndex: 11, row: 0, col: 0 },
  { sign: 'Aries',        signIndex: 0,  row: 0, col: 1 },
  { sign: 'Taurus',       signIndex: 1,  row: 0, col: 2 },
  { sign: 'Gemini',       signIndex: 2,  row: 0, col: 3 },
  { sign: 'Aquarius',     signIndex: 10, row: 1, col: 0 },
  { sign: 'Cancer',       signIndex: 3,  row: 1, col: 3 },
  { sign: 'Capricorn',    signIndex: 9,  row: 2, col: 0 },
  { sign: 'Leo',          signIndex: 4,  row: 2, col: 3 },
  { sign: 'Sagittarius',  signIndex: 8,  row: 3, col: 0 },
  { sign: 'Scorpio',      signIndex: 7,  row: 3, col: 1 },
  { sign: 'Libra',        signIndex: 6,  row: 3, col: 2 },
  { sign: 'Virgo',        signIndex: 5,  row: 3, col: 3 }
];

export function getHouseNumber(signIndex: number, lagnaSignIndex: number): number {
  return ((signIndex - lagnaSignIndex + 12) % 12) + 1;
}

interface PlanetEntry {
  name: string;
  nameTamil: string;
  signIndex: number;
}

export function buildChartRenderData(
  lagnaSignIndex: number,
  planetEntries: PlanetEntry[],
  rotateHouses = true
): ChartRenderData {
  const grouped: Record<number, { name: string; nameTamil: string; shortName: string; shortNameTamil: string }[]> = {};
  for (const p of planetEntries) {
    if (!grouped[p.signIndex]) grouped[p.signIndex] = [];
    grouped[p.signIndex].push({
      name: p.name,
      nameTamil: p.nameTamil,
      shortName: PLANET_SHORT_NAMES[p.name] || p.name.slice(0, 2),
      shortNameTamil: PLANET_TAMIL_SHORT_NAMES[p.name] || p.nameTamil.slice(0, 2)
    });
  }

  const cells: SignCell[] = SIGN_GRID.map((sg) => ({
    sign: sg.sign,
    signIndex: sg.signIndex,
    pos: { row: sg.row, col: sg.col },
    houseNumber: rotateHouses
      ? getHouseNumber(sg.signIndex, lagnaSignIndex)
      : sg.signIndex + 1,
    planets: grouped[sg.signIndex] || [],
    isAscendant: sg.signIndex === lagnaSignIndex
  }));

  return {
    cells,
    lagnaSign: SIGNS[lagnaSignIndex]
  };
}
