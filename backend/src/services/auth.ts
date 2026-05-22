import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Generates formatted User ID (e.g. ID-0001, ID-0002)
 */
export const generateCustomId = async (): Promise<string> => {
  const lastUser = await prisma.user.findFirst({
    orderBy: { serialInt: 'desc' },
  });

  const nextSerial = (lastUser?.serialInt || 0) + 1;
  
  // Padding logic: keep at least 4 digits, but grow automatically for 10000+
  const padLength = Math.max(4, nextSerial.toString().length);
  return `ID-${nextSerial.toString().padStart(padLength, '0')}`;
};

export const findUserByEmailOrPhone = async (email: string, phone: string) => {
  return prisma.user.findFirst({
    where: {
      OR: [{ email }, { phone }],
    },
  });
};

export const findAdminByEmailOrPhone = async (email: string, phone: string) => {
  return prisma.admin.findFirst({
    where: {
      OR: [{ email }, { phone }],
    },
  });
};

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const findAdminByEmail = async (email: string) => {
  return prisma.admin.findUnique({
    where: { email },
  });
};

export const createUser = async (data: any) => {
  return prisma.user.create({
    data
  });
};

export const updateUserOtp = async (userId: string, otp: string | null, expiry: Date | null) => {
  return prisma.user.update({
    where: { id: userId },
    data: { otp, otpExpiry: expiry },
  });
};

export const updateAdminOtp = async (adminId: string, otp: string | null, expiry: Date | null) => {
  return prisma.admin.update({
    where: { id: adminId },
    data: { otp, otpExpiry: expiry },
  });
};

export const generateToken = (payload: any, expiresIn: string = '7d'): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'your_jwt_secret') {
    console.error('CRITICAL: JWT_SECRET is not set or using default');
  }
  return jwt.sign(payload, secret || 'fallback_change_me', { expiresIn } as jwt.SignOptions);
};

export const verifyPassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 10);
};

export const updateUserPassword = async (userId: string, passwordHash: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: { password: passwordHash, otp: null, otpExpiry: null },
  });
};

export const updateAdminPassword = async (adminId: string, passwordHash: string) => {
  return prisma.admin.update({
    where: { id: adminId },
    data: { password: passwordHash, otp: null, otpExpiry: null },
  });
};

// Login by email or phone
export const findUserByIdentifier = async (identifier: string) => {
  const isEmail = identifier.includes('@');
  if (isEmail) {
    return prisma.user.findUnique({ where: { email: identifier } });
  }
  return prisma.user.findUnique({ where: { phone: identifier } });
};

export const findAdminByIdentifier = async (identifier: string) => {
  const isEmail = identifier.includes('@');
  if (isEmail) {
    return prisma.admin.findUnique({ where: { email: identifier } });
  }
  return prisma.admin.findUnique({ where: { phone: identifier } });
};


