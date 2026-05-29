import type { PrismaClient } from '@prisma/client';
import { SEED_CONFIG, PASSWORD_HASH } from '../config.js';
import {
  randomInt, randomDateBefore, randomDateAfter, randomBool,
  pickRandom, generateAccountNo, generateDob, progressBar,
} from '../helpers.js';
import { MALE_NAMES_EN, FEMALE_NAMES_EN, SURNAMES_EN } from '../names.js';

export async function seedSecurityTestData(
  prisma: PrismaClient,
  accountIndex: Record<number, any>,
  refs: any,
  adminAccountIds: string[],
): Promise<void> {
  const userRole = refs.roles.find((r: any) => r.code === 'USER');
  const existingAccounts = Object.values(accountIndex).map((ai: any) => ai.account);
  const lastAccountNo = existingAccounts.length;
  let created = 0;
  const totalOps = 15;

  const baseAccount = existingAccounts[randomInt(0, existingAccounts.length - 1)];
  if (!baseAccount) return;

  const baseTranslation = await prisma.accountTranslation.findFirst({
    where: { accountId: baseAccount.id, language: 'EN' },
  });
  const baseName = baseTranslation?.firstName || 'Test';
  const baseSurName = baseTranslation?.lastName || 'User';
  const baseEmail = `${baseName.toLowerCase()}.dup1@example.com`;

  const dupAccount = await prisma.account.create({
    data: {
      accountNo: generateAccountNo(lastAccountNo + 1),
      currentState: 'ACTIVE',
      translations: {
        create: [
          { language: 'EN', firstName: baseName, lastName: baseSurName, isDefault: true },
          { language: 'TA', firstName: 'சந்தேகம்', lastName: 'பயனர்', isDefault: false },
        ],
      },
      credential: {
        create: {
          email: baseEmail,
          phone: `+91-${9000000000 + lastAccountNo + 1}`,
          passwordHash: PASSWORD_HASH,
          emailVerified: true,
          phoneVerified: true,
        },
      },
      roles: {
        create: [{ roleId: userRole.id }],
      },
      statusHistory: {
        create: {
          state: 'ACTIVE',
          reason: 'Account created',
          changedBy: 'system',
          changedAt: randomDateBefore(new Date(), randomInt(1, 30)),
        },
      },
    },
  });
  created++;
  progressBar(created, totalOps, 'Security Data');

  const spamAccount1 = await prisma.account.create({
    data: {
      accountNo: generateAccountNo(lastAccountNo + 2),
      currentState: 'ACTIVE',
      translations: {
        create: [
          { language: 'EN', firstName: 'Spam', lastName: 'Account', isDefault: true },
        ],
      },
      credential: {
        create: {
          email: `spam${lastAccountNo + 2}@example.com`,
          phone: `+91-${8000000000 + lastAccountNo + 2}`,
          passwordHash: PASSWORD_HASH,
          emailVerified: true,
          phoneVerified: false,
          failedLoginCount: 3,
        },
      },
      roles: {
        create: [{ roleId: userRole.id }],
      },
      statusHistory: {
        create: {
          state: 'ACTIVE',
          reason: 'Account created',
          changedBy: 'system',
          changedAt: new Date(),
        },
      },
    },
  });
  created++;
  progressBar(created, totalOps, 'Security Data');

  const spamAccount2 = await prisma.account.create({
    data: {
      accountNo: generateAccountNo(lastAccountNo + 3),
      currentState: 'ACTIVE',
      translations: {
        create: [
          { language: 'EN', firstName: 'Spam', lastName: 'Account2', isDefault: true },
        ],
      },
      credential: {
        create: {
          email: `spam${lastAccountNo + 3}@example.com`,
          phone: `+91-${8000000000 + lastAccountNo + 3}`,
          passwordHash: PASSWORD_HASH,
          emailVerified: true,
          phoneVerified: true,
          lastLoginAt: new Date(),
        },
      },
      roles: {
        create: [{ roleId: userRole.id }],
      },
      statusHistory: {
        create: {
          state: 'ACTIVE',
          reason: 'Account created',
          changedBy: 'system',
          changedAt: new Date(),
        },
      },
    },
  });
  created++;
  progressBar(created, totalOps, 'Security Data');

  const suspendedAccount1 = await prisma.account.create({
    data: {
      accountNo: generateAccountNo(lastAccountNo + 4),
      currentState: 'SUSPENDED',
      translations: {
        create: [
          { language: 'EN', firstName: 'Fraud', lastName: 'Profile', isDefault: true },
        ],
      },
      credential: {
        create: {
          email: `fraud${lastAccountNo + 4}@example.com`,
          phone: `+91-${7000000000 + lastAccountNo + 4}`,
          passwordHash: PASSWORD_HASH,
          emailVerified: true,
          phoneVerified: true,
          failedLoginCount: 8,
        },
      },
      roles: {
        create: [{ roleId: userRole.id }],
      },
      statusHistory: {
        create: {
          state: 'SUSPENDED',
          reason: 'Fraud detected: multiple fake profiles from same IP',
          changedBy: 'admin',
          changedAt: new Date(),
        },
      },
    },
  });
  created++;
  progressBar(created, totalOps, 'Security Data');

  const rapidVerifAccount = await prisma.account.create({
    data: {
      accountNo: generateAccountNo(lastAccountNo + 5),
      currentState: 'ACTIVE',
      translations: {
        create: [
          { language: 'EN', firstName: 'Rapid', lastName: 'User', isDefault: true },
        ],
      },
      credential: {
        create: {
          email: `rapid${lastAccountNo + 5}@example.com`,
          phone: `+91-${6000000000 + lastAccountNo + 5}`,
          passwordHash: PASSWORD_HASH,
          emailVerified: true,
          phoneVerified: true,
        },
      },
      roles: {
        create: [{ roleId: userRole.id }],
      },
      statusHistory: {
        create: {
          state: 'ACTIVE',
          reason: 'Account created',
          changedBy: 'system',
          changedAt: new Date(),
        },
      },
    },
  });
  created++;
  progressBar(created, totalOps, 'Security Data');

  if (adminAccountIds.length > 0) {
    const adminId = pickRandom(adminAccountIds);
    const fraudProfiles = [
      { accountId: spamAccount1.id, action: 'FRAUD_FLAGGED' },
      { accountId: spamAccount2.id, action: 'FRAUD_FLAGGED' },
      { accountId: suspendedAccount1.id, action: 'ACCOUNT_SUSPENDED' },
    ];

    for (const fp of fraudProfiles) {
      await prisma.adminAuditEvent.create({
        data: {
          actorId: adminId,
          profileId: null,
          action: fp.action,
          metadata: {
            fraudScore: randomInt(80, 99),
            flags: ['duplicate_account', 'suspicious_pattern', 'multiple_accounts_same_ip'],
            investigationStatus: 'confirmed',
          },
          createdAt: new Date(),
        },
      });
      created++;
      progressBar(created, totalOps, 'Security Data');
    }
  }

  for (let i = 0; i < 5; i++) {
    await prisma.accountVerification.create({
      data: {
        accountId: rapidVerifAccount.id,
        type: 'EMAIL',
        purpose: 'REGISTER',
        target: `rapid_attempt_${i}@example.com`,
        otpHash: `sim_fail_${i}`,
        state: 'EXPIRED',
        attempts: 5,
        maxAttempts: 5,
        expiresAt: new Date(Date.now() - randomInt(1, 10) * 86400000),
        createdAt: new Date(Date.now() - randomInt(1, 10) * 86400000),
      },
    });
    created++;
    progressBar(created, totalOps, 'Security Data');
  }

  progressBar(totalOps, totalOps, 'Security Data');
}

export async function seedAccountStatusTransitions(
  prisma: PrismaClient,
  accountIndex: Record<number, any>,
  adminAccountIds: string[],
): Promise<void> {
  const allAccounts = Object.values(accountIndex).map((ai: any) => ai.account);
  const suspendedAccounts = allAccounts.filter(a => a.currentState === 'SUSPENDED');

  for (const account of suspendedAccounts) {
    if (randomBool(20)) {
      await prisma.accountStatusHistory.create({
        data: {
          accountId: account.id,
          state: 'ACTIVE',
          reason: 'Account restored after review — suspend lifted',
          changedBy: 'admin',
          changedAt: randomDateBefore(new Date(), randomInt(1, 30)),
        },
      });

      await prisma.account.update({
        where: { id: account.id },
        data: { currentState: 'ACTIVE' },
      });
    }
  }
}
