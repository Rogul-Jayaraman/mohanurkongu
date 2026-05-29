import type { PrismaClient } from '@prisma/client';
import { SEED_CONFIG, PASSWORD_HASH } from '../config.js';
import {
  random, randomInt, weightedPick, weightedPickRaw, randomDate,
  generateAccountNo, clampNormal, randomBool, pickRandom,
  progressBar, pickWeightedFromMap,
} from '../helpers.js';
import {
  MALE_NAMES_EN, MALE_NAMES_TA,
  FEMALE_NAMES_EN, FEMALE_NAMES_TA,
  SURNAMES_EN, SURNAMES_TA,
} from '../names.js';

export interface AccountPlan {
  id: string;
  accountNo: string;
  gender: string;
  age: number;
  nameEn: string;
  nameTa: string;
  surNameEn: string;
  surNameTa: string;
  diet: string;
  maritalStatus: string;
  heightCm: number;
  complexion: string;
  bloodGroup: string;
  profileFor: string;
  createdAt: Date;
  isSuspended: boolean;
  isLocked: boolean;
  suspensionReason?: { reasonEn: string; reasonTa: string };
  failedLoginCount: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  isAdmin: boolean;
}

export function generateAccountPlans(count: number): AccountPlan[] {
  const plans: AccountPlan[] = [];
  const adminCount = 5;

  for (let i = 0; i < count; i++) {
    const isAdmin = i < adminCount;
    const gender = isAdmin ? 'MALE' : weightedPick(SEED_CONFIG.GENDER_DISTRIBUTION);
    const isFemale = gender === 'FEMALE';
    const isMale = gender === 'MALE';

    const age = isFemale
      ? clampNormal(SEED_CONFIG.AGE_FEMALE.mean, SEED_CONFIG.AGE_FEMALE.stddev, SEED_CONFIG.AGE_FEMALE.min, SEED_CONFIG.AGE_FEMALE.max)
      : isMale
        ? clampNormal(SEED_CONFIG.AGE_MALE.mean, SEED_CONFIG.AGE_MALE.stddev, SEED_CONFIG.AGE_MALE.min, SEED_CONFIG.AGE_MALE.max)
        : randomInt(20, 40);

    const nameEn = isFemale ? pickRandom(FEMALE_NAMES_EN) : pickRandom(MALE_NAMES_EN);
    const nameTa = isFemale ? pickRandom(FEMALE_NAMES_TA) : pickRandom(MALE_NAMES_TA);
    const surNameEn = pickRandom(SURNAMES_EN);
    const surNameTa = pickRandom(SURNAMES_TA);

    const diet = weightedPick(SEED_CONFIG.DIET_DISTRIBUTION);
    const maritalStatus = weightedPick(SEED_CONFIG.MARITAL_STATUS_DISTRIBUTION);
    const complexion = weightedPick(SEED_CONFIG.COMPLEXION_DISTRIBUTION);
    const bloodGroup = weightedPick(SEED_CONFIG.BLOOD_GROUP_DISTRIBUTION);
    const profileFor = isAdmin ? 'MYSELF' : weightedPick(SEED_CONFIG.PROFILE_FOR_DISTRIBUTION);

    const heightCm = isFemale
      ? clampNormal(SEED_CONFIG.HEIGHT_FEMALE.mean, SEED_CONFIG.HEIGHT_FEMALE.stddev, SEED_CONFIG.HEIGHT_FEMALE.min, SEED_CONFIG.HEIGHT_FEMALE.max)
      : isMale
        ? clampNormal(SEED_CONFIG.HEIGHT_MALE.mean, SEED_CONFIG.HEIGHT_MALE.stddev, SEED_CONFIG.HEIGHT_MALE.min, SEED_CONFIG.HEIGHT_MALE.max)
        : randomInt(150, 180);

    const daysAgo = isAdmin
      ? randomInt(200, 365)
      : randomInt(1, 365);
    const createdAt = new Date(Date.now() - daysAgo * 86400000 - randomInt(0, 86400) * 1000);

    const isSuspended = !isAdmin && random() < SEED_CONFIG.ACCOUNTS_SUSPENDED_PCT;
    const isLocked = !isAdmin && random() < SEED_CONFIG.ACCOUNTS_LOCKED_PCT;

    let suspensionReason: { reasonEn: string; reasonTa: string } | undefined;
    if (isSuspended) {
      suspensionReason = weightedPickRaw(
        SEED_CONFIG.SUSPENDED_REASONS.map(r => r),
        SEED_CONFIG.SUSPENDED_REASONS.map(r => r.weight),
      ) as any;
    }

    const failedLoginCount = isLocked ? randomInt(5, 10) : randomInt(0, 4);
    const emailVerified = isAdmin || randomBool(88);
    const phoneVerified = isAdmin || randomBool(75);

    plans.push({
      id: '',
      accountNo: generateAccountNo(i + 1),
      gender,
      age,
      nameEn: isAdmin ? `Admin${i}` : nameEn,
      nameTa: isAdmin ? `நிர்வாகி${i}` : nameTa,
      surNameEn: isAdmin ? 'Mohanur' : surNameEn,
      surNameTa: isAdmin ? 'மோகனூர்' : surNameTa,
      diet,
      maritalStatus,
      heightCm,
      complexion,
      bloodGroup,
      profileFor,
      createdAt,
      isSuspended,
      isLocked,
      suspensionReason,
      failedLoginCount,
      emailVerified,
      phoneVerified,
      isAdmin,
    });
  }

  return plans;
}

