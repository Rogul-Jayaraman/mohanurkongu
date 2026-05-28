import { PrismaClient } from '@prisma/client';
import { SEED_CONFIG, getReferenceIds } from './config.js';
import { initRng, resetRng, progressBar } from './helpers.js';
import { generateAccountPlans, seedAccounts } from './factories/account.factory.js';
import { seedUploads } from './factories/upload.factory.js';
import { seedProfiles } from './factories/profile.factory.js';
import { seedShortlists } from './factories/shortlist.factory.js';
import { seedVerificationAndAudit, seedAdditionalAuditEvents } from './factories/verification.factory.js';
import { seedMemberships } from './factories/membership.factory.js';
import { seedSessions } from './factories/session.factory.js';
import {
  seedAccountVerifications,
  seedRegistrationSessions,
  seedResetSessions,
} from './factories/activity.factory.js';

const prisma = new PrismaClient();

export async function generateTestData(): Promise<void> {
  const startTime = Date.now();

  const seedEnv = process.env.SEED || '42';
  if (process.env.RANDOMIZE === 'true') {
    resetRng();
    console.log('\n🧬 Using randomized seed');
  } else {
    initRng(seedEnv);
    console.log(`\n🧬 Using deterministic seed: ${seedEnv}`);
  }

  console.log('━'.repeat(60));
  console.log('  MOHANUR KONGU MANAMALAI — TEST DATA GENERATION');
  console.log('━'.repeat(60));

  console.log('\n📊 Loading reference data...');
  const refs = await getReferenceIds(prisma);
  console.log(`  Loaded ${refs.heights.length} heights, ${refs.districts.size} districts, ${refs.kulams.length} kulams`);

  // Phase 1: Accounts
  console.log('\n🔷 Phase 1/10 — Generating account plans...');
  const accountPlans = generateAccountPlans(SEED_CONFIG.TOTAL_ACCOUNTS);

  console.log('\n🔷 Phase 1/10 — Seeding accounts...');
  const { accounts, accountIndex } = await seedAccounts(prisma, accountPlans, refs);
  console.log(`  Created ${accounts.length} accounts`);

  // Phase 2: Uploads
  console.log('\n🔷 Phase 2/10 — Seeding uploads...');
  const uploadIds = await seedUploads(prisma, accountIndex);
  console.log(`  Created ${uploadIds.length} upload records`);

  // Phase 3: Profiles
  console.log('\n🔷 Phase 3/10 — Seeding profiles...');
  const profileIndex = await seedProfiles(prisma, accountIndex, uploadIds, refs);
  const profileCount = Object.keys(profileIndex).length;
  console.log(`  Created ${profileCount} profiles`);

  const activeCount = Object.values(profileIndex).filter((p: any) => p.status === 'ACTIVE').length;
  const pendingCount = Object.values(profileIndex).filter((p: any) => p.status === 'PENDING').length;
  console.log(`    Active: ${activeCount} | Pending: ${pendingCount} | Other: ${profileCount - activeCount - pendingCount}`);

  // Phase 4: Verification Queue + Reviews + Audit
  console.log('\n🔷 Phase 4/10 — Seeding verification & reviews...');
  const adminAccounts = await prisma.account.findMany({
    where: { roles: { some: { role: { code: 'ADMIN' } } } },
    select: { id: true },
  });
  const adminAccountIds = adminAccounts.map(a => a.id);

  if (adminAccountIds.length === 0) {
    console.log('  ⚠ No admin account found. Skipping admin verification seed.');
  } else {
    await seedVerificationAndAudit(prisma, profileIndex, adminAccountIds);
  }

  // Phase 5: Additional Audit Events
  console.log('\n🔷 Phase 5/10 — Seeding additional audit events...');
  if (adminAccountIds.length > 0) {
    await seedAdditionalAuditEvents(prisma, profileIndex, adminAccountIds, 1500);
  }

  // Phase 6: Shortlists
  console.log('\n🔷 Phase 6/10 — Seeding shortlists...');
  await seedShortlists(prisma, profileIndex, accountIndex, 3000);

  // Phase 7: Memberships
  console.log('\n🔷 Phase 7/10 — Seeding memberships...');
  await seedMemberships(prisma, accountIndex, refs.plans, 750);

  // Phase 8: Sessions
  console.log('\n🔷 Phase 8/10 — Seeding sessions...');
  await seedSessions(prisma, accountIndex, 2500);

  // Phase 9: Account Verifications
  console.log('\n🔷 Phase 9/10 — Seeding account verifications...');
  await seedAccountVerifications(prisma, accountIndex, 1200);

  // Phase 10: Registration & Reset Sessions
  console.log('\n🔷 Phase 10/10 — Seeding registration/reset sessions...');
  await seedRegistrationSessions(prisma, 350);
  await seedResetSessions(prisma, 100);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n' + '━'.repeat(60));
  console.log(`  ✅ TEST DATA GENERATION COMPLETE — ${elapsed}s`);
  console.log('━'.repeat(60));

  console.log('\n📋 Summary:');
  console.log(`  Accounts      : ${SEED_CONFIG.TOTAL_ACCOUNTS}`);
  console.log(`  Profiles      : ${profileCount}`);
  console.log(`  Uploads       : ${uploadIds.length}`);
  console.log(`  Shortlists    : 3000`);
  console.log(`  Verifications : 1200`);
  console.log(`  Admin Events  : ~1500`);
  console.log(`  Memberships   : 750`);
  console.log(`  Sessions      : 2500`);
}

const { pathToFileURL } = await import('node:url');
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  (async () => {
    try {
      await generateTestData();
    } catch (e) {
      console.error('\n❌ Test data generation failed:', e);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  })();
}
