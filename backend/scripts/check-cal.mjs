import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const calCount = await prisma.mandapamCalendarEntry.count();
const bookCount = await prisma.mandapamBooking.count();
const recent = await prisma.mandapamBooking.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, bookingNo: true, status: true, bookingConfig: true } });
console.log('Calendar entries:', calCount);
console.log('Bookings:', bookCount);
for (const b of recent) {
  console.log('Booking:', b.bookingNo, b.status, JSON.stringify(b.bookingConfig));
}
const entries = await prisma.mandapamCalendarEntry.findMany({ take: 10, orderBy: { date: 'desc' } });
console.log('\nCalendar entries:');
for (const e of entries) {
  console.log(e.date.toISOString().split('T')[0], e.status, e.bookingId);
}
await prisma.$disconnect();
