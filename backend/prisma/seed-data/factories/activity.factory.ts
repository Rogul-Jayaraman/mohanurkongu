import type { PrismaClient } from '@prisma/client';
import { SEED_CONFIG } from '../config.js';
import {
  randomInt, randomDate, randomDateBefore, randomDateAfter, randomBool,
  pickRandom, weightedPickRaw, progressBar,
} from '../helpers.js';

export async function seedAccountVerifications(
  prisma: PrismaClient,
  accountIndex: Record<number, any>,
  targetCount: number,
): Promise<void> {
  const purposes = SEED_CONFIG.VERIFICATION_PURPOSE_DISTRIBUTION.map(p => p.value);
  const purposeWeights = SEED_CONFIG.VERIFICATION_PURPOSE_DISTRIBUTION.map(p => p.weight);
  const stateOpts = SEED_CONFIG.VERIFICATION_STATE_DISTRIBUTION.map(s => s.value);
  const stateWeights = SEED_CONFIG.VERIFICATION_STATE_DISTRIBUTION.map(s => s.weight);

  let created = 0;
  const batchSize = 100;

  for (let b = 0; b < targetCount; b += batchSize) {
    const batch = Math.min(batchSize, targetCount - b);

    for (let i = 0; i < batch; i++) {
      const accIndex = randomInt(0, Object.keys(accountIndex).length - 1);
      const accountEntry = Object.values(accountIndex)[accIndex] as any;
      if (!accountEntry) continue;

      const purpose = weightedPickRaw(purposes, purposeWeights) as string;
      const state = weightedPickRaw(stateOpts, stateWeights) as string;
      const target = accountEntry.account.credential?.email || `user${randomInt(1000, 9999)}@example.com`;
      const otpHash = `sim_otp_${Math.random().toString(36).slice(2, 10)}`;
      const createdAt = randomDateBefore(new Date(), 90);
      const expiresAt = new Date(createdAt.getTime() + 10 * 60000);

      await prisma.accountVerification.create({
        data: {
          accountId: accountEntry.account.id,
          type: target.includes('@') ? 'EMAIL' : 'PHONE',
          purpose: purpose as any,
          target,
          otpHash,
          state: state as any,
          attempts: randomInt(1, 3),
          maxAttempts: 5,
          expiresAt: state === 'EXPIRED' ? new Date(Date.now() - randomInt(1, 5) * 86400000) : expiresAt,
          consumedAt: state === 'VERIFIED' ? randomDate(createdAt, expiresAt) : null,
          archivedAt: state === 'ARCHIVED' ? randomDateAfter(expiresAt, 7) : null,
          createdAt,
        },
      });

      created++;
    }

    progressBar(created, targetCount, 'Verifications');
  }
}

export async function seedRegistrationSessions(
  prisma: PrismaClient,
  verifications: number,
): Promise<void> {
  const verifRecords = await prisma.accountVerification.findMany({
    where: { purpose: 'REGISTER', state: { in: ['VERIFIED', 'EXPIRED'] } },
    take: verifications,
    select: { id: true, target: true },
  });

  for (let i = 0; i < verifRecords.length && i < verifications; i++) {
    const vr = verifRecords[i];
    const expiresAt = new Date(Date.now() + randomInt(1, 24) * 3600000);
    const isUsed = randomBool(70);

    await prisma.registrationSession.create({
      data: {
        verificationId: vr.id,
        snapshotTarget: vr.target,
        expiresAt: isUsed ? new Date(Date.now() - randomInt(1, 5) * 86400000) : expiresAt,
        usedAt: isUsed ? new Date() : null,
      },
    });
  }
}

export async function seedResetSessions(
  prisma: PrismaClient,
  count: number,
): Promise<void> {
  const verifRecords = await prisma.accountVerification.findMany({
    where: { purpose: 'RESET_PASSWORD' },
    take: count,
    select: { id: true, target: true },
  });

  for (let i = 0; i < verifRecords.length && i < count; i++) {
    const vr = verifRecords[i];
    const isUsed = randomBool(60);
    const expiresAt = new Date(Date.now() + randomInt(1, 24) * 3600000);

    await prisma.resetSession.create({
      data: {
        verificationId: vr.id,
        snapshotTarget: vr.target,
        expiresAt: isUsed ? new Date(Date.now() - randomInt(1, 10) * 86400000) : expiresAt,
        usedAt: isUsed ? new Date() : null,
      },
    });
  }
}
