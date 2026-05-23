import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = await Promise.all([
    prisma.role.upsert({ where: { code: 'USER' }, update: {}, create: { code: 'USER' } }),
    prisma.role.upsert({ where: { code: 'ADMIN' }, update: {}, create: { code: 'ADMIN' } }),
  ]);
  console.log(`Seeded ${roles.length} roles`);

  const plans = await Promise.all([
    prisma.membershipPlan.upsert({
      where: { code: 'BASIC' },
      update: {},
      create: { code: 'BASIC', displayName: 'Basic', price: 0, currency: 'INR', active: true },
    }),
    prisma.membershipPlan.upsert({
      where: { code: 'PREMIUM' },
      update: {},
      create: { code: 'PREMIUM', displayName: 'Premium', price: 500, currency: 'INR', active: true },
    }),
  ]);
  console.log(`Seeded ${plans.length} membership plans`);

  const counter = await prisma.accountNoCounter.upsert({
    where: { prefix: 'MKM' },
    update: {},
    create: { prefix: 'MKM', counter: 0 },
  });
  console.log(`Seeded account no counter: ${counter.prefix}-${counter.counter}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
