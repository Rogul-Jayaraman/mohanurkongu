import type { Request, Response, NextFunction } from 'express';
import { BookingService } from './booking.service.js';
import { sendSuccess } from '../../common/responses/ApiResponse.js';
import {
  createBookingSchema, updateBookingStatusSchema, addPaymentSchema,
  addRefundSchema, addAddonSchema, blockDatesSchema, unblockDatesSchema,
  settlementActionSchema, bookingFiltersSchema,
} from './booking.validation.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';

export class BookingController {
  constructor(private bookingService: BookingService) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = bookingFiltersSchema.parse(req.query);
      const result = await this.bookingService.list(filters);
      sendSuccess(res, {
        bookings: result.bookings,
        meta: { total: result.total, page: result.page, limit: result.limit, totalPages: Math.ceil(result.total / result.limit) },
      });
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.getById(req.params.id as string);
      sendSuccess(res, { booking });
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = createBookingSchema.parse(req.body);
      const createdBy = req.account?.sub;
      if (!createdBy) throw new AppError(401, ErrorCodes.AUTH_UNAUTHORIZED, 'Unauthorized');
      const booking = await this.bookingService.create(dto, createdBy);
      sendSuccess(res, { booking }, 201);
    } catch (err) { next(err); }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = updateBookingStatusSchema.parse(req.body);
      const performedBy = req.account?.sub;
      if (!performedBy) throw new AppError(401, ErrorCodes.AUTH_UNAUTHORIZED, 'Unauthorized');
      const booking = await this.bookingService.updateStatus(req.params.id as string, dto, performedBy);
      sendSuccess(res, { booking });
    } catch (err) { next(err); }
  };

  addPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = addPaymentSchema.parse(req.body);
      const performedBy = req.account?.sub;
      if (!performedBy) throw new AppError(401, ErrorCodes.AUTH_UNAUTHORIZED, 'Unauthorized');
      const booking = await this.bookingService.addPayment(req.params.id as string, dto, performedBy);
      sendSuccess(res, { booking });
    } catch (err) { next(err); }
  };

  addRefund = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = addRefundSchema.parse(req.body);
      const performedBy = req.account?.sub;
      if (!performedBy) throw new AppError(401, ErrorCodes.AUTH_UNAUTHORIZED, 'Unauthorized');
      const booking = await this.bookingService.addRefund(req.params.id as string, dto, performedBy);
      sendSuccess(res, { booking });
    } catch (err) { next(err); }
  };

  addAddon = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = addAddonSchema.parse(req.body);
      const booking = await this.bookingService.addAddon(req.params.id as string, dto);
      sendSuccess(res, { booking });
    } catch (err) { next(err); }
  };

  removeAddon = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.removeAddon(req.params.id as string, req.params.snapshotId as string);
      sendSuccess(res, { booking });
    } catch (err) { next(err); }
  };

  settlementAction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = settlementActionSchema.parse(req.body);
      const performedBy = req.account?.sub;
      if (!performedBy) throw new AppError(401, ErrorCodes.AUTH_UNAUTHORIZED, 'Unauthorized');
      const booking = await this.bookingService.settlementAction(req.params.id as string, dto, performedBy);
      sendSuccess(res, { booking });
    } catch (err) { next(err); }
  };

  // Calendar

  getCalendar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const from = (req.query.from as string) || new Date().toISOString().split('T')[0];
      const to = (req.query.to as string) || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
      const entries = await this.bookingService.getCalendarEntries(from, to);
      sendSuccess(res, { entries });
    } catch (err) { next(err); }
  };

  getCalendarDay = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const day = await this.bookingService.getCalendarDay(req.params.date as string);
      sendSuccess(res, { day });
    } catch (err) { next(err); }
  };

  blockDates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = blockDatesSchema.parse(req.body);
      const entries = await this.bookingService.blockDates(dto);
      sendSuccess(res, { entries });
    } catch (err) { next(err); }
  };

  unblockDates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = unblockDatesSchema.parse(req.body);
      const entries = await this.bookingService.unblockDates(dto.dates);
      sendSuccess(res, { entries });
    } catch (err) { next(err); }
  };

  // Public

  getPublicCalendar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const from = (req.query.from as string) || new Date().toISOString().split('T')[0];
      const to = (req.query.to as string) || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
      const allEntries = await this.bookingService.getCalendarEntries(from, to);
      const available = allEntries.filter(e => e.status !== 'BLOCKED' && e.status !== 'FULLY_BOOKED');
      const dates = available.map(e => e.date.toISOString().split('T')[0]);
      sendSuccess(res, { availableDates: dates, month: from.substring(0, 7) });
    } catch (err) { next(err); }
  };
}
