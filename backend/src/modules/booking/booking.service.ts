import { prisma } from '../../database/prisma.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import { BookingRepository } from './booking.repository.js';
import type {
  CreateBookingDto, UpdateBookingStatusDto, AddPaymentDto,
  AddRefundDto, AddAddonDto, BookingFilters, BlockDatesDto,
  SettlementActionDto, AddChargesDto,
} from './booking.types.js';
import { VALID_STATUS_TRANSITIONS, PACKAGE_TOKEN_MAP } from './booking.types.js';

export class BookingService {
  constructor(private repo: BookingRepository) {}

  async list(filters: BookingFilters) {
    const result = await this.repo.findMany(filters);
    return {
      ...result,
      bookings: result.bookings.map((b: any) => this.enrichWithOutstanding(b)),
    };
  }

  async getById(id: string) {
    const booking = await this.repo.findById(id);
    if (!booking) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Booking not found');
    return this.enrichWithOutstanding(booking);
  }

  async create(dto: CreateBookingDto, createdBy: string) {
    const pkg = await prisma.mandapamPackage.findUnique({ where: { code: dto.packageCode } });
    if (!pkg || !pkg.status) throw new AppError(400, 'MANDAPAM_PACKAGE_INACTIVE', 'Package not available');

    const pricing = await prisma.mandapamPackagePricing.findFirst({
      where: { packageId: pkg.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!pricing) throw new AppError(400, 'MANDAPAM_PACKAGE_NO_PRICING', 'Package has no active pricing');

    const activeAddons = dto.addons?.length
      ? await prisma.mandapamAddonService.findMany({
          where: { id: { in: dto.addons.map(a => a.addonId) }, status: true },
          include: { translations: true },
        })
      : [];

    if (activeAddons.length !== (dto.addons?.length || 0)) {
      throw new AppError(400, 'MANDAPAM_ADDON_INACTIVE', 'One or more addons not available');
    }

    const bookingNo = await this.repo.getNextBookingNo();

    const daysCount = this.calculateDays(dto.bookingConfig.startDate, dto.bookingConfig.endDate);
    const tokensToConsume = (PACKAGE_TOKEN_MAP[dto.packageCode] || 0) * daysCount;

    return prisma.$transaction(async (tx) => {
      const booking = await tx.mandapamBooking.create({
        data: {
          bookingNo,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          customerEmail: dto.customerEmail || null,
          eventTitle: dto.eventTitle,
          eventAddress: dto.eventAddress || undefined,
          status: 'CONFIRMED',
          bookingMethod: 'NORMAL_BOOKING',
          packageCode: dto.packageCode,
          bookingConfig: dto.bookingConfig as any,
          notes: dto.notes || null,
          createdBy,
          packageSnapshot: {
            create: {
              packageId: pkg.id,
              packageCode: pkg.code,
              packageName: await this.getPackageName(pkg.id),
              packagePrice: pricing.amount,
              packageVersion: 1,
            },
          },
          ledgerEntries: {
            create: {
              source: 'PACKAGE',
              description: { en: 'Package charge', ta: 'தொகுப்பு கட்டணம்' },
              amount: pricing.amount,
            },
          },
        } as any,
      });

      if (activeAddons.length > 0) {
        await tx.mandapamBookingAddonSnapshot.createMany({
          data: activeAddons.map(addon => {
            const reqAddon = dto.addons!.find(a => a.addonId === addon.id)!;
            const enName = (addon as any).translations?.find((t: any) => t.language === 'EN')?.name || addon.id;
            const taName = (addon as any).translations?.find((t: any) => t.language === 'TA')?.name || addon.id;
            return {
              bookingId: booking.id,
              addonId: addon.id,
              addonName: { en: enName, ta: taName },
              pricingType: addon.pricingType,
              quantity: reqAddon.quantity,
              amount: Number(addon.amount),
            };
          }),
        });

        for (const addon of activeAddons) {
          const reqAddon = dto.addons!.find(a => a.addonId === addon.id)!;
          const enName = (addon as any).translations?.find((t: any) => t.language === 'EN')?.name || '';
          const taName = (addon as any).translations?.find((t: any) => t.language === 'TA')?.name || '';
          await tx.mandapamFinancialLedger.create({
            data: {
              bookingId: booking.id,
              source: 'ADDON',
              description: { en: `Addon: ${enName}`, ta: `கூடுதல்: ${taName}` },
              amount: Number(addon.amount) * reqAddon.quantity,
            },
          });
        }
      }

      await this.upsertCalendarEntries(tx, booking.id, dto.bookingConfig.startDate, dto.bookingConfig.endDate);

      if (tokensToConsume > 0) {
        await tx.mandapamTokenConsumption.create({
          data: {
            bookingId: booking.id,
            tokens: tokensToConsume,
            state: 'CONSUMED',
          },
        });
      }

      await tx.mandapamBookingTimeline.create({
        data: {
          bookingId: booking.id,
          event: 'BOOKING_CREATED',
          metadata: { packageCode: dto.packageCode, amount: Number(pricing.amount) },
        },
      });

      await tx.mandapamAuditLog.create({
        data: {
          bookingId: booking.id,
          action: 'BOOKING_CREATED',
          performedBy: createdBy,
          metadata: { dto: JSON.parse(JSON.stringify(dto)) },
        },
      });

      return this.repo.findById(booking.id);
    });
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto, performedBy: string) {
    const booking = await this.repo.findById(id);
    if (!booking) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Booking not found');

    const allowedNext = VALID_STATUS_TRANSITIONS[booking.status] || [];
    if (!allowedNext.includes(dto.status)) {
      throw new AppError(400, 'INVALID_STATUS_TRANSITION', `Cannot transition from ${booking.status} to ${dto.status}`);
    }

    return prisma.$transaction(async (tx) => {
      await tx.mandapamBooking.update({ where: { id }, data: { status: dto.status as any } });

      if (dto.status === 'CANCELLED') {
        await tx.mandapamCalendarEntry.updateMany({
          where: { bookingId: id },
          data: { status: 'AVAILABLE', bookingId: null, reasonEn: 'Booking cancelled', reasonTa: 'பதிவு ரத்து செய்யப்பட்டது' },
        });
        await tx.mandapamTokenConsumption.updateMany({
          where: { bookingId: id, state: 'CONSUMED' },
          data: { state: 'REVERSED', reversedAt: new Date() },
        });
      }

      if (dto.status === 'SETTLEMENT_PENDING') {
        await tx.mandapamSettlement.upsert({
          where: { bookingId: id },
          update: {},
          create: { bookingId: id, state: 'PENDING' },
        });
      }

      await tx.mandapamBookingTimeline.create({
        data: { bookingId: id, event: `STATUS_${dto.status}`, metadata: { from: booking.status, to: dto.status } },
      });

      await tx.mandapamAuditLog.create({
        data: { bookingId: id, action: 'STATUS_CHANGED', performedBy, metadata: { from: booking.status, to: dto.status } },
      });

      return this.repo.findById(id);
    });
  }

  async addPayment(id: string, dto: AddPaymentDto, performedBy: string) {
    const booking = await this.repo.findById(id);
    if (!booking) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Booking not found');
    if (booking.status === 'CANCELLED') throw new AppError(400, 'BOOKING_CANCELLED', 'Cannot add payment to cancelled booking');

    return prisma.$transaction(async (tx) => {
      await tx.mandapamPaymentLedger.create({
        data: {
          bookingId: id,
          paymentType: dto.paymentType as any,
          paymentMethod: dto.paymentMethod as any,
          amount: dto.amount,
          referenceNo: dto.referenceNo || null,
        },
      });

      await tx.mandapamBookingTimeline.create({
        data: { bookingId: id, event: 'PAYMENT_RECEIVED', metadata: { type: dto.paymentType, amount: dto.amount } as any },
      });

      await tx.mandapamAuditLog.create({
        data: { bookingId: id, action: 'PAYMENT_ADDED', performedBy, metadata: dto as any },
      });

      return this.repo.findById(id);
    });
  }

  async addRefund(id: string, dto: AddRefundDto, performedBy: string) {
    const booking = await this.repo.findById(id);
    if (!booking) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Booking not found');

    return prisma.$transaction(async (tx) => {
      await tx.mandapamRefundLedger.create({
        data: {
          bookingId: id,
          refundType: dto.refundType as any,
          refundMethod: dto.refundMethod as any,
          amount: dto.amount,
          reason: dto.reason || null,
        },
      });

      await tx.mandapamBookingTimeline.create({
        data: { bookingId: id, event: 'REFUND_PROCESSED', metadata: { type: dto.refundType, amount: dto.amount } as any },
      });

      await tx.mandapamAuditLog.create({
        data: { bookingId: id, action: 'REFUND_ADDED', performedBy, metadata: dto as any },
      });

      return this.repo.findById(id);
    });
  }

  async addAddon(id: string, dto: AddAddonDto) {
    const booking = await this.repo.findById(id);
    if (!booking) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Booking not found');

    const addon = await prisma.mandapamAddonService.findUnique({
      where: { id: dto.addonId },
      include: { translations: true },
    });
    if (!addon || !addon.status) throw new AppError(400, 'MANDAPAM_ADDON_INACTIVE', 'Addon not available');

    return prisma.$transaction(async (tx) => {
      const enName = (addon as any).translations?.find((t: any) => t.language === 'EN')?.name || '';
      const taName = (addon as any).translations?.find((t: any) => t.language === 'TA')?.name || '';
      await tx.mandapamBookingAddonSnapshot.create({
        data: {
          bookingId: id,
          addonId: addon.id,
          addonName: { en: enName, ta: taName },
          pricingType: addon.pricingType,
          quantity: dto.quantity,
          amount: Number(addon.amount),
        },
      });

      const addonAmount = Number(addon.amount) * dto.quantity;
      await tx.mandapamFinancialLedger.create({
        data: {
          bookingId: id,
          source: 'ADDON',
          description: { en: `Addon: ${enName}`, ta: `கூடுதல்: ${taName}` },
          amount: addonAmount,
        },
      });

      await tx.mandapamBookingTimeline.create({
        data: { bookingId: id, event: 'ADDON_ADDED', metadata: { addonId: dto.addonId, quantity: dto.quantity } as any },
      });

      return this.repo.findById(id);
    });
  }

  async removeAddon(bookingId: string, snapshotId: string) {
    const snapshot = await prisma.mandapamBookingAddonSnapshot.findUnique({ where: { id: snapshotId } });
    if (!snapshot || snapshot.bookingId !== bookingId) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'Addon snapshot not found');
    }

    return prisma.$transaction(async (tx) => {
      await tx.mandapamBookingAddonSnapshot.delete({ where: { id: snapshotId } });
      await tx.mandapamFinancialLedger.create({
        data: {
          bookingId,
          source: 'ADJUSTMENT',
          description: { en: 'Addon removed', ta: 'கூடுதல் அகற்றப்பட்டது' },
          amount: -(Number(snapshot.amount) * snapshot.quantity),
        },
      });
      return this.repo.findById(bookingId);
    });
  }

