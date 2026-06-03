import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const accountId = 'bc18247e-bec7-4c52-bf1b-a46c2e43dbbc';
  
  try {
    // Step 1: Create profile
    const profile = await prisma.profile.create({
      data: { accountId, currentStatus: 'DRAFT' },
    });
    console.log('Profile created:', JSON.stringify(profile));

    // Step 2: Find profileFor by code
    const pf = await prisma.profileFor.findUnique({ where: { code: 'MYSELF' } });
    console.log('ProfileFor MYSELF:', JSON.stringify(pf));

    // Step 3: Find height by valueCm
    const h = await prisma.height.findUnique({ where: { valueCm: 122 } });
    console.log('Height 122:', JSON.stringify(h));

    // Step 4: Create ProfileBasic
    const basic = await prisma.profileBasic.create({
      data: {
        profileId: profile.id,
        profileForId: pf!.id,
        gender: 'MALE',
        dob: new Date('1995-06-15'),
        diet: 'VEGETARIAN',
        heightId: h!.id,
      },
    });
    console.log('ProfileBasic created:', JSON.stringify(basic));

    // Step 5: Create ProfileTranslation
    const trans = await prisma.profileTranslation.create({
      data: {
        profileId: profile.id,
        language: 'EN',
        firstName: 'Test',
        lastName: 'User',
      },
    });
    console.log('Translation created:', JSON.stringify(trans));

    // Cleanup
    await prisma.profileTranslation.deleteMany({ where: { profileId: profile.id } });
    await prisma.profileBasic.deleteMany({ where: { profileId: profile.id } });
    await prisma.profile.delete({ where: { id: profile.id } });
    console.log('Cleanup complete');
  } catch (err) {
    console.error('Error:', err);
  }
  await prisma.$disconnect();
}
main();
