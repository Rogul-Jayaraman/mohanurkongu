import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const pf = await prisma.profileFor.findMany({ take: 10 });
  console.log('ProfileFors:', JSON.stringify(pf));
  const h = await prisma.height.findMany({ take: 10 });
  console.log('Heights:', JSON.stringify(h));
  await prisma.$disconnect();
}
main();