  async settlementAction(id: string, dto: SettlementActionDto, performedBy: string) {
    const booking = await this.repo.findById(id);
    if (!booking) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Booking not found');

    const currentCharges = (booking.ledgerEntries || []).reduce((s: number, e: any) => s + Number(e.amount), 0);
    const currentPayments = (booking.paymentEntries || []).reduce((s: number, e: any) => s + Number(e.amount), 0);
    const currentRefunds = (booking.refundEntries || []).reduce((s: number, e: any) => s + Number(e.amount), 0);
    const currentOutstanding = currentCharges - currentPayments + currentRefunds;

    return prisma.$transaction(async (tx) => {
      if (dto.action === 'start') {
        await tx.mandapamSettlement.upsert({
          where: { bookingId: id },
          update: { state: 'IN_PROGRESS' },
          create: { bookingId: id, state: 'IN_PROGRESS' },
        });

        await tx.mandapamBooking.update({ where: { id }, data: { status: 'SETTLEMENT_PENDING' as any } });

        await tx.mandapamBookingTimeline.create({
          data: { bookingId: id, event: 'SETTLEMENT_STARTED', metadata: {} },
        });
      }

      if (dto.action === 'complete') {
        if (dto.charges) {
          for (const charge of dto.charges) {
            await tx.mandapamFinancialLedger.create({
              data: {
                bookingId: id,
                source: charge.type === 'damage' ? 'DAMAGE' : charge.type === 'penalty' ? 'PENALTY' : 'SERVICE',
                description: charge.description,
                amount: charge.amount,
              },
            });
          }
        }

        if (dto.finalAmount != null) {
          const discountAmount = currentOutstanding - dto.finalAmount;
          if (discountAmount > 0) {
            await tx.mandapamFinancialLedger.create({
              data: {
                bookingId: id,
                source: 'DISCOUNT',
                description: { en: 'Settlement discount applied', ta: 'தீர்வு தள்ளுபடி' },
                amount: -discountAmount,
              },
            });
          }
        }

        const damageCharges = dto.charges?.filter(c => c.type === 'damage') || [];
        const penaltyCharges = dto.charges?.filter(c => c.type === 'penalty') || [];
        const extraCharges = dto.charges?.filter(c => c.type === 'extra') || [];

        await tx.mandapamSettlement.update({
          where: { bookingId: id },
          data: {
            state: 'COMPLETED',
            damageCharges: damageCharges.length ? JSON.parse(JSON.stringify(damageCharges)) : undefined,
            penaltyCharges: penaltyCharges.length ? JSON.parse(JSON.stringify(penaltyCharges)) : undefined,
            extraCharges: extraCharges.length ? JSON.parse(JSON.stringify(extraCharges)) : undefined,
            finalAmount: dto.finalAmount || null,
            settledAt: new Date(),
            settledBy: performedBy,
            notes: dto.notes || null,
          },
        });

        await tx.mandapamBooking.update({ where: { id }, data: { status: 'COMPLETED' as any } });

        await tx.mandapamBookingTimeline.create({
          data: { bookingId: id, event: 'SETTLEMENT_COMPLETED', metadata: { finalAmount: dto.finalAmount } as any },
        });
      }

      await tx.mandapamAuditLog.create({
        data: { bookingId: id, action: `SETTLEMENT_${dto.action.toUpperCase()}`, performedBy, metadata: dto as any },
      });

      return this.repo.findById(id);
    });
  }

