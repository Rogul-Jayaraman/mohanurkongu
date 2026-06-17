import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../common/responses/ApiResponse.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import { prisma } from '../../database/prisma.js';
import type { CacheManager } from '../../common/cache/CacheManager.js';
import { buildPackagesListTag, buildPackageTag, buildAdminPackagesListTag, buildPublicCatalogTag, MandapamCacheTtls } from './cache/mandapam-cache-tags.js';
import { bookingCreatePipeline } from './pipelines/booking-create.pipeline.js';
import { bookingStatusPipeline } from './pipelines/booking-status.pipeline.js';
import { bookingSettlementPipeline } from './pipelines/booking-settlement.pipeline.js';
import { bookingChargePipeline } from './pipelines/booking-charge.pipeline.js';
import { financialTransactionPipeline } from './pipelines/financial-transaction.pipeline.js';
import { bookingAddonPipeline } from './pipelines/booking-addon.pipeline.js';
import { bookingListPipeline } from './pipelines/booking-list.pipeline.js';
import { bookingGetPipeline } from './pipelines/booking-get.pipeline.js';
import { calendarBlockPipeline } from './pipelines/calendar-block.pipeline.js';
import { calendarViewPipeline, calendarDayPipeline, calendarPublicPipeline } from './pipelines/calendar-view.pipeline.js';
import { tokenValidatePipeline } from './pipelines/token-validate.pipeline.js';
import { packageUpdatePipeline, packageDeleteFunctionPipeline } from './pipelines/package-update.pipeline.js';
import { catalogEntityPipeline } from './pipelines/catalog-entity.pipeline.js';
import {
  createBookingSchema, updateBookingStatusSchema, addPaymentSchema,
  addRefundSchema, addAddonSchema, blockDatesSchema, unblockDatesSchema,
  settlementActionSchema, addChargesSchema, bookingFiltersSchema, validateTokenSchema,
} from './dto/mandapam.validation.js';

