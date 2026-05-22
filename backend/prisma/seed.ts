import prisma from '../src/config/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const adminEmail = 'admin@mohanurkongu.com';
  const adminPhone = '9000000000';
  
  // Hash initial admin password
  const hashedPassword = await bcrypt.hash('admin123', 10);

  console.log('Seeding admin account...');
  
  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword
    },
    create: {
      fullnameEn: 'Admin User',
      fullnameTa: 'நிர்வாகி',
      email: adminEmail,
      phone: adminPhone,
      password: hashedPassword,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
