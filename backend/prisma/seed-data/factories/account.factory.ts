import type { PrismaClient } from '@prisma/client';
import { SEED_CONFIG } from '../config.js';
import {
  random, randomInt, weightedPick, weightedPickRaw, randomDate,
  generateAccountNo, clampNormal, randomBool, pickRandom,
  progressBar,
} from '../helpers.js';
import {
  MALE_NAMES_EN, MALE_NAMES_TA,
  FEMALE_NAMES_EN, FEMALE_NAMES_TA,
  SURNAMES_EN, SURNAMES_TA,
  FATHER_MOTHER_NAMES_EN,
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
  suspensionReason?: { reasonEn: string; reasonTa: string };
}

export function generateAccountPlans(count: number): AccountPlan[] {
  const plans: AccountPlan[] = [];

  for (let i = 0; i < count; i++) {
    const gender = weightedPick(SEED_CONFIG.GENDER_DISTRIBUTION);
    const isFemale = gender === 'FEMALE';
    const isMale = gender === 'MALE';

    const age = isFemale
      ? clampNormal(SEED_CONFIG.AGE_FEMALE.mean, SEED_CONFIG.AGE_FEMALE.stddev, SEED_CONFIG.AGE_FEMALE.min, SEED_CONFIG.AGE_FEMALE.max)
      : isMale
        ? clampNormal(SEED_CONFIG.AGE_MALE.mean, SEED_CONFIG.AGE_MALE.stddev, SEED_CONFIG.AGE_MALE.min, SEED_CONFIG.AGE_MALE.max)
        : randomInt(20, 40);

    const maleNamesEn = MALE_NAMES_EN;
    const femaleNamesEn = FEMALE_NAMES_EN;
    const maleNamesTa = MALE_NAMES_TA;
    const femaleNamesTa = FEMALE_NAMES_TA;

    const nameEn = isFemale ? pickRandom(femaleNamesEn) : pickRandom(maleNamesEn);
    const nameTa = isFemale ? pickRandom(femaleNamesTa) : pickRandom(maleNamesTa);
    const surNameEn = pickRandom(SURNAMES_EN);
    const surNameTa = pickRandom(SURNAMES_TA);

    const diet = weightedPick(SEED_CONFIG.DIET_DISTRIBUTION);
    const maritalStatus = weightedPick(SEED_CONFIG.MARITAL_STATUS_DISTRIBUTION);
    const complexion = weightedPick(SEED_CONFIG.COMPLEXION_DISTRIBUTION);
    const bloodGroup = weightedPick(SEED_CONFIG.BLOOD_GROUP_DISTRIBUTION);
    const profileFor = weightedPick(SEED_CONFIG.PROFILE_FOR_DISTRIBUTION);

    const heightCm = isFemale
      ? clampNormal(SEED_CONFIG.HEIGHT_FEMALE.mean, SEED_CONFIG.HEIGHT_FEMALE.stddev, SEED_CONFIG.HEIGHT_FEMALE.min, SEED_CONFIG.HEIGHT_FEMALE.max)
      : isMale
        ? clampNormal(SEED_CONFIG.HEIGHT_MALE.mean, SEED_CONFIG.HEIGHT_MALE.stddev, SEED_CONFIG.HEIGHT_MALE.min, SEED_CONFIG.HEIGHT_MALE.max)
        : randomInt(150, 180);

    const daysAgo = randomInt(1, 365);
    const createdAt = new Date(Date.now() - daysAgo * 86400000 - randomInt(0, 86400) * 1000);

    const isSuspended = random() < SEED_CONFIG.ACCOUNTS_SUSPENDED_PCT;

    let suspensionReason: { reasonEn: string; reasonTa: string } | undefined;
    if (isSuspended) {
      suspensionReason = weightedPickRaw(
        SEED_CONFIG.SUSPENDED_REASONS.map(r => r),
        SEED_CONFIG.SUSPENDED_REASONS.map(r => r.weight),
      ) as any;
    }

    plans.push({
      id: '',
      accountNo: generateAccountNo(i + 1),
      gender,
      age,
      nameEn,
      nameTa,
      surNameEn,
      surNameTa,
      diet,
      maritalStatus,
      heightCm,
      complexion,
      bloodGroup,
      profileFor,
      createdAt,
      isSuspended,
      suspensionReason,
    });
  }

  return plans;
}

export async function seedAccounts(
  prisma: PrismaClient,
  plans: AccountPlan[],
  refs: any,
): Promise<{ accounts: any[]; accountIndex: any }> {
  const accounts: any[] = [];
  const accountIndex: Record<number, any> = {};
  const userRole = refs.roles.find((r: any) => r.code === 'USER');
  const adminRole = refs.roles.find((r: any) => r.code === 'ADMIN');

  const passwordHash = '$argon2id$v=19$m=65536,t=3,p=4$SEED_DATA_PLACEHOLDER';

  for (let i = 0; i < plans.length; i++) {
    const p = plans[i];

    const email = `${p.nameEn.toLowerCase()}.${p.surNameEn.toLowerCase().replace(/\s+/g, '')}${1000 + i}@example.com`;
    const phone = `+91-${9000000000 + i}`;

    const isAdmin = i < 3 || randomBool(1);

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
            passwordHash,
            emailVerified: true,
            phoneVerified: randomBool(80),
            lastLoginAt: randomDate(new Date(p.createdAt), new Date()),
          },
        },
        roles: {
          create: isAdmin
            ? [{ roleId: userRole.id }, { roleId: adminRole.id }]
            : [{ roleId: userRole.id }],
        },
        statusHistory: {
          create: {
            state: p.isSuspended ? 'SUSPENDED' : 'ACTIVE',
            reason: p.isSuspended ? p.suspensionReason?.reasonEn || 'Suspended' : 'Account created',
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
