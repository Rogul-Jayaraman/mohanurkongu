import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const profileId = '6ff628ba-1093-45c8-8d86-f3c1beb09f93';

  const trans = await prisma.profileTranslation.findMany({
    where: { profileId },
  });
  console.log('Translations:', JSON.stringify(trans, null, 2));
  
  const basic = await prisma.profileBasic.findUnique({
    where: { profileId },
    include: { profileFor: true, height: true },
  });
  console.log('Basic:', JSON.stringify(basic, null, 2));
  
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
  });
  console.log('Profile:', JSON.stringify(profile, null, 2));

  await prisma.$disconnect();
}
main();
