/// <reference types="node" />
import prisma from '../src/config/prisma';
import { ProfileFor, Gender, MaritalStatus, Diet, Complexion, JobSector, Dosham, Residence, AccountPlan, AccountRole, AccountStatus, ProfileVisibility, VerificationStatus, HoroscopeMode, Rasi, Nakshatra, Kulam, District, MandapamSession, MandapamPaymentStatus, MandapamPaymentMode } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

async function clearDatabase() {
  console.log('Clearing existing data...');
  // Delete in order of dependecies
  await prisma.mandapamBooking.deleteMany();
  await prisma.mandapamPackage.deleteMany();
  await prisma.planTransaction.deleteMany();
  await prisma.horoscope.deleteMany();
  await prisma.shortlist.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.blockedDate.deleteMany();
  await prisma.registrationCounter.deleteMany();
}

async function main() {
  await clearDatabase();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Admins
  console.log('Creating admins...');
  const systemAdmin = await prisma.admin.create({
    data: {
      fullnameEn: 'System Administrator',
      fullnameTa: 'நிர்வாகி',
      email: 'admin@mohanurmatrimony.com',
      phone: '1234567890',
      password: hashedPassword,
    }
  });

  // 2. Create Mandapam Packages
  console.log('Creating mandapam packages...');
  const packages = [];
  const packageNames = [
    { en: 'Basic Marriage Package', ta: 'அடிப்படை திருமண தொகுப்பு', price: 25000 },
    { en: 'Premium Wedding Package', ta: 'பிரீமியம் திருமண தொகுப்பு', price: 50000 },
    { en: 'Grand Celebration Package', ta: 'பிரம்மாண்ட கொண்டாட்ட தொகுப்பு', price: 100000 },
  ];

  for (const pkg of packageNames) {
    const createdPkg = await prisma.mandapamPackage.create({
      data: {
        nameEn: pkg.en,
        nameTa: pkg.ta,
        price: pkg.price,
        featuresEn: ['Stage Decoration', 'Basic Lighting', 'Sound System'],
        featuresTa: ['மேடை அலங்காரம்', 'அடிப்படை விளக்குகள்', 'ஒலி அமைப்பு'],
      }
    });
    packages.push(createdPkg);
  }

  // 3. Create Users and Profiles
  console.log('Creating users and profiles...');
  const districts = Object.values(District);
  const rasias = Object.values(Rasi);
  const nakshatras = Object.values(Nakshatra);
  const kulams = Object.values(Kulam);

  for (let i = 1; i <= 20; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName });
    const phone = faker.string.numeric(10);
    const customId = `ID-${i.toString().padStart(4, '0')}`;

    console.log(`Creating user ${i}: ${firstName} ${lastName}...`);
    const user = await prisma.user.create({
      data: {
        customId,
        fullnameEn: `${firstName} ${lastName}`,
        fullnameTa: `${firstName} ${lastName} (Ta)`,
        email,
        phone,
        password: hashedPassword,
        role: AccountRole.USER,
        plan: AccountPlan.BASIC,
        accountStatus: AccountStatus.ACTIVE,
      }
    });

    // Create 1 profile for each user
    const gender = i % 2 === 0 ? Gender.MALE : Gender.FEMALE;
    const district = faker.helpers.arrayElement(districts);
    const districtCode = district.substring(0, 3).toUpperCase();
    
    // Increment counter for regNo manually for mock data
    await prisma.registrationCounter.upsert({
      where: { districtCode },
      update: { count: { increment: 1 } },
      create: { districtCode, count: 1 },
    });
    
    const counter = await prisma.registrationCounter.findUnique({ where: { districtCode } });
    const regNo = `${districtCode}-${(counter?.count || 1).toString().padStart(4, '0')}`;

    await prisma.profile.create({
      data: {
        userId: user.id,
        regNo,
        profileFor: ProfileFor.MYSELF,
        nameEn: user.fullnameEn,
        nameTa: user.fullnameTa,
        dob: faker.date.birthdate({ min: 20, max: 40, mode: 'age' }),
        gender,
        maritalStatus: MaritalStatus.NEVER_MARRIED,
        currentDistrict: district,
        currentCityEn: faker.location.city(),
        currentStateEn: 'Tamil Nadu',
        currentCountryEn: 'India',
        nativeDistrict: district,
        bloodGroup: faker.helpers.arrayElement(['A+ve', 'B+ve', 'O+ve', 'AB+ve']),
        height: faker.number.float({ min: 5.0, max: 6.5, fractionDigits: 1 }),
        weight: faker.number.int({ min: 50, max: 90 }),
        diet: faker.helpers.arrayElement(Object.values(Diet)),
        complexion: faker.helpers.arrayElement(Object.values(Complexion)),
        kulam: faker.helpers.arrayElement(kulams),
        star: faker.helpers.arrayElement(nakshatras),
        rasi: faker.helpers.arrayElement(rasias),
        dosham: Dosham.NO,
        education: faker.helpers.arrayElement(['B.E.', 'B.Tech', 'M.B.A.', 'M.C.A.', 'M.B.B.S.']),
        jobDetail: faker.person.jobTitle(),
        jobSector: faker.helpers.arrayElement(Object.values(JobSector)),
        salaryMonthly: faker.number.int({ min: 30000, max: 200000 }),
        status: ProfileVisibility.ACTIVE,
        adminVerified: VerificationStatus.ACCEPTED,
        verifiedBy: systemAdmin.id,
        verifiedAt: new Date(),
      }
    });
  }

  // 4. Create Mandapam Bookings
  console.log('Creating mandapam bookings...');
  for (let i = 1; i <= 10; i++) {
    const pkg = faker.helpers.arrayElement(packages);
    const date = faker.date.future();
    const session = faker.helpers.arrayElement(Object.values(MandapamSession));
    const eventId = `MK${i.toString().padStart(4, '0')}`;

    await prisma.mandapamBooking.create({
      data: {
        eventId,
        date,
        session,
        eventTitleEn: `${faker.person.firstName()}'s Wedding`,
        eventTitleTa: `${faker.person.firstName()}'s திருமணம்`,
        contactNameEn: faker.person.fullName(),
        contactNameTa: faker.person.fullName() + ' (Ta)',
        phone: faker.string.numeric(10),
        email: faker.internet.email(),
        packageId: pkg.id,
        packageNameEn: pkg.nameEn,
        packageNameTa: pkg.nameTa,
        packageSnapshotPrice: pkg.price,
        totalAmount: pkg.price,
        paidAmount: pkg.price * 0.5,
        balance: pkg.price * 0.5,
        paymentStatus: MandapamPaymentStatus.ADVANCE,
        paymentMode: MandapamPaymentMode.UPI,
        createdBy: systemAdmin.id,
      }
    }).catch(e => {
      // Ignore unique constraint errors for date/session overlap in mock data
      if (e.code !== 'P2002') console.error(e);
    });
  }

  console.log('Mock data generation completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
