import prisma from '../src/config/prisma';
import { MandapamSession, MandapamPaymentStatus, MandapamPaymentMode } from '@prisma/client';

async function main() {
  console.log('Starting Mandapam data seeding...');

  // 1. Get Admin
  const admin = await prisma.admin.findFirst({
    where: { email: 'admin@mohanurkongu.com' }
  });

  if (!admin) {
    console.error('Admin user not found. Please run seed.ts first.');
    return;
  }

  // 2. Get Packages
  const packages = await prisma.mandapamPackage.findMany();
  if (packages.length === 0) {
    console.error('Packages not found. Please run seed_packages.ts first.');
    return;
  }

  const pkgStandard = packages.find(p => p.nameEn === 'Standard') || packages[0];
  const pkgRoyal = packages.find(p => p.nameEn === 'Royal') || packages[0];

  // 3. Clean up existing bookings and blocked dates for fresh seed
  console.log('Cleaning up existing mandapam data...');
  await prisma.mandapamBooking.deleteMany();
  await prisma.blockedDate.deleteMany();

  const now = new Date();
  
  // Create dates for next few days/months
  const d = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // 4. Create Bookings
  const bookings = [
    {
      eventId: 'MK0001',
      date: d(2), // 2 days from now
      session: MandapamSession.MORNING,
      eventTitleEn: 'Karthik & Priya Wedding',
      eventTitleTa: 'கார்த்திக் & பிரியா திருமணம்',
      contactNameEn: 'Gopalakrishnan',
      contactNameTa: 'கோபாலகிருஷ்ணன்',
      phone: '9845012345',
      packageId: pkgRoyal.id,
      packageNameEn: pkgRoyal.nameEn,
      packageNameTa: pkgRoyal.nameTa,
      packageSnapshotPrice: pkgRoyal.price,
      paymentMode: MandapamPaymentMode.UPI,
      paymentStatus: MandapamPaymentStatus.ADVANCE,
      totalAmount: pkgRoyal.price + 5000,
      paidAmount: 20000,
      balance: pkgRoyal.price + 5000 - 20000,
      createdBy: admin.id
    },
    {
      eventId: 'MK0002',
      date: d(5), // 5 days from now
      session: MandapamSession.FULL_DAY,
      eventTitleEn: 'Vijay & Meera Engagement',
      eventTitleTa: 'விஜய் & மீரா நிச்சயதார்த்தம்',
      contactNameEn: 'Selvam',
      contactNameTa: 'செல்வம்',
      phone: '9789054321',
      packageId: pkgStandard.id,
      packageNameEn: pkgStandard.nameEn,
      packageNameTa: pkgStandard.nameTa,
      packageSnapshotPrice: pkgStandard.price,
      paymentMode: MandapamPaymentMode.CASH,
      paymentStatus: MandapamPaymentStatus.FULLY_PAID,
      totalAmount: pkgStandard.price,
      paidAmount: pkgStandard.price,
      balance: 0,
      createdBy: admin.id
    },
    {
      eventId: 'MK0003',
      date: d(10), // 10 days from now
      session: MandapamSession.EVENING,
      eventTitleEn: 'Public Meeting - Farmers welfare',
      eventTitleTa: 'பொதுக்கூட்டம் - விவசாயிகள் நலன்',
      contactNameEn: 'Murugesan',
      contactNameTa: 'முருகேசன்',
      phone: '9123456789',
      packageId: pkgStandard.id,
      packageNameEn: pkgStandard.nameEn,
      packageNameTa: pkgStandard.nameTa,
      packageSnapshotPrice: pkgStandard.price,
      paymentMode: MandapamPaymentMode.BANK_TRANSFER,
      paymentStatus: MandapamPaymentStatus.NOT_PAID,
      totalAmount: pkgStandard.price,
      paidAmount: 0,
      balance: pkgStandard.price,
      createdBy: admin.id
    }
  ];

  console.log('Seeding bookings...');
  for (const booking of bookings) {
    await prisma.mandapamBooking.create({
      data: booking
    });
  }

  // 5. Create Blocked Dates
  const blockedDates = [
    {
      date: d(7), // 7 days from now
      reasonEn: 'Maintenance Work',
      reasonTa: 'பராமரிப்பு பணி'
    },
    {
      date: d(15), // 15 days from now
      reasonEn: 'Political Event (Internal)',
      reasonTa: 'அரசியல் நிகழ்ச்சி (உள்நாட்டு)'
    },
    {
      date: d(20), // 20 days from now
      reasonEn: 'Closed for Renovation',
      reasonTa: 'புதுப்பிக்கும் பணிகளுக்காக மூடப்பட்டுள்ளது'
    }
  ];

  console.log('Seeding blocked dates...');
  for (const bDate of blockedDates) {
    await prisma.blockedDate.create({
      data: bDate
    });
  }

  console.log('Mandapam data seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
