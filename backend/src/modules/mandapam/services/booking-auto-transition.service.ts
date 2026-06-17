import { prisma } from '../../../database/prisma.js';
import { bookingStatusPipeline } from '../pipelines/booking-status.pipeline.js';
import { BookingStatus } from '@prisma/client';
import { logger } from '../../../common/utils/logger.js';
import { DateTime } from 'luxon';

const IST_ZONE = 'Asia/Kolkata';
const TRANSITION_INTERVAL_MS = 30 * 60 * 1000;

interface BookingConfig {
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}

export class BookingAutoTransitionService {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start(): void {
    this.run().catch((e) => logger.error({ err: e }, 'Auto-transition run failed'));

    const now = Date.now();
    const msUntilNextHalfHour = TRANSITION_INTERVAL_MS - (now % TRANSITION_INTERVAL_MS);
    setTimeout(() => {
      this.run().catch((e) => logger.error({ err: e }, 'Auto-transition run failed'));
      this.intervalId = setInterval(() => {
        this.run().catch((e) => logger.error({ err: e }, 'Auto-transition run failed'));
      }, TRANSITION_INTERVAL_MS);
    }, msUntilNextHalfHour);
    logger.info({ delayMs: msUntilNextHalfHour }, 'Booking auto-transition scheduler started');
  }

  async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    logger.info('Running final auto-transition check on shutdown');
    await this.run();
    logger.info('Booking auto-transition scheduler stopped');
  }

  async run(): Promise<void> {
    const now = DateTime.now().setZone(IST_ZONE);
    logger.info({ checkTime: now.toISO() }, 'Running booking auto-transition check');

    await this.transitionConfirmedToInProgress(now);
    await this.transitionInProgressToSettlementPending(now);
  }

  private async transitionConfirmedToInProgress(now: DateTime): Promise<void> {
    const bookings = await prisma.mandapamBooking.findMany({
      where: { status: BookingStatus.CONFIRMED },
    });

    for (const booking of bookings) {
      try {
        const config = booking.bookingConfig as unknown as BookingConfig;
        if (this.shouldStart(booking.bookingType, config, now)) {
          await bookingStatusPipeline(booking.id, { status: 'IN_PROGRESS' }, booking.createdBy);
          logger.info({ bookingId: booking.id, bookingNo: booking.bookingNo }, 'Auto-transitioned CONFIRMED → IN_PROGRESS');
        }
      } catch (e) {
        logger.error({ err: e, bookingId: booking.id }, 'Failed to transition CONFIRMED booking');
      }
    }
  }

  private async transitionInProgressToSettlementPending(now: DateTime): Promise<void> {
    const bookings = await prisma.mandapamBooking.findMany({
      where: { status: BookingStatus.IN_PROGRESS },
    });

    for (const booking of bookings) {
      try {
        const config = booking.bookingConfig as unknown as BookingConfig;
        if (this.shouldEnd(booking.bookingType, config, now)) {
          await bookingStatusPipeline(booking.id, { status: BookingStatus.SETTLEMENT_PENDING }, booking.createdBy);
          logger.info({ bookingId: booking.id, bookingNo: booking.bookingNo }, 'Auto-transitioned IN_PROGRESS → SETTLEMENT_PENDING');
        }
      } catch (e) {
        logger.error({ err: e, bookingId: booking.id }, 'Failed to transition IN_PROGRESS booking');
      }
    }
  }

  private shouldStart(bookingType: string, config: BookingConfig, now: DateTime): boolean {
    switch (bookingType) {
      case 'HOURLY': {
        if (!config.startTime || !config.startDate) return false;
        const start = this.toIST(config.startDate, config.startTime);
        return now >= start;
      }
      case 'ONE_DAY':
      case 'TWO_DAY': {
        if (!config.startDate) return false;
        return now.toISODate()! >= config.startDate;
      }
      default:
        return false;
    }
  }

  private shouldEnd(bookingType: string, config: BookingConfig, now: DateTime): boolean {
    switch (bookingType) {
      case 'HOURLY': {
        if (!config.endTime || !config.startDate) return false;
        const end = this.toIST(config.startDate, config.endTime);
        return now >= end;
      }
      case 'ONE_DAY': {
        if (!config.startDate) return false;
        return now.toISODate()! > config.startDate;
      }
      case 'TWO_DAY': {
        if (!config.endDate) return false;
        return now.toISODate()! > config.endDate;
      }
      default:
        return false;
    }
  }

  private toIST(date: string, time?: string): DateTime {
    if (time) {
      return DateTime.fromISO(`${date}T${time}:00`, { zone: IST_ZONE });
    }
    return DateTime.fromISO(`${date}T00:00:00`, { zone: IST_ZONE });
  }
}
