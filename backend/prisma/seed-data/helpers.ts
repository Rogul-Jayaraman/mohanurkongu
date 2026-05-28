import seedrandom from 'seedrandom';

let rng: seedrandom.PRNG;

export function initRng(seed?: string) {
  const s = seed || process.env.SEED || '42';
  rng = seedrandom(s);
}

export function resetRng() {
  rng = seedrandom(Date.now().toString());
}

export function random(): number {
  return rng();
}

export function randomInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number): number {
  return rng() * (max - min) + min;
}

export function weightedPick<T extends { value: string; weight: number }>(options: T[]): string {
  const totalWeight = options.reduce((s, o) => s + o.weight, 0);
  let r = rng() * totalWeight;
  for (const opt of options) {
    r -= opt.weight;
    if (r <= 0) return opt.value;
  }
  return options[options.length - 1].value;
}

export function weightedPickRaw<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + rng() * (end.getTime() - start.getTime()));
}

export function randomDateBefore(date: Date, maxDaysBefore: number): Date {
  const ms = date.getTime() - rng() * maxDaysBefore * 86400000;
  return new Date(ms);
}

export function randomDateAfter(date: Date, maxDaysAfter: number): Date {
  const ms = date.getTime() + rng() * maxDaysAfter * 86400000;
  return new Date(ms);
}

export function generateDob(age: number): Date {
  const now = new Date();
  const year = now.getFullYear() - age;
  const month = randomInt(0, 11);
  const day = randomInt(1, 28);
  return new Date(year, month, day);
}

export function calculateAge(dob: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export function clampNormal(mean: number, stddev: number, min: number, max: number): number {
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1 + 0.0001)) * Math.cos(2 * Math.PI * u2);
  const val = Math.round(mean + z * stddev);
  return Math.max(min, Math.min(max, val));
}

export function randomBool(truePct: number): boolean {
  return rng() < (truePct / 100);
}

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function pickNRandom<T>(arr: T[], n: number): T[] {
  return shuffleArray(arr).slice(0, Math.min(n, arr.length));
}

export function generateAccountNo(counter: number): string {
  return `MK-${String(counter).padStart(5, '0')}`;
}

export function generateRegNo(counter: number): string {
  return `MKM${String(counter).padStart(5, '0')}`;
}

export function generatePublicId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) result += chars[Math.floor(rng() * chars.length)];
  return result;
}

export function generateUploadToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) result += chars[Math.floor(rng() * chars.length)];
  return result;
}

export function generateChecksum(): string {
  const hex = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 64; i++) result += hex[Math.floor(rng() * 16)];
  return result;
}

export const progressBar = (current: number, total: number, label: string) => {
  const pct = Math.round((current / total) * 100);
  const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
  process.stdout.write(`\r  ${label}: [${bar}] ${pct}% (${current}/${total})`);
  if (current === total) process.stdout.write('\n');
};
