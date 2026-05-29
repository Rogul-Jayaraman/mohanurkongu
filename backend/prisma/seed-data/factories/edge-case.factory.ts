import type { PrismaClient } from '@prisma/client';
import { SEED_CONFIG } from '../config.js';
import {
  randomInt, randomDateBefore, pickRandom, randomBool,
  generateLongText, progressBar,
} from '../helpers.js';

export async function seedEdgeCases(
  prisma: PrismaClient,
  accountIndex: Record<number, any>,
  profileIndex: Record<string, any>,
  refs: any,
): Promise<void> {
  const allProfiles = Object.values(profileIndex) as any[];
  const activeProfiles = allProfiles.filter(p => p.status === 'ACTIVE');
  let created = 0;

  const edgeProfileIds = pickRandomSubset(
    activeProfiles.map(p => p.profile.id),
    Math.min(30, activeProfiles.length),
  );

  for (const profileId of edgeProfileIds.slice(0, 10)) {
    const pi = allProfiles.find(p => p.profile.id === profileId);
    if (!pi || !pi.plan) continue;

    await addLongBio(prisma, pi.profile.id);
    created++;
    progressBar(created, edgeProfileIds.length, 'Edge Cases');
  }

  for (const profileId of edgeProfileIds.slice(10, 15)) {
    const pi = allProfiles.find(p => p.profile.id === profileId);
    if (!pi || !pi.plan) continue;

    await addExtremeSalary(prisma, pi.profile.id, pi.plan.gender === 'MALE' ? 2000000 : 1500000);
    created++;
    progressBar(created, edgeProfileIds.length, 'Edge Cases');
  }

  for (const profileId of edgeProfileIds.slice(15, 20)) {
    const pi = allProfiles.find(p => p.profile.id === profileId);
    if (!pi || !pi.plan) continue;

    await addConflictingPreferences(prisma, pi.profile.id, pi.plan);
    created++;
    progressBar(created, edgeProfileIds.length, 'Edge Cases');
  }

  for (const profileId of edgeProfileIds.slice(20, 25)) {
    const pi = allProfiles.find(p => p.profile.id === profileId);
    if (!pi || !pi.plan) continue;

    await addUnicodeOnlyProfile(prisma, pi.profile.id);
    created++;
    progressBar(created, edgeProfileIds.length, 'Edge Cases');
  }

  progressBar(edgeProfileIds.length, edgeProfileIds.length, 'Edge Cases');
}

async function addLongBio(prisma: PrismaClient, profileId: string): Promise<void> {
  const longBio = generateLongText(300);
  const existing = await prisma.partnerPreference.findUnique({ where: { profileId } });
  if (existing) {
    await prisma.partnerPreference.update({
      where: { profileId },
      data: { expectationNote: longBio },
    });
  }
}

async function addExtremeSalary(prisma: PrismaClient, profileId: string, salary: number): Promise<void> {
  const existing = await prisma.profileProfessional.findUnique({ where: { profileId } });
  if (existing) {
    await prisma.profileProfessional.update({
      where: { profileId },
      data: { monthlySalary: salary },
    });
  }
}

async function addConflictingPreferences(prisma: PrismaClient, profileId: string, plan: any): Promise<void> {
  const existing = await prisma.partnerPreference.findUnique({ where: { profileId } });
  if (existing) {
    await prisma.partnerPreference.update({
      where: { profileId },
      data: {
        ageMin: 30,
        ageMax: 22,
        monthlySalary: 0,
      },
    });
  }
}

async function addUnicodeOnlyProfile(prisma: PrismaClient, profileId: string): Promise<void> {
  const taBio = 'அன்பான குடும்பம், மரபு விழுமியங்களை மதிக்கும் இளைஞர். திருமணத்திற்கான தகுந்த துணையை தேடுகிறேன். எளிமையான வாழ்க்கை முறை, உயர்ந்த எண்ணங்கள்.';

  const existing = await prisma.partnerPreference.findUnique({ where: { profileId } });
  if (existing) {
    await prisma.partnerPreference.update({
      where: { profileId },
      data: { expectationNote: taBio },
    });
  }
}

function pickRandomSubset<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