  async blockDates(dto: BlockDatesDto) {
    const reasonEn = dto.reason?.en || null;
    const reasonTa = dto.reason?.ta || null;
    return prisma.$transaction(async (tx) => {
      for (const dateStr of dto.dates) {
        const date = new Date(dateStr + 'T00:00:00.000Z');
        const existing = await tx.mandapamCalendarEntry.findUnique({ where: { date } });
        if (existing && existing.status !== 'AVAILABLE') {
          throw new AppError(409, 'DATE_ALREADY_BOOKED', `Date ${dateStr} is already ${existing.status}`);
        }
        await tx.mandapamCalendarEntry.upsert({
          where: { date },
          update: { status: 'BLOCKED', reasonEn, reasonTa },
          create: { date, status: 'BLOCKED', reasonEn, reasonTa },
        });
      }
      return this.getCalendarEntries(dto.dates[0], dto.dates[dto.dates.length - 1]);
    });
  }

  async unblockDates(dates: string[]) {
    return prisma.$transaction(async (tx) => {
      for (const dateStr of dates) {
        const date = new Date(dateStr + 'T00:00:00.000Z');
        const entry = await tx.mandapamCalendarEntry.findUnique({ where: { date } });
        if (!entry) continue;
        if (entry.status === 'FULLY_BOOKED') {
          throw new AppError(409, 'DATE_HAS_BOOKINGS', `Date ${dateStr} has active bookings`);
        }
        await tx.mandapamCalendarEntry.delete({ where: { date } });
      }
      return this.getCalendarEntries(dates[0], dates[dates.length - 1]);
    });
  }

