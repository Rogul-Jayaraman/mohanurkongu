import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyIndexes() {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_profile_gender ON "Profile" (gender);',
    'CREATE INDEX IF NOT EXISTS idx_profile_current_district ON "Profile" ("currentDistrict");',
    'CREATE INDEX IF NOT EXISTS idx_profile_kulam ON "Profile" (kulam);',
    'CREATE INDEX IF NOT EXISTS idx_profile_dosham ON "Profile" (dosham);',
    'CREATE INDEX IF NOT EXISTS idx_profile_star ON "Profile" (star);',
    'CREATE INDEX IF NOT EXISTS idx_profile_rasi ON "Profile" (rasi);',
    'CREATE INDEX IF NOT EXISTS idx_profile_height ON "Profile" (height);',
    'CREATE INDEX IF NOT EXISTS idx_profile_salary ON "Profile" ("salaryMonthly");',
    'CREATE INDEX IF NOT EXISTS idx_profile_marital_status ON "Profile" ("maritalStatus");',
    'CREATE INDEX IF NOT EXISTS idx_profile_diet ON "Profile" (diet);',
    'CREATE INDEX IF NOT EXISTS idx_profile_gender_status_verified ON "Profile" (gender, status, "adminVerified");',
    'CREATE INDEX IF NOT EXISTS idx_mandapam_booking_date ON "MandapamBooking" (date);',
    'CREATE INDEX IF NOT EXISTS idx_mandapam_booking_payment ON "MandapamBooking" ("paymentStatus");',
    'CREATE INDEX IF NOT EXISTS idx_mandapam_booking_created_by ON "MandapamBooking" ("createdBy");',
    'CREATE INDEX IF NOT EXISTS idx_shortlist_user ON "Shortlist" ("userId");',
  ];

  console.log('Applying indexes...');
  for (const sql of indexes) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('  OK:', sql.substring(0, 70));
    } catch (err) {
      console.error('  FAIL:', sql.substring(0, 70), err);
    }
  }
  console.log('All indexes applied.');
  await prisma.$disconnect();
}

applyIndexes();
