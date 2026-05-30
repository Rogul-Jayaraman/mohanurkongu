import { prisma } from '../../database/prisma.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import type { Prisma } from '@prisma/client';

const PACKAGE_METADATA = {
  STANDARD: { bookingType: 'HOURLY' as const, durationType: 'CUSTOM_HOURS' as const, pricingType: 'HOURLY' as const },
  ROYAL: { bookingType: 'DAY_BASED' as const, durationType: 'FIXED_DAY' as const, pricingType: 'FIXED' as const, durationValue: 1 },
  GRAND: { bookingType: 'DAY_BASED' as const, durationType: 'FIXED_DAY' as const, pricingType: 'FIXED' as const, durationValue: 2 },
} as const;

const VALID_CODES = Object.keys(PACKAGE_METADATA);

type PackageCode = keyof typeof PACKAGE_METADATA;

export class MandapamService {
  // ── Packages ──

  async getAllPackages() {
    return prisma.mandapamPackage.findMany({
      include: { translations: true, functions: { include: { translations: true }, orderBy: { createdAt: 'asc' } }, pricings: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getPackageById(id: string) {
    const pkg = await prisma.mandapamPackage.findUnique({
      where: { id },
      include: { translations: true, functions: { include: { translations: true }, orderBy: { createdAt: 'asc' } }, pricings: { where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!pkg) throw new AppError(404, ErrorCodes.MANDAPAM_PACKAGE_NOT_FOUND, ErrorCodes.MANDAPAM_PACKAGE_NOT_FOUND);
    return pkg;
  }

  async getPackageByCode(code: string) {
    const pkg = await prisma.mandapamPackage.findUnique({
      where: { code },
      include: { translations: true, functions: { include: { translations: true }, orderBy: { createdAt: 'asc' } }, pricings: { where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!pkg) throw new AppError(404, ErrorCodes.MANDAPAM_PACKAGE_NOT_FOUND, ErrorCodes.MANDAPAM_PACKAGE_NOT_FOUND);
    return pkg;
  }

  async updatePackage(id: string, data: any) {
    const existing = await prisma.mandapamPackage.findUnique({ where: { id }, include: { translations: true, pricings: { where: { isActive: true } } } });
    if (!existing) throw new AppError(404, ErrorCodes.MANDAPAM_PACKAGE_NOT_FOUND, ErrorCodes.MANDAPAM_PACKAGE_NOT_FOUND);

    return prisma.$transaction(async (tx) => {
      if (data.displayName) {
        for (const t of data.displayName) {
          await tx.mandapamPackageTranslation.upsert({
            where: { packageId_language: { packageId: id, language: t.language } },
            update: { displayName: t.value },
            create: { packageId: id, language: t.language, displayName: t.value },
          });
        }
      }

      if (data.functions) {
        for (const fn of data.functions) {
          if (fn.id) {
            const existingFn = await tx.mandapamPackageFunction.findUnique({ where: { id: fn.id } });
            if (!existingFn || existingFn.packageId !== id) continue;
            await tx.mandapamPackageFunction.update({ where: { id: fn.id }, data: { status: fn.status ?? existingFn.status } });
            if (fn.name) {
              for (const t of fn.name) {
                await tx.mandapamPackageFunctionTranslation.upsert({
                  where: { functionId_language: { functionId: fn.id, language: t.language } },
                  update: { name: t.value },
                  create: { functionId: fn.id, language: t.language, name: t.value },
                });
              }
            }
          } else {
            const newFn = await tx.mandapamPackageFunction.create({
              data: { packageId: id, status: fn.status ?? true },
            });
            for (const t of fn.name) {
              await tx.mandapamPackageFunctionTranslation.create({
                data: { functionId: newFn.id, language: t.language, name: t.value },
              });
            }
          }
        }
      }

      if (data.pricing) {
        const meta = PACKAGE_METADATA[existing.code as PackageCode];
        await tx.mandapamPackagePricing.create({
          data: {
            packageId: id,
            pricingType: meta.pricingType,
            amount: data.pricing.amount,
            currencyCode: data.pricing.currencyCode ?? 'INR',
            isActive: data.pricing.isActive ?? true,
          },
        });
      }

      if (data.status !== undefined) {
        await tx.mandapamPackage.update({ where: { id }, data: { status: data.status } });
      }

      return tx.mandapamPackage.findUnique({
        where: { id },
        include: { translations: true, functions: { include: { translations: true }, orderBy: { createdAt: 'asc' } }, pricings: { orderBy: { createdAt: 'desc' } } },
      });
    });
  }

  async deletePackageFunction(functionId: string) {
    const fn = await prisma.mandapamPackageFunction.findUnique({ where: { id: functionId } });
    if (!fn) throw new AppError(404, ErrorCodes.MANDAPAM_PACKAGE_FUNCTION_NOT_FOUND, ErrorCodes.MANDAPAM_PACKAGE_FUNCTION_NOT_FOUND);
    return prisma.mandapamPackageFunction.update({ where: { id: functionId }, data: { status: false } });
  }

  async getPublicPackages(language: string) {
    const packages = await prisma.mandapamPackage.findMany({
      where: { status: true },
      include: {
        translations: { where: { language: language as any } },
        functions: {
          where: { status: true },
          include: { translations: { where: { language: language as any } } },
          orderBy: { createdAt: 'asc' },
        },
        pricings: { where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'asc' },
    });

    return packages.map((p) => ({
      code: p.code,
      bookingType: p.bookingType,
      durationType: p.durationType,
      durationValue: p.durationValue,
      displayName: p.translations[0]?.displayName ?? p.code,
      functions: p.functions.map((f) => ({ name: f.translations[0]?.name ?? '' })),
      pricing: p.pricings[0] ? { amount: Number(p.pricings[0].amount), currencyCode: p.pricings[0].currencyCode, pricingType: p.pricings[0].pricingType } : null,
    }));
  }

  async getPublicPackageByCode(code: string, language: string) {
    const pkg = await prisma.mandapamPackage.findUnique({
      where: { code },
      include: {
        translations: { where: { language: language as any } },
        functions: {
          where: { status: true },
          include: { translations: { where: { language: language as any } } },
          orderBy: { createdAt: 'asc' },
        },
        pricings: { where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!pkg || !pkg.status) throw new AppError(404, ErrorCodes.MANDAPAM_PACKAGE_NOT_FOUND, ErrorCodes.MANDAPAM_PACKAGE_NOT_FOUND);
    return {
      code: pkg.code,
      bookingType: pkg.bookingType,
      durationType: pkg.durationType,
      durationValue: pkg.durationValue,
      displayName: pkg.translations[0]?.displayName ?? pkg.code,
      functions: pkg.functions.map((f) => ({ name: f.translations[0]?.name ?? '' })),
      pricing: pkg.pricings[0] ? { amount: Number(pkg.pricings[0].amount), currencyCode: pkg.pricings[0].currencyCode, pricingType: pkg.pricings[0].pricingType } : null,
    };
  }

  // ── Facilities ──

  async getAllFacilities() {
    return prisma.mandapamFacility.findMany({
      include: { translations: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createFacility(data: { iconName: string; chargeType?: string; name: { language: string; value: string }[] }) {
    return prisma.$transaction(async (tx) => {
      const facility = await tx.mandapamFacility.create({ data: { iconName: data.iconName, chargeType: data.chargeType as any ?? 'GENERAL' } });
      for (const t of data.name) {
        await tx.mandapamFacilityTranslation.create({ data: { facilityId: facility.id, language: t.language as any, name: t.value } });
      }
      return tx.mandapamFacility.findUnique({ where: { id: facility.id }, include: { translations: true } });
    });
  }

  async updateFacility(id: string, data: any) {
    const existing = await prisma.mandapamFacility.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, ErrorCodes.MANDAPAM_FACILITY_NOT_FOUND, ErrorCodes.MANDAPAM_FACILITY_NOT_FOUND);

    return prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (data.iconName !== undefined) updateData.iconName = data.iconName;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.chargeType !== undefined) updateData.chargeType = data.chargeType;
      if (Object.keys(updateData).length > 0) {
        await tx.mandapamFacility.update({ where: { id }, data: updateData });
      }
      if (data.name) {
        for (const t of data.name) {
          await tx.mandapamFacilityTranslation.upsert({
            where: { facilityId_language: { facilityId: id, language: t.language } },
            update: { name: t.value },
            create: { facilityId: id, language: t.language, name: t.value },
          });
        }
      }
      return tx.mandapamFacility.findUnique({ where: { id }, include: { translations: true } });
    });
  }

  async deleteFacility(id: string) {
    const existing = await prisma.mandapamFacility.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, ErrorCodes.MANDAPAM_FACILITY_NOT_FOUND, ErrorCodes.MANDAPAM_FACILITY_NOT_FOUND);
    return prisma.mandapamFacility.delete({ where: { id } });
  }

  async getPublicFacilities(language: string) {
    const facilities = await prisma.mandapamFacility.findMany({
      where: { status: true },
      include: { translations: { where: { language: language as any } } },
      orderBy: { createdAt: 'desc' },
    });
    return facilities.map((f) => ({ iconName: f.iconName, name: f.translations[0]?.name ?? '' }));
  }

  // ── Addon Services ──

  async getAllAddons() {
    return prisma.mandapamAddonService.findMany({
      include: { translations: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAddon(data: { iconName: string; pricingType?: string; amount?: number; name: { language: string; value: string }[] }) {
    return prisma.$transaction(async (tx) => {
      const addon = await tx.mandapamAddonService.create({ data: { iconName: data.iconName, pricingType: data.pricingType as any ?? 'FIXED', amount: data.amount ?? 0 } });
      for (const t of data.name) {
        await tx.mandapamAddonServiceTranslation.create({ data: { addonId: addon.id, language: t.language as any, name: t.value } });
      }
      return tx.mandapamAddonService.findUnique({ where: { id: addon.id }, include: { translations: true } });
    });
  }

  async updateAddon(id: string, data: any) {
    const existing = await prisma.mandapamAddonService.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, ErrorCodes.MANDAPAM_ADDON_NOT_FOUND, ErrorCodes.MANDAPAM_ADDON_NOT_FOUND);

    return prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (data.iconName !== undefined) updateData.iconName = data.iconName;
      if (data.pricingType !== undefined) updateData.pricingType = data.pricingType;
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.status !== undefined) updateData.status = data.status;
      if (Object.keys(updateData).length > 0) {
        await tx.mandapamAddonService.update({ where: { id }, data: updateData });
      }
      if (data.name) {
        for (const t of data.name) {
          await tx.mandapamAddonServiceTranslation.upsert({
            where: { addonId_language: { addonId: id, language: t.language } },
            update: { name: t.value },
            create: { addonId: id, language: t.language, name: t.value },
          });
        }
      }
      return tx.mandapamAddonService.findUnique({ where: { id }, include: { translations: true } });
    });
  }

  async deleteAddon(id: string) {
    const existing = await prisma.mandapamAddonService.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, ErrorCodes.MANDAPAM_ADDON_NOT_FOUND, ErrorCodes.MANDAPAM_ADDON_NOT_FOUND);
    return prisma.mandapamAddonService.delete({ where: { id } });
  }

  async getPublicAddons(language: string) {
    const addons = await prisma.mandapamAddonService.findMany({
      where: { status: true },
      include: { translations: { where: { language: language as any } } },
      orderBy: { createdAt: 'desc' },
    });
    return addons.map((a) => ({ iconName: a.iconName, pricingType: a.pricingType, amount: Number(a.amount), name: a.translations[0]?.name ?? '' }));
  }
}