  async getCalendarEntries(from: string, to: string) {
    const fromDate = new Date(from + 'T00:00:00.000Z');
    const toDate = new Date(to + 'T00:00:00.000Z');
    return prisma.mandapamCalendarEntry.findMany({
      where: { date: { gte: fromDate, lte: toDate } },
      orderBy: { date: 'asc' },
    });
  }

  async getCalendarDay(dateStr: string) {
    const date = new Date(dateStr + 'T00:00:00.000Z');
    const entry = await prisma.mandapamCalendarEntry.findUnique({ where: { date } });
    if (!entry) return { status: 'AVAILABLE', date: dateStr, bookings: [], reason: null };

    const bookings = entry.bookingId
      ? await prisma.mandapamBooking.findMany({
          where: { id: entry.bookingId },
          select: { id: true, bookingNo: true, customerName: true, eventTitle: true, status: true, bookingConfig: true },
        })
      : [];

    return {
      status: entry.status,
      date: dateStr,
      reason: entry.reasonEn ? { en: entry.reasonEn, ta: entry.reasonTa || entry.reasonEn } : null,
      bookings,
    };
  }

  private async upsertCalendarEntries(tx: any, bookingId: string, startDate: string, endDate: string) {
    const start = new Date(startDate + 'T00:00:00.000Z');
    const end = new Date(endDate + 'T00:00:00.000Z');
    const dates: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    for (const date of dates) {
      const existing = await tx.mandapamCalendarEntry.findUnique({ where: { date } });
      if (existing && existing.status === 'BLOCKED') {
        throw new AppError(409, 'DATE_BLOCKED', `Date ${date.toISOString().split('T')[0]} is blocked`);
      }
      if (existing && existing.status === 'FULLY_BOOKED') {
        throw new AppError(409, 'DATE_ALREADY_BOOKED', `Date ${date.toISOString().split('T')[0]} is already booked`);
      }
      await tx.mandapamCalendarEntry.upsert({
        where: { date },
        update: { status: 'FULLY_BOOKED', bookingId },
        create: { date, status: 'FULLY_BOOKED', bookingId },
      });
    }
  }

  private async getPackageName(packageId: string) {
    const translations = await prisma.mandapamPackageTranslation.findMany({
      where: { packageId },
    });
    return {
      en: translations.find(t => t.language === 'EN')?.displayName || '',
      ta: translations.find(t => t.language === 'TA')?.displayName || '',
    };
  }

  private calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  }

  private enrichWithOutstanding(booking: any) {
    if (!booking) return booking;
    const ledgerEntries = booking.ledgerEntries || [];
    const paymentEntries = booking.paymentEntries || [];
    const refundEntries = booking.refundEntries || [];
    const totalCharges = ledgerEntries.reduce((s: number, e: any) => s + Number(e.amount), 0);
    const totalPayments = paymentEntries.reduce((s: number, e: any) => s + Number(e.amount), 0);
    const totalRefunds = refundEntries.reduce((s: number, e: any) => s + Number(e.amount), 0);
    return { ...booking, _outstanding: totalCharges - totalPayments + totalRefunds };
  }
}