export class MandapamController {
  constructor(private cacheManager?: CacheManager) {}
  // ── Bookings ──

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = bookingFiltersSchema.parse(req.query);
      const result = await bookingListPipeline(filters, this.cacheManager);
      sendSuccess(res, {
        bookings: result.bookings,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await bookingGetPipeline(req.params.id as string, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = createBookingSchema.parse(req.body);
      const performedBy = req.account?.sub;
      if (!performedBy) throw new AppError(401, ErrorCodes.AUTH_UNAUTHORIZED, 'Unauthorized');
      const result = await bookingCreatePipeline(dto, performedBy, this.cacheManager);
      sendSuccess(res, result, 201);
    } catch (err) { next(err); }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = updateBookingStatusSchema.parse(req.body);
      const performedBy = req.account?.sub;
      if (!performedBy) throw new AppError(401, ErrorCodes.AUTH_UNAUTHORIZED, 'Unauthorized');
      const result = await bookingStatusPipeline(req.params.id as string, dto, performedBy, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  addPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = addPaymentSchema.parse(req.body);
      const performedBy = req.account?.sub;
      if (!performedBy) throw new AppError(401, ErrorCodes.AUTH_UNAUTHORIZED, 'Unauthorized');
      const result = await financialTransactionPipeline(req.params.id as string, 'PAYMENT', dto, performedBy, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  addRefund = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = addRefundSchema.parse(req.body);
      const performedBy = req.account?.sub;
      if (!performedBy) throw new AppError(401, ErrorCodes.AUTH_UNAUTHORIZED, 'Unauthorized');
      const result = await financialTransactionPipeline(req.params.id as string, 'REFUND', dto, performedBy, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  addAddon = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = addAddonSchema.parse(req.body);
      const result = await bookingAddonPipeline(req.params.id as string, 'ATTACH', dto, req.account?.sub, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  addCharge = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = addChargesSchema.parse(req.body);
      const performedBy = req.account?.sub;
      if (!performedBy) throw new AppError(401, ErrorCodes.AUTH_UNAUTHORIZED, 'Unauthorized');
      const result = await bookingChargePipeline(req.params.id as string, dto, 'ADD_CHARGE', performedBy, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  removeCharge = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const performedBy = req.account?.sub;
      if (!performedBy) throw new AppError(401, ErrorCodes.AUTH_UNAUTHORIZED, 'Unauthorized');
      const result = await bookingChargePipeline(req.params.id as string, { chargeId: req.params.chargeId as string }, 'REMOVE_CHARGE', performedBy, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  removeAddon = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await bookingAddonPipeline(req.params.id as string, 'DETACH', { snapshotId: req.params.snapshotId as string }, undefined, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  settlementAction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = settlementActionSchema.parse(req.body);
      const performedBy = req.account?.sub;
      if (!performedBy) throw new AppError(401, ErrorCodes.AUTH_UNAUTHORIZED, 'Unauthorized');
      const result = await bookingSettlementPipeline(req.params.id as string, dto, performedBy, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  validateToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = validateTokenSchema.parse(req.body);
      const result = await tokenValidatePipeline(dto.tokenNumber);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  // ── Calendar ──

  getCalendar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const from = (req.query.from as string) || new Date().toISOString().split('T')[0];
      const to = (req.query.to as string) || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
      const result = await calendarViewPipeline(from, to, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  getCalendarDay = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await calendarDayPipeline(req.params.date as string, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  blockDates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = blockDatesSchema.parse(req.body);
      const result = await calendarBlockPipeline(dto, 'BLOCK', this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  unblockDates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = unblockDatesSchema.parse(req.body);
      const result = await calendarBlockPipeline(dto, 'UNBLOCK', this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  // ── Public Catalog ──

  getPublicCatalog = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const language = (req.query.language as string) || 'EN';
      const tag = buildPublicCatalogTag(language);

      if (this.cacheManager) {
        const cached = await this.cacheManager.get(tag);
        if (cached) { sendSuccess(res, { data: cached }); return; }
      }

      const [packages, facilities, addons] = await Promise.all([
        prisma.mandapamPackage.findMany({
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
        }),
        prisma.mandapamFacility.findMany({
          where: { status: true },
          include: { translations: { where: { language: language as any } } },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.mandapamAddonService.findMany({
          where: { status: true },
          include: { translations: { where: { language: language as any } } },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

      const mappedPackages = packages.map((p: any) => ({
        code: p.code,
        bookingType: p.bookingType,
        durationType: p.durationType,
        durationValue: p.durationValue,
        displayName: p.translations?.[0]?.displayName ?? p.code,
        functions: p.functions.map((f: any) => ({ name: f.translations?.[0]?.name ?? '' })),
        pricing: p.pricings?.[0] ? { amount: Number(p.pricings[0].amount), currencyCode: p.pricings[0].currencyCode, pricingType: p.pricings[0].pricingType } : null,
      }));

      const mappedFacilities = facilities.map((f: any) => ({
        iconName: f.iconName,
        name: f.translations?.[0]?.name ?? '',
      }));

      const mappedAddons = addons.map((a: any) => ({
        iconName: a.iconName,
        pricingType: a.pricingType,
        supportsQuantity: a.supportsQuantity,
        name: a.translations?.[0]?.name ?? '',
      }));

      const data = { packages: mappedPackages, facilities: mappedFacilities, addons: mappedAddons };

      if (this.cacheManager) {
        await this.cacheManager.setByTags([tag], data, { defaultTtl: MandapamCacheTtls.PUBLIC_CATALOG });
      }

      sendSuccess(res, { data });
    } catch (err) { next(err); }
  };

  // ── Public Calendar ──

  getPublicCalendar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const from = (req.query.from as string) || new Date().toISOString().split('T')[0];
      const to = (req.query.to as string) || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
      const result = await calendarPublicPipeline(from, to, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  // ── Admin Packages ──

  adminGetAllPackages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookingType = req.query.bookingType as string | undefined;
      const tag = buildAdminPackagesListTag();

      if (this.cacheManager) {
        const cached = await this.cacheManager.get(tag);
        if (cached) {
          let result = cached as any[];
          if (bookingType) result = result.filter((p: any) => p.bookingType === bookingType);
          sendSuccess(res, { packages: result });
          return;
        }
      }

      const packages = await prisma.mandapamPackage.findMany({
        where: bookingType ? { bookingType: bookingType as any } : {},
        select: {
          id: true, code: true, bookingType: true, durationType: true,
          durationValue: true, tokenCount: true, status: true,
          translations: { select: { language: true, displayName: true } },
          functions: {
            select: { id: true, status: true, translations: { select: { language: true, name: true } } },
            orderBy: { createdAt: 'asc' },
          },
          pricings: {
            select: { id: true, pricingType: true, amount: true, currencyCode: true, isActive: true, effectiveFrom: true, effectiveTo: true },
            orderBy: { effectiveFrom: { sort: 'desc', nulls: 'last' } },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (this.cacheManager) {
        await this.cacheManager.setByTags([tag], packages, { defaultTtl: MandapamCacheTtls.ADMIN_PACKAGES });
      }

      sendSuccess(res, { packages });
    } catch (err) { next(err); }
  };

  adminGetPackageById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tag = buildAdminPackagesListTag();
      if (this.cacheManager) {
        const cached = await this.cacheManager.get(tag);
        if (cached) {
          const found = (cached as any[]).find(p => p.id === req.params.id);
          if (found) { sendSuccess(res, { package: found }); return; }
        }
      }

      const pkg = await prisma.mandapamPackage.findUnique({
        where: { id: req.params.id as string },
        select: {
          id: true, code: true, bookingType: true, durationType: true,
          durationValue: true, tokenCount: true, status: true,
          translations: { select: { language: true, displayName: true } },
          functions: {
            select: { id: true, status: true, translations: { select: { language: true, name: true } } },
            orderBy: { createdAt: 'asc' },
          },
          pricings: {
            select: { id: true, pricingType: true, amount: true, currencyCode: true, isActive: true, effectiveFrom: true, effectiveTo: true },
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
      if (!pkg) throw new AppError(404, ErrorCodes.MANDAPAM_PACKAGE_NOT_FOUND, 'Package not found');
      sendSuccess(res, { package: pkg });
    } catch (err) { next(err); }
  };

  adminUpdatePackage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await packageUpdatePipeline(req.params.id as string, req.body, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  adminDeleteFunction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await packageDeleteFunctionPipeline(req.params.functionId as string, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  // ── Admin Facilities ──

  adminGetAllFacilities = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await catalogEntityPipeline('facility', 'LIST', {}, undefined, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  adminCreateFacility = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await catalogEntityPipeline('facility', 'CREATE', req.body, undefined, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  adminUpdateFacility = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await catalogEntityPipeline('facility', 'UPDATE', req.body, req.params.id as string, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  adminDeleteFacility = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await catalogEntityPipeline('facility', 'DELETE', {}, req.params.id as string, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  // ── Admin Addons ──

  adminGetAllAddons = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await catalogEntityPipeline('addon', 'LIST', {}, undefined, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  adminCreateAddon = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await catalogEntityPipeline('addon', 'CREATE', req.body, undefined, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  adminUpdateAddon = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await catalogEntityPipeline('addon', 'UPDATE', req.body, req.params.id as string, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  adminDeleteAddon = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await catalogEntityPipeline('addon', 'DELETE', {}, req.params.id as string, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  // ── Public ──

  getPublicPackages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const language = (req.query.language as string) || 'EN';
      const tag = `${buildPackagesListTag()}:${language}`;

      if (this.cacheManager) {
        const cached = await this.cacheManager.get(tag);
        if (cached) { sendSuccess(res, { packages: cached }); return; }
      }

      const packages = await prisma.mandapamPackage.findMany({
        where: { status: true },
        select: {
          code: true, bookingType: true, durationType: true, durationValue: true,
          translations: { where: { language: language as any }, select: { language: true, displayName: true } },
          functions: {
            where: { status: true },
            select: { translations: { where: { language: language as any }, select: { language: true, name: true } } },
            orderBy: { createdAt: 'asc' },
          },
          pricings: { where: { isActive: true }, select: { pricingType: true, amount: true, currencyCode: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'asc' },
      });

      const mapped = packages.map((p: any) => ({
        code: p.code,
        bookingType: p.bookingType,
        durationType: p.durationType,
        durationValue: p.durationValue,
        displayName: p.translations?.[0]?.displayName ?? p.code,
        functions: p.functions.map((f: any) => ({ name: f.translations?.[0]?.name ?? '' })),
        pricing: p.pricings?.[0] ? { amount: Number(p.pricings[0].amount), currencyCode: p.pricings[0].currencyCode, pricingType: p.pricings[0].pricingType } : null,
      }));

      if (this.cacheManager) {
        await this.cacheManager.setByTags([tag], mapped, { defaultTtl: MandapamCacheTtls.PUBLIC_PACKAGES });
      }

      sendSuccess(res, { packages: mapped });
    } catch (err) { next(err); }
  };

  getPublicPackageByCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const language = (req.query.language as string) || 'EN';
      const code = req.params.code as string;
      const tag = buildPackageTag(code);

      if (this.cacheManager) {
        const cached = await this.cacheManager.get(tag);
        if (cached) { sendSuccess(res, { package: cached }); return; }
      }

      const pkg = await prisma.mandapamPackage.findUnique({
        where: { code },
        select: {
          code: true, bookingType: true, durationType: true, durationValue: true, status: true,
          translations: { where: { language: language as any }, select: { language: true, displayName: true } },
          functions: {
            where: { status: true },
            select: { translations: { where: { language: language as any }, select: { language: true, name: true } } },
            orderBy: { createdAt: 'asc' },
          },
          pricings: { where: { isActive: true }, select: { pricingType: true, amount: true, currencyCode: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });

      if (!pkg || !pkg.status) throw new AppError(404, ErrorCodes.MANDAPAM_PACKAGE_NOT_FOUND, 'Package not found');

      const mapped = {
        code: pkg.code,
        bookingType: pkg.bookingType,
        durationType: pkg.durationType,
        durationValue: pkg.durationValue,
        displayName: pkg.translations?.[0]?.displayName ?? pkg.code,
        functions: pkg.functions.map((f: any) => ({ name: f.translations?.[0]?.name ?? '' })),
        pricing: pkg.pricings?.[0] ? { amount: Number(pkg.pricings[0].amount), currencyCode: pkg.pricings[0].currencyCode, pricingType: pkg.pricings[0].pricingType } : null,
      };

      if (this.cacheManager) {
        await this.cacheManager.setByTags([tag], mapped, { defaultTtl: MandapamCacheTtls.PUBLIC_PACKAGES });
      }

      sendSuccess(res, { package: mapped });
    } catch (err) { next(err); }
  };

    

  getPublicFacilities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await catalogEntityPipeline('facility', 'PUBLIC_LIST', { language: req.query.language as string }, undefined, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  getPublicAddons = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await catalogEntityPipeline('addon', 'PUBLIC_LIST', { language: req.query.language as string }, undefined, this.cacheManager);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };
}
