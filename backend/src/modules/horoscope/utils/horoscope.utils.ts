import Decimal from 'decimal.js';

export function normalizeDec(lon: number): number {
  return new Decimal(lon).mod(360).plus(360).mod(360).toNumber();
}

export function getSignIndex(longitude: number): number {
  return Math.floor(normalizeDec(longitude) / 30);
}

export function getNakshatraIndex(longitude: number): number {
  return Math.floor(normalizeDec(longitude) / (360 / 27)) % 27;
}

export function getPada(longitude: number): number {
  const lon = normalizeDec(longitude);
  const nakshatraSpan = 360 / 27;
  const padaSpan = nakshatraSpan / 4;
  return Math.floor((lon % nakshatraSpan) / padaSpan) + 1;
}

export function calcD9(longitude: number): number {
  const lon = normalizeDec(longitude);
  const signIdx = Math.floor(lon / 30);
  const posInSign = lon % 30;
  const navIndex = Math.floor(posInSign / (30 / 9));

  const signType = signIdx % 3;
  let startSign: number;
  if (signType === 0) {
    startSign = signIdx;
  } else if (signType === 1) {
    startSign = (signIdx + 8) % 12;
  } else {
    startSign = (signIdx + 4) % 12;
  }

  return (startSign + navIndex) % 12;
}