export async function seedAccounts(
  prisma: PrismaClient,
  plans: AccountPlan[],
  refs: any,
): Promise<{ accounts: any[]; accountIndex: Record<number, any> }> {
  const accounts: any[] = [];
  const accountIndex: Record<number, any> = {};
  const userRole = refs.roles.find((r: any) => r.code === 'USER');
  const adminRole = refs.roles.find((r: any) => r.code === 'ADMIN');

  for (let i = 0; i < plans.length; i++) {
    const p = plans[i];
    const email = p.isAdmin
      ? `admin${i}@mohanurkongu.com`
      : `${p.nameEn.toLowerCase()}.${p.surNameEn.toLowerCase().replace(/\s+/g, '')}${1000 + i}@example.com`;
    const phone = `+91-${9000000000 + i}`;

    const lockedUntil = p.isLocked ? randomDate(new Date(), new Date(Date.now() + 7 * 86400000)) : undefined;

    const account = await prisma.account.create({
      data: {
        accountNo: p.accountNo,
        currentState: p.isSuspended ? 'SUSPENDED' : 'ACTIVE',
        translations: {
          create: [
            { language: 'EN', firstName: p.nameEn, lastName: p.surNameEn, isDefault: true },
            { language: 'TA', firstName: p.nameTa, lastName: p.surNameTa, isDefault: false },
          ],
        },
        credential: {
          create: {
            email,
            phone,
            passwordHash: PASSWORD_HASH,
            emailVerified: p.emailVerified,
            phoneVerified: p.phoneVerified,
            failedLoginCount: p.failedLoginCount,
            lockedUntil,
            lastLoginAt: randomDate(new Date(p.createdAt), new Date()),
          },
        },
        roles: {
          create: p.isAdmin
            ? [{ roleId: userRole.id }, { roleId: adminRole.id }]
            : [{ roleId: userRole.id }],
        },
        statusHistory: {
          create: {
            state: p.isSuspended ? 'SUSPENDED' : 'ACTIVE',
            reason: p.isSuspended ? (p.suspensionReason?.reasonEn || 'Suspended') : 'Account created',
            changedBy: 'system',
            changedAt: p.createdAt,
          },
        },
      },
      include: {
        translations: true,
        credential: true,
        roles: { include: { role: true } },
      },
    });

    plans[i].id = account.id;
    accounts.push(account);
    accountIndex[i] = {
      account,
      plan: p,
      profileId: null,
    };

    progressBar(i + 1, plans.length, 'Accounts');
  }

  return { accounts, accountIndex };
}
