import { prisma } from '../../database/prisma.js';

export class AdminDashboardRepository {
  async countTotalUsers(): Promise<number> {
    return prisma.account.count();
  }

  async countNewUsers(days: number): Promise<number> {
    const since = new Date(Date.now() - days * 86400000);
    return prisma.account.count({ where: { createdAt: { gte: since } } });
  }

  async countTotalProfiles(): Promise<number> {
    return prisma.profile.count();
  }

  async countProfilesByStatus(status: string): Promise<number> {
    return prisma.profile.count({ where: { currentStatus: status as any } });
  }

  async countTotalBookings(): Promise<number> {
    return prisma.mandapamBooking.count();
  }

  async countTodaysBookings(): Promise<number> {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCHours(23, 59, 59, 999);

    const entries = await prisma.mandapamCalendarEntry.findMany({
      where: {
        date: { gte: todayStart, lte: todayEnd },
        bookingId: { not: null },
        status: { in: ['FULLY_BOOKED', 'PARTIALLY_BOOKED'] },
      },
      select: { bookingId: true },
      distinct: ['bookingId'],
    });
    return entries.length;
  }

  async getTotalRevenue(): Promise<number> {
    const result = await prisma.mandapamPaymentLedger.aggregate({
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  async getTodaysEvents() {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCHours(23, 59, 59, 999);

    const entries = await prisma.mandapamCalendarEntry.findMany({
      where: {
        date: { gte: todayStart, lte: todayEnd },
        bookingId: { not: null },
        status: { in: ['FULLY_BOOKED', 'PARTIALLY_BOOKED'] },
      },
      include: {
        booking: {
          include: {
            paymentEntries: { select: { amount: true, paymentType: true } },
            settlement: { select: { state: true, finalAmount: true } },
            ledgerEntries: { select: { amount: true } },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return entries.map((e) => {
      const booking = e.booking!;
      const customerName = booking.customerName as any;
      const eventTitle = booking.eventTitle as any;

      const totalCharges = booking.ledgerEntries.reduce((s, l) => s + Number(l.amount), 0);
      const totalPayments = booking.paymentEntries.reduce((s, p) => s + Number(p.amount), 0);

      let paymentStatus: string;
      if (totalPayments <= 0) paymentStatus = 'NOT_PAID';
      else if (totalPayments >= totalCharges) paymentStatus = 'FULLY_PAID';
      else paymentStatus = 'ADVANCE';

      let session: string;
      if (!e.startTime && !e.endTime) session = 'FULL_DAY';
      else {
        const h = e.startTime!.getUTCHours();
        session = h < 12 ? 'MORNING' : 'EVENING';
      }

      return {
        eventId: booking.id,
        eventTitleEn: eventTitle?.en ?? '',
        eventTitleTa: eventTitle?.ta ?? '',
        session,
        nameEn: customerName?.en ?? '',
        nameTa: customerName?.ta ?? '',
        phone: booking.customerPhone,
        paymentStatus,
        bookingNo: booking.bookingNo,
      };
    });
  }
}
