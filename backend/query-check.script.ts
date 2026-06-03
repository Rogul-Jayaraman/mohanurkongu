import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const accountId = 'bc18247e-bec7-4c52-bf1b-a46c2e43dbbc';
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  console.log('Account:', JSON.stringify(account));
  
  // Also check a few heights
  const h122 = await prisma.height.findUnique({ where: { valueCm: 122 } });
  console.log('Height 122:', JSON.stringify(h122));
  
  const pf = await prisma.profileFor.findUnique({ where: { code: 'MYSELF' } });
  console.log('ProfileFor MYSELF:', JSON.stringify(pf));
  
  await prisma.$disconnect();
}
main();
