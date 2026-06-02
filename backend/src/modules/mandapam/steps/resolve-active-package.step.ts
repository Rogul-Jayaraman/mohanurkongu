import { prisma } from '../../../database/prisma.js';
import { AppError } from '../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../common/errors/ErrorCodes.js';
import type { MandapamPipelineContext } from './context.types.js';
import { PACKAGE_TOKEN_MAP } from './context.types.js';

const BOOKING_TYPE_MAP: Record<string, string> = {
  HOURLY: 'HOURLY',
  ONE_DAY: 'ONE_DAY',
  TWO_DAY: 'TWO_DAY',
};

export async function resolveActivePackage(ctx: MandapamPipelineContext): Promise<MandapamPipelineContext> {
  const bookingType = ctx.input.bookingType as string;
  const mappedType = BOOKING_TYPE_MAP[bookingType];
  if (!mappedType) throw new AppError(400, 'VALIDATION_ERROR', `Invalid booking type: ${bookingType}`);

  const pkg = await prisma.mandapamPackage.findFirst({
    where: { bookingType: mappedType as any, status: true },
  });

  if (!pkg) throw new AppError(400, ErrorCodes.MANDAPAM_PACKAGE_INACTIVE, `No active package for booking type ${bookingType}`);

  const pricing = await prisma.mandapamPackagePricing.findFirst({
    where: { packageId: pkg.id, isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!pricing) throw new AppError(400, ErrorCodes.MANDAPAM_PACKAGE_NO_PRICING, `Package ${pkg.code} has no active pricing`);

  const translations = await prisma.mandapamPackageTranslation.findMany({
    where: { packageId: pkg.id },
  });

  const packageName = {
    en: translations.find((t: any) => t.language === 'EN')?.displayName ?? pkg.code,
    ta: translations.find((t: any) => t.language === 'TA')?.displayName ?? pkg.code,
  };

  const version = Math.floor(Math.max(pkg.updatedAt.getTime(), pricing.updatedAt.getTime()) / 1000);

  ctx.package = {
    id: pkg.id,
    code: pkg.code,
    bookingType: pkg.bookingType,
    durationType: pkg.durationType,
    durationValue: pkg.durationValue,
    pricingAmount: Number(pricing.amount),
    currencyCode: pricing.currencyCode,
    pricingType: pricing.pricingType,
    packageName,
    version,
    tokenCount: pkg.tokenCount ?? PACKAGE_TOKEN_MAP[pkg.code] ?? 0,
  };

  return ctx;
}
