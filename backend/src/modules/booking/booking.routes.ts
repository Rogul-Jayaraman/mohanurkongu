import { Router } from 'express';
import type { BookingController } from './booking.controller.js';
import { requireSession } from '../../common/middleware/requireAuth.js';
import { requireRole } from '../../common/guards/role.guard.js';

export function createBookingRoutes(controller: BookingController): Router {
  const router = Router();

  // Bookings
  router.get('/admin/mandapam/bookings', requireSession, requireRole('ADMIN'), controller.list);
  router.get('/admin/mandapam/bookings/:id', requireSession, requireRole('ADMIN'), controller.getById);
  router.post('/admin/mandapam/bookings', requireSession, requireRole('ADMIN'), controller.create);
  router.patch('/admin/mandapam/bookings/:id/status', requireSession, requireRole('ADMIN'), controller.updateStatus);
  router.post('/admin/mandapam/bookings/:id/payments', requireSession, requireRole('ADMIN'), controller.addPayment);
  router.post('/admin/mandapam/bookings/:id/refunds', requireSession, requireRole('ADMIN'), controller.addRefund);
  router.post('/admin/mandapam/bookings/:id/addons', requireSession, requireRole('ADMIN'), controller.addAddon);
  router.delete('/admin/mandapam/bookings/:id/addons/:snapshotId', requireSession, requireRole('ADMIN'), controller.removeAddon);
  router.post('/admin/mandapam/bookings/:id/settlement', requireSession, requireRole('ADMIN'), controller.settlementAction);

  // Calendar (admin)
  router.get('/admin/mandapam/calendar', requireSession, requireRole('ADMIN'), controller.getCalendar);
  router.get('/admin/mandapam/calendar/:date', requireSession, requireRole('ADMIN'), controller.getCalendarDay);
  router.post('/admin/mandapam/calendar/block', requireSession, requireRole('ADMIN'), controller.blockDates);
  router.post('/admin/mandapam/calendar/unblock', requireSession, requireRole('ADMIN'), controller.unblockDates);

  return router;
}

export function createPublicBookingRoutes(controller: BookingController): Router {
  const router = Router();

  router.get('/mandapam/calendar', controller.getPublicCalendar);

  return router;
}
