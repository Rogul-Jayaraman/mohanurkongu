import { MandapamSession, MandapamPaymentStatus, MandapamPaymentMode, MandapamBookingStatus } from "@prisma/client"; 
import { startOfDay } from "date-fns";
import prisma from "../config/prisma";

export class MandapamBookingService {
  /**
   * Main booking creation logic with snapshotting and collision checks
   */
  static async createBooking(data: {
    date: Date;
    session: MandapamSession;
    eventTitleEn: string;
    eventTitleTa: string;
    contactNameEn: string;
    contactNameTa: string;
    phone: string;
    email?: string;
    addressEn?: string;
    addressTa?: string;
    packageId: string;
    paymentMode: MandapamPaymentMode;
    paymentStatus: MandapamPaymentStatus;
    paidAmount: number;
    createdBy: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const d = new Date(data.date);
      const normalizedDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

      // 1. Check if date is blocked
      const isBlocked = await tx.blockedDate.findUnique({
        where: { date: normalizedDate },
      });
      if (isBlocked) throw new Error("This date is blocked for maintenance.");

      // 2. Check for double booking (date + session)
      const existingBooking = await tx.mandapamBooking.findUnique({
        where: {
          date_session: {
            date: normalizedDate,
            session: data.session,
          },
        },
      });
      if (existingBooking) throw new Error("This slot is already booked.");

      // 3. Fetch Package for snapshotting
      const pkg = await tx.mandapamPackage.findUnique({
        where: { id: data.packageId },
      });
      if (!pkg) throw new Error("Package not found.");
      if (!pkg.isActive) throw new Error("This package is no longer active.");

      // 4. Calculate Payment
      const totalAmount = pkg.price;
      let paidAmountValue = data.paidAmount || 0;

      if (data.paymentStatus === MandapamPaymentStatus.NOT_PAID) {
        paidAmountValue = 0;
      } else if (data.paymentStatus === MandapamPaymentStatus.FULLY_PAID) {
        paidAmountValue = totalAmount;
      } else if (data.paymentStatus === MandapamPaymentStatus.ADVANCE) {
        if (paidAmountValue <= 0 || paidAmountValue >= totalAmount) {
          throw new Error("Advance amount must be greater than 0 and less than total package price.");
        }
      }

      const balance = totalAmount - paidAmountValue;

      // 5. Generate Event ID
      const lastBooking = await tx.mandapamBooking.findFirst({
        orderBy: { createdAt: 'desc' },
      }) as any;

      const nextSerial = (lastBooking?.serialInt || 0) + 1;
      const padLength = Math.max(4, nextSerial.toString().length);
      const eventId = `MK-${nextSerial.toString().padStart(padLength, '0')}`;

      return await tx.mandapamBooking.create({
        data: {
          eventId,
          date: normalizedDate,
          session: data.session,
          eventTitleEn: data.eventTitleEn,
          eventTitleTa: data.eventTitleTa,
          contactNameEn: data.contactNameEn,
          contactNameTa: data.contactNameTa,
          phone: data.phone,
          email: data.email,
          addressEn: data.addressEn,
          addressTa: data.addressTa,
          packageId: data.packageId,
          packageNameEn: pkg.nameEn,
          packageNameTa: pkg.nameTa,
          packageSnapshotPrice: pkg.price,
          paymentMode: data.paymentMode,
          paymentStatus: data.paymentStatus,
          totalAmount,
          paidAmount: paidAmountValue,
          balance,
          status: MandapamBookingStatus.UPCOMING,
          createdBy: data.createdBy,
        },
      });
    });
  }

  static async getCalendarStatus() {
    // 1. Fetch all blocked dates first
    const blocked = await prisma.blockedDate.findMany({
      select: { date: true },
    });

    // 2. Fetch all bookings
    const bookings = await prisma.mandapamBooking.findMany({
      select: { date: true },
    });

    const statusMap = new Map<string, string>();

    // 3. Process blocked dates (Lower priority)
    blocked.forEach((b: any) => {
      const year = b.date.getUTCFullYear();
      const month = String(b.date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(b.date.getUTCDate()).padStart(2, '0');
      statusMap.set(`${year}-${month}-${day}`, "BLOCKED");
    });

    // 4. Process bookings (Higher priority, overwrites blocked)
    bookings.forEach((b: any) => {
      const year = b.date.getUTCFullYear();
      const month = String(b.date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(b.date.getUTCDate()).padStart(2, '0');
      statusMap.set(`${year}-${month}-${day}`, "BOOKED");
    });

    return Array.from(statusMap.entries()).map(([date, type]) => ({
      date,
      type,
    }));
  }

  static async getBookingsByDate(date: string) {
    // Ensure date is treated as UTC midnight of the intended calendar day
    const d = new Date(date);
    const normalizedDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    return await prisma.mandapamBooking.findMany({
      where: { date: normalizedDate },
      select: {
        eventId: true,
        eventTitleEn: true,
        eventTitleTa: true,
        session: true,
        contactNameEn: true,
        contactNameTa: true,
        phone: true,
        paymentStatus: true,
        paidAmount: true,
        totalAmount: true,
      }
    });
  }

  static async listBookings(filters?: {
    month?: number;
    year?: number;
    status?: string;
    paymentStatus?: MandapamPaymentStatus;
  }) {
    let where: any = {};

    if (filters?.year || filters?.month) {
      const year = filters.year || new Date().getFullYear();
      const month = filters.month;

      if (month) {
        where.date = {
          gte: new Date(Date.UTC(year, month - 1, 1)),
          lt: new Date(Date.UTC(year, month, 1)),
        };
      } else {
        where.date = {
          gte: new Date(Date.UTC(year, 0, 1)),
          lt: new Date(Date.UTC(year + 1, 0, 1)),
        };
      }
    }

    if (filters?.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    return await prisma.mandapamBooking.findMany({
      where,
      include: { package: true },
      orderBy: { date: "desc" },
    });
  }

  static async blockDate(data: { date: Date; reasonTa: string; reasonEn: string }) {
    const d = new Date(data.date);
    const normalizedDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

    // Validation: Cannot block if already booked
    const hasBooking = await prisma.mandapamBooking.findFirst({
      where: { date: normalizedDate },
    });
    if (hasBooking) throw new Error("Cannot block a date that has existing bookings.");

    return await prisma.blockedDate.upsert({
      where: { date: normalizedDate },
      update: { reasonTa: data.reasonTa, reasonEn: data.reasonEn },
      create: { date: normalizedDate, reasonTa: data.reasonTa, reasonEn: data.reasonEn },
    });
  }

  static async getBlockedDetails(date: string) {
    const d = new Date(date);
    const normalizedDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    return await prisma.blockedDate.findUnique({
      where: { date: normalizedDate },
      select: {
        reasonTa: true,
        reasonEn: true,
      }
    });
  }

  static async unblockDate(date: string) {
    const d = new Date(date);
    const normalizedDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    return await prisma.blockedDate.delete({
      where: { date: normalizedDate },
    });
  }

  static async updateBooking(id: string, data: any) {
    const existing = await prisma.mandapamBooking.findUnique({
      where: { id },
    });

    if (!existing) throw new Error("Booking not found.");

    let updateData: any = { ...data };

    // If date or session is changing, check for collisions
    if (data.date || data.session) {
      const d = data.date ? new Date(data.date) : existing.date;
      const session = data.session || existing.session;
      const normalizedDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

      if (data.date || data.session) {
          const collision = await prisma.mandapamBooking.findFirst({
              where: {
                  date: normalizedDate,
                  session,
                  id: { not: id }
              }
          });
          if (collision) throw new Error("The selected slot is already booked.");
          updateData.date = normalizedDate;
      }
    }

    // If package is changing, update snapshot and recalculate
    if (data.packageId && data.packageId !== existing.packageId) {
        const pkg = await prisma.mandapamPackage.findUnique({ where: { id: data.packageId } });
        if (!pkg) throw new Error("Package not found.");
        updateData.packageNameEn = pkg.nameEn;
        updateData.packageNameTa = pkg.nameTa;
        updateData.packageSnapshotPrice = pkg.price;
        updateData.totalAmount = pkg.price;
        updateData.balance = pkg.price - (data.paidAmount ?? existing.paidAmount);
    } else if (data.paidAmount !== undefined) {
        updateData.balance = (updateData.totalAmount ?? existing.totalAmount) - data.paidAmount;
    }

    return await prisma.mandapamBooking.update({
      where: { id },
      data: updateData,
    });
  }

  static async addPayment(bookingId: string, data: { amount: number; paymentMethod?: string; transactionId?: string; notes?: string }) {
    const existing = await prisma.mandapamBooking.findUnique({ where: { id: bookingId } });
    if (!existing) throw new Error("Booking not found.");

    const newPaidAmount = existing.paidAmount + data.amount;
    const newBalance = existing.totalAmount - newPaidAmount;
    const newPaymentStatus = newBalance <= 0 ? MandapamPaymentStatus.FULLY_PAID : MandapamPaymentStatus.ADVANCE;

    return await prisma.mandapamBooking.update({
      where: { id: bookingId },
      data: {
        paidAmount: newPaidAmount,
        balance: newBalance,
        paymentStatus: newPaymentStatus,
      },
    });
  }

  static async deleteBooking(id: string) {
    return await prisma.mandapamBooking.delete({
      where: { id },
    });
  }
}
