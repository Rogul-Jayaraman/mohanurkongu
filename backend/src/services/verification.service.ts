import prisma from '../config/prisma';

export const findVerification = async (identifier: string, type: string) => {
  return prisma.verification.findFirst({
    where: { identifier, type },
  });
};

export const upsertVerification = async (identifier: string, type: string, otp: string, expiresAt: Date) => {
  return prisma.verification.upsert({
    where: { identifier_type: { identifier, type } },
    update: { otp, expiresAt },
    create: { identifier, type, otp, expiresAt },
  });
};

export const deleteVerification = async (identifier: string, type: string) => {
  return prisma.verification.delete({
    where: { identifier_type: { identifier, type } },
  });
};

export const isPhoneVerified = async (phone: string): Promise<boolean> => {
  const verification = await prisma.verification.findFirst({
    where: { identifier: phone, type: 'PHONE' },
  });
  return verification?.status === 'VERIFIED';
};

export const deletePhoneVerification = async (phone: string) => {
  return prisma.verification.deleteMany({
    where: { identifier: phone, type: 'PHONE' },
  });
};

export const upsertPhoneVerification = async (identifier: string, hashedOtp: string, expiresAt: Date) => {
  return prisma.verification.upsert({
    where: { identifier_type: { identifier, type: 'PHONE' } },
    update: { hashedOtp, expiresAt, attempts: 0, status: 'PENDING', otp: '' },
    create: { identifier, type: 'PHONE', otp: '', hashedOtp, expiresAt, attempts: 0, status: 'PENDING' },
  });
};

export const incrementAttempts = async (id: string) => {
  return prisma.verification.update({
    where: { id },
    data: { attempts: { increment: 1 } },
  });
};

export const markPhoneVerified = async (id: string) => {
  return prisma.verification.update({
    where: { id },
    data: {
      status: 'VERIFIED',
      hashedOtp: null,
      verifiedAt: new Date(),
    },
  });
};

export const blockVerification = async (id: string) => {
  return prisma.verification.update({
    where: { id },
    data: { status: 'BLOCKED' },
  });
};
