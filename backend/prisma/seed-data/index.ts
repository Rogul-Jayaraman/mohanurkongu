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
import { seedProfileOpens, seedAdminAuditBulk } from './factories/audit.factory.js';
import { seedEdgeCases } from './factories/edge-case.factory.js';
import { seedSecurityTestData, seedAccountStatusTransitions } from './factories/security.factory.js';

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
  console.log('  MOHANUR KONGU MANAMALAI — ENHANCED TEST DATA GENERATION');
  console.log('━'.repeat(60));

  console.log('\n📊 Loading reference data...');
  const refs = await getReferenceIds(prisma);

  // ── Phase 1: Accounts ──
  console.log('\n🔷 Phase 1/12 — Generating account plans...');
  const accountPlans = generateAccountPlans(SEED_CONFIG.TOTAL_ACCOUNTS);

  console.log('\n🔷 Phase 1/12 — Seeding accounts...');
  const { accounts, accountIndex } = await seedAccounts(prisma, accountPlans, refs);
  console.log(`  Created ${accounts.length} accounts`);

  // ── Phase 2: Uploads ──
  console.log('\n🔷 Phase 2/12 — Seeding uploads...');
  const uploadIndex = await seedUploads(prisma, accountIndex);
  let totalUploaded = 0;
  const accountUploadCounts = { profile: 0, gallery: 0, horoscope: 0 };
  for (const entry of uploadIndex.byAccount.values()) {
    accountUploadCounts.profile += entry.profile.length;
    accountUploadCounts.gallery += entry.gallery.length;
    accountUploadCounts.horoscope += entry.horoscope.length;
    totalUploaded += entry.profile.length + entry.gallery.length + entry.horoscope.length;
  }
  console.log(`  Created ${uploadIndex.total} upload records (${accountUploadCounts.profile} profile, ${accountUploadCounts.gallery} gallery, ${accountUploadCounts.horoscope} horoscope usable)`);

  // ── Phase 3: Profiles ──
  console.log('\n🔷 Phase 3/12 — Seeding profiles...');
  const profileIndex = await seedProfiles(prisma, accountIndex, uploadIndex, refs);
  const profileCount = Object.keys(profileIndex).length;
  console.log(`  Created ${profileCount} profiles`);

  const activeCount = Object.values(profileIndex).filter((p: any) => p.status === 'ACTIVE').length;
  const pendingCount = Object.values(profileIndex).filter((p: any) => p.status === 'PENDING').length;
  const draftCount = Object.values(profileIndex).filter((p: any) => p.status === 'DRAFT').length;
  console.log(`    Active: ${activeCount} | Pending: ${pendingCount} | Draft: ${draftCount} | Other: ${profileCount - activeCount - pendingCount - draftCount}`);

  // ── Phase 4: Verification Queue + Reviews + Audit ──
  console.log('\n🔷 Phase 4/12 — Seeding verification & reviews...');
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

  // ── Phase 5: Additional Audit Events ──
  console.log('\n🔷 Phase 5/12 — Seeding additional audit events...');
  if (adminAccountIds.length > 0) {
    await seedAdditionalAuditEvents(prisma, profileIndex, adminAccountIds, SEED_CONFIG.TOTAL_AUDIT_EVENTS);
  }

  // ── Phase 6: Shortlists ──
  console.log('\n🔷 Phase 6/12 — Seeding shortlists...');
  await seedShortlists(prisma, profileIndex, accountIndex, SEED_CONFIG.TOTAL_SHORTLISTS);

  // ── Phase 7: Memberships ──
  console.log('\n🔷 Phase 7/12 — Seeding memberships...');
  await seedMemberships(prisma, accountIndex, refs.plans, SEED_CONFIG.TOTAL_MEMBERSHIPS, adminAccountIds);

  // ══ Get active subscription IDs for ProfileOpen ══
  const activeSubscriptions = await prisma.subscription.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });
  const activeSubscriptionIds = activeSubscriptions.map(s => s.id);

  // ── Phase 8: Profile Opens ──
  console.log('\n🔷 Phase 8/12 — Seeding profile opens...');
  await seedProfileOpens(prisma, profileIndex, accountIndex, activeSubscriptionIds, SEED_CONFIG.TOTAL_PROFILE_OPENS);

  // ── Phase 9: Sessions ──
  console.log('\n🔷 Phase 9/12 — Seeding sessions...');
  await seedSessions(prisma, accountIndex, SEED_CONFIG.TOTAL_SESSIONS);

  // ── Phase 10: Account Verifications ──
  console.log('\n🔷 Phase 10/12 — Seeding account verifications...');
  await seedAccountVerifications(prisma, accountIndex, SEED_CONFIG.TOTAL_VERIFICATIONS);

  // ══ Registration & Reset Sessions ══
  console.log('  → Seeding registration sessions...');
  await seedRegistrationSessions(prisma, SEED_CONFIG.TOTAL_REG_SESSIONS);
  console.log('  → Seeding reset sessions...');
  await seedResetSessions(prisma, SEED_CONFIG.TOTAL_RESET_SESSIONS);

  // ── Phase 11: Edge Cases ──
  console.log('\n🔷 Phase 11/12 — Seeding edge cases...');
  await seedEdgeCases(prisma, accountIndex, profileIndex, refs);

  // ── Phase 12: Security & Observability ──
  console.log('\n🔷 Phase 12/12 — Seeding security test data & state transitions...');
  await seedSecurityTestData(prisma, accountIndex, refs, adminAccountIds);
  await seedAccountStatusTransitions(prisma, accountIndex, adminAccountIds);

  if (adminAccountIds.length > 0) {
    console.log('  → Seeding bulk admin audit events...');
    await seedAdminAuditBulk(prisma, adminAccountIds, profileIndex, 500);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n' + '━'.repeat(60));
  console.log(`  ✅ ENHANCED TEST DATA GENERATION COMPLETE — ${elapsed}s`);
  console.log('━'.repeat(60));

  console.log('\n📋 Summary:');
  console.log(`  Accounts          : ${SEED_CONFIG.TOTAL_ACCOUNTS}`);
  console.log(`  Profiles          : ${profileCount}`);
  console.log(`    Active          : ${activeCount}`);
  console.log(`    Pending         : ${pendingCount}`);
  console.log(`    Draft           : ${draftCount}`);
  console.log(`    Rejected        : ${Object.values(profileIndex).filter((p: any) => p.status === 'REJECTED').length}`);
  console.log(`    Archived        : ${Object.values(profileIndex).filter((p: any) => p.status === 'ARCHIVED').length}`);
  console.log(`    Deleted         : ${Object.values(profileIndex).filter((p: any) => p.status === 'DELETED').length}`);
  console.log(`  Uploads           : ~${SEED_CONFIG.TOTAL_UPLOADS}`);
  console.log(`  Shortlists        : ${SEED_CONFIG.TOTAL_SHORTLISTS}`);
  console.log(`  Profile Opens     : ${SEED_CONFIG.TOTAL_PROFILE_OPENS}`);
  console.log(`  Verifications     : ${SEED_CONFIG.TOTAL_VERIFICATIONS}`);
  console.log(`  Audit Events      : ~${SEED_CONFIG.TOTAL_AUDIT_EVENTS + 500}`);
  console.log(`  Memberships       : ${SEED_CONFIG.TOTAL_MEMBERSHIPS}`);
  console.log(`  Sessions          : ${SEED_CONFIG.TOTAL_SESSIONS}`);
  console.log(`  Edge Cases        : ~30 profiles modified`);
  console.log(`  Security Accounts : ~5 special accounts`);
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
