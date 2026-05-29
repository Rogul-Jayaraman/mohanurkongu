import type { PrismaClient } from '@prisma/client';
import { SEED_CONFIG } from '../config.js';
import { randomInt, pickRandom, shuffleArray, randomBool, progressBar } from '../helpers.js';

export async function seedShortlists(
  prisma: PrismaClient,
  profileIndex: Record<string, any>,
  accountIndex: Record<number, any>,
  targetCount: number,
): Promise<void> {
  const activeProfiles = Object.values(profileIndex).filter(
    (pi: any) => pi.status === 'ACTIVE',
  ) as any[];

  if (activeProfiles.length === 0) return;

  const activeProfileIds = activeProfiles.map(p => p.profile.id);
  const accountIds = Object.values(accountIndex).map((ai: any) => ai.account.id);

  const profileOwnerMap = new Map<string, string>();
  for (const pi of activeProfiles) {
    profileOwnerMap.set(pi.profile.id, pi.accountId);
  }

  let created = 0;

  const hotProfileCount = Math.min(8, activeProfileIds.length);
  const hotProfiles = shuffleArray(activeProfileIds).slice(0, hotProfileCount);

  const entries: { profileId: string; accountId: string; createdAt: Date }[] = [];

  for (const hp of hotProfiles) {
    const possibleAccounts = accountIds.filter(
      (aid: string) => aid !== profileOwnerMap.get(hp),
    );
    const shortlistCount = randomInt(
      SEED_CONFIG.HOT_PROFILE_SHORTLISTS.min,
      SEED_CONFIG.HOT_PROFILE_SHORTLISTS.max + 1,
    );
    const chosen = shuffleArray(possibleAccounts).slice(0, Math.min(shortlistCount, possibleAccounts.length));
    for (const acctId of chosen) {
      entries.push({
        profileId: hp,
        accountId: acctId,
        createdAt: new Date(Date.now() - randomInt(0, 90) * 86400000),
      });
    }
  }

  const coldProfileIds = shuffleArray(activeProfileIds.filter(
    id => !hotProfiles.includes(id)
  ));

  while (entries.length < targetCount) {
    const profileId = pickRandom(activeProfileIds);
    const ownerId = profileOwnerMap.get(profileId);
    const possibleAccounts = accountIds.filter((aid: string) => aid !== ownerId);
    if (possibleAccounts.length === 0) continue;
    const accountId = pickRandom(possibleAccounts);

    const dup = entries.find(
      (e: any) => e.profileId === profileId && e.accountId === accountId,
    );
    if (!dup) {
      entries.push({
        profileId,
        accountId,
        createdAt: new Date(Date.now() - randomInt(0, 180) * 86400000),
      });
    }
  }

  const batchSize = 100;
  for (let b = 0; b < entries.length; b += batchSize) {
    const batch = entries.slice(b, b + batchSize);
    for (const entry of batch) {
      try {
        await prisma.shortlist.create({ data: entry });
        created++;
      } catch {
        // skip duplicates
      }
      progressBar(created, targetCount, 'Shortlists');
    }
  }
}
