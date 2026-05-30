import { prisma } from '../../database/prisma.js';
import type { BookingFilters, BookingWithRelations } from './booking.types.js';
import type { Prisma } from '@prisma/client';

export class BookingRepository {
  async findMany(filters: BookingFilters) {
    const where: Prisma.MandapamBookingWhereInput = {};
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    if (filters.status) {
      where.status = filters.status as any;
    }
    if (filters.packageCode) {
      where.packageCode = filters.packageCode;
    }
    if (filters.search) {
      where.OR = [
        { customerName: { path: ['en'], string_contains: filters.search } },
        { customerName: { path: ['ta'], string_contains: filters.search } },
        { eventTitle: { path: ['en'], string_contains: filters.search } },
        { eventTitle: { path: ['ta'], string_contains: filters.search } },
        { bookingNo: { contains: filters.search } },
        { customerPhone: { contains: filters.search } },
      ];
    }
    const [bookings, total] = await Promise.all([
      prisma.mandapamBooking.findMany({
        where,
        include: {
          packageSnapshot: true,
          paymentEntries: { orderBy: { createdAt: 'desc' } },
          settlement: true,
          timeline: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.mandapamBooking.count({ where }),
    ]);

    return { bookings, total, page, limit };
  }

  async findById(id: string) {
    return prisma.mandapamBooking.findUnique({
      where: { id },
      include: {
        packageSnapshot: true,
        addonSnapshots: true,
        calendarEntries: true,
        ledgerEntries: { orderBy: { createdAt: 'desc' } },
        paymentEntries: { orderBy: { createdAt: 'desc' } },
        refundEntries: { orderBy: { createdAt: 'desc' } },
        tokenEntries: true,
        settlement: true,
        timeline: { orderBy: { createdAt: 'asc' } },
        invoice: { include: { lines: true } },
      },
    });
  }

  async findByBookingNo(bookingNo: string) {
    return prisma.mandapamBooking.findUnique({
      where: { bookingNo },
      include: { paymentEntries: true, refundEntries: true, ledgerEntries: true },
    });
  }

  async create(data: Prisma.MandapamBookingCreateInput) {
    return prisma.mandapamBooking.create({ data });
  }

  async update(id: string, data: Prisma.MandapamBookingUpdateInput) {
    return prisma.mandapamBooking.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.mandapamBooking.delete({ where: { id } });
  }

  async getNextBookingNo(): Promise<string> {
    const counter = await prisma.counter.upsert({
      where: { prefix: 'BK' },
      update: { counter: { increment: 1 } },
      create: { prefix: 'BK', counter: 1 },
    });
    return `BK-${String(counter.counter).padStart(4, '0')}`;
  }
}
