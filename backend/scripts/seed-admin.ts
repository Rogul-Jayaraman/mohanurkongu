import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const ADMIN_DATA = {
  accountNo: 'ADMIN-01',
  email: 'mohanurkongu@gmail.com',
  password: 'admin123',
  firstNameEn: 'Admin',
  lastNameEn: 'System',
  firstNameTa: 'அட்மின்',
  lastNameTa: 'சிஸ்டம்',
  phone: '+91-9080725466',
};

function toTamil(text: string): string {
  const known: Record<string, string> = {
    'Admin': 'அட்மின்',
    'admin': 'அட்மின்',
    'System': 'சிஸ்டம்',
    'system': 'சிஸ்டம்',
  };
  if (known[text]) return known[text];
  const tamilChars: Record<string, string> = {
    'a': 'அ', 'b': 'ப்', 'c': 'ச்', 'd': 'த்', 'e': 'எ',
    'f': 'ஃப்', 'g': 'க்', 'h': 'ஹ்', 'i': 'இ', 'j': 'ஜ்',
    'k': 'க்', 'l': 'ல்', 'm': 'ம்', 'n': 'ன்', 'o': 'ஒ',
    'p': 'ப்', 'q': 'க்', 'r': 'ர்', 's': 'ஸ்', 't': 'ட்',
    'u': 'உ', 'v': 'வ்', 'w': 'வ்', 'x': 'க்ஸ்', 'y': 'ய்',
    'z': 'ஸ்',
    'A': 'ஆ', 'B': 'ப்', 'C': 'ச்', 'D': 'த்', 'E': 'ஏ',
    'F': 'ஃப்', 'G': 'க்', 'H': 'ஹ்', 'I': 'ஈ', 'J': 'ஜ்',
    'K': 'க்', 'L': 'ல்', 'M': 'ம்', 'N': 'ன்', 'O': 'ஓ',
    'P': 'ப்', 'Q': 'க்', 'R': 'ர்', 'S': 'ஸ்', 'T': 'ட்',
    'U': 'ஊ', 'V': 'வ்', 'W': 'வ்', 'X': 'க்ஸ்', 'Y': 'ய்',
    'Z': 'ஸ்',
  };
  return [...text].map(ch => tamilChars[ch] || ch).join('');
}

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: parseInt(process.env.ARGON2_MEMORY || '65536', 10),
    timeCost: parseInt(process.env.ARGON2_ITERATIONS || '3', 10),
    parallelism: parseInt(process.env.ARGON2_PARALLELISM || '4', 10),
    hashLength: parseInt(process.env.ARGON2_HASH_LENGTH || '32', 10),
  });
}

async function main() {
  console.log('Seeding admin account...\n');

  const existing = await prisma.accountCredential.findUnique({
    where: { email: ADMIN_DATA.email },
    include: { account: { include: { translations: true } } },
  });

  const passwordHash = await hashPassword(ADMIN_DATA.password);

  if (existing) {
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.update({
        where: { id: existing.accountId },
        data: {
          accountNo: ADMIN_DATA.accountNo,
          translations: {
            upsert: [
              {
                where: { accountId_language: { accountId: existing.accountId, language: 'EN' } },
                create: { language: 'EN', firstName: ADMIN_DATA.firstNameEn, lastName: ADMIN_DATA.lastNameEn, isDefault: true },
                update: { firstName: ADMIN_DATA.firstNameEn, lastName: ADMIN_DATA.lastNameEn },
              },
              {
                where: { accountId_language: { accountId: existing.accountId, language: 'TA' } },
                create: { language: 'TA', firstName: ADMIN_DATA.firstNameTa || toTamil(ADMIN_DATA.firstNameEn), lastName: ADMIN_DATA.lastNameTa || toTamil(ADMIN_DATA.lastNameEn) },
                update: { firstName: ADMIN_DATA.firstNameTa || toTamil(ADMIN_DATA.firstNameEn), lastName: ADMIN_DATA.lastNameTa || toTamil(ADMIN_DATA.lastNameEn) },
              },
            ],
          },
          credential: {
            update: {
              phone: ADMIN_DATA.phone || null,
              passwordHash,
              emailVerified: true,
            },
          },
        },
        include: { translations: true, credential: true },
      });

      const adminRole = await tx.role.findUnique({ where: { code: 'ADMIN' } });
      if (adminRole) {
        const hasAdminRole = await tx.accountRole.findUnique({
          where: { accountId_roleId: { accountId: account.id, roleId: adminRole.id } },
        });
        if (!hasAdminRole) {
          await tx.accountRole.create({ data: { accountId: account.id, roleId: adminRole.id } });
        }
      }

      return account;
    });

    console.log('Admin account updated successfully!\n');
    console.log(`  Account No : ${result.accountNo}`);
    console.log(`  Email      : ${ADMIN_DATA.email}`);
    console.log(`  Name (EN)  : ${ADMIN_DATA.firstNameEn} ${ADMIN_DATA.lastNameEn}`);
    console.log(`  Name (TA)  : ${ADMIN_DATA.firstNameTa} ${ADMIN_DATA.lastNameTa}`);
    console.log(`  Phone      : ${ADMIN_DATA.phone || '(none)'}`);
    console.log(`  Role       : ADMIN`);
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const account = await tx.account.create({
      data: {
        accountNo: ADMIN_DATA.accountNo,
        translations: {
          create: [
            { language: 'EN', firstName: ADMIN_DATA.firstNameEn, lastName: ADMIN_DATA.lastNameEn, isDefault: true },
            { language: 'TA', firstName: ADMIN_DATA.firstNameTa || toTamil(ADMIN_DATA.firstNameEn), lastName: ADMIN_DATA.lastNameTa || toTamil(ADMIN_DATA.lastNameEn) },
          ],
        },
        credential: {
          create: { email: ADMIN_DATA.email, phone: ADMIN_DATA.phone || null, passwordHash, emailVerified: true },
        },
        statusHistory: {
          create: { state: 'ACTIVE', reason: 'Admin account created', changedBy: 'system' },
        },
      },
      include: { translations: true, credential: true },
    });

    const adminRole = await tx.role.findUnique({ where: { code: 'ADMIN' } });
    if (!adminRole) throw new Error('ADMIN role not found. Run prisma db seed first.');
    await tx.accountRole.create({ data: { accountId: account.id, roleId: adminRole.id } });

    return account;
  });

  console.log('Admin account created successfully!\n');
  console.log(`  Account No : ${result.accountNo}`);
  console.log(`  Email      : ${ADMIN_DATA.email}`);
  console.log(`  Name (EN)  : ${ADMIN_DATA.firstNameEn} ${ADMIN_DATA.lastNameEn}`);
  console.log(`  Name (TA)  : ${ADMIN_DATA.firstNameTa} ${ADMIN_DATA.lastNameTa}`);
  console.log(`  Phone      : ${ADMIN_DATA.phone || '(none)'}`);
  console.log(`  Password   : ${ADMIN_DATA.password}`);
  console.log(`  Role       : ADMIN`);
}

main()
  .catch((e) => {
    console.error('Failed to seed admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
