import { Request, Response } from "express";
import { MandapamPackageService } from "../services/mandapamPackage.service";
import { MandapamBookingService } from "../services/mandapamBooking.service";
import { ErrorCode, sendError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export class MandapamController {
  // --- PACKAGE METHODS ---

  static async createPackage(req: Request, res: Response) {
    try {
      const pkg = await MandapamPackageService.createPackage(req.body);
      return sendSuccess(res, pkg, 201);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async listPackages(req: Request, res: Response) {
    try {
      const activeOnly = req.query.activeOnly === "true";
      const packages = await MandapamPackageService.listPackages(activeOnly);
      return sendSuccess(res, packages, 200);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updatePackage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const pkg = await MandapamPackageService.updatePackage(id as string, req.body);
      return sendSuccess(res, pkg, 200);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async togglePackageStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const pkg = await MandapamPackageService.togglePackageStatus(id as string, isActive);
      return sendSuccess(res, pkg, 200);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // --- BOOKING METHODS ---

  static async getCalendar(req: Request, res: Response) {
    try {
      const status = await MandapamBookingService.getCalendarStatus();
      return sendSuccess(res, status, 200);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getBookingByDate(req: Request, res: Response) {
    try {
      const { date } = req.query;
      if (!date) return res.status(400).json({ error: "Date is required" });
      const bookings = await MandapamBookingService.getBookingsByDate(date as string);
      return sendSuccess(res, bookings, 200);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async listBookings(req: Request, res: Response) {
    try {
      const { month, year, paymentStatus } = req.query;
      const bookings = await MandapamBookingService.listBookings({
        month: month ? parseInt(month as string) : undefined,
        year: year ? parseInt(year as string) : undefined,
        paymentStatus: paymentStatus as any,
      });
      return sendSuccess(res, bookings, 200);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createBooking(req: Request, res: Response) {
    try {
      // Assuming userId is attached to req.user by auth middleware
      const adminId = (req as any).user?.userId;
      if (!adminId) return res.status(401).json({ error: "Unauthorized: Admin ID not found" });

      const booking = await MandapamBookingService.createBooking({
        ...req.body,
        createdBy: adminId,
      });
      return sendSuccess(res, booking, 201);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async blockDate(req: Request, res: Response) {
    try {
      const block = await MandapamBookingService.blockDate(req.body);
      return sendSuccess(res, block, 201);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getBlockedDetails(req: Request, res: Response) {
    try {
      const { date } = req.params;
      const details = await MandapamBookingService.getBlockedDetails(date as string);
      if (!details) return sendError(res, ErrorCode.ERR_SERVER_001, "No block found for this date");
      return sendSuccess(res, details, 200);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async unblockDate(req: Request, res: Response) {
    try {
      const { date } = req.query;
      if (!date) return res.status(400).json({ error: "Date is required" });
      await MandapamBookingService.unblockDate(date as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async addPayment(req: Request, res: Response) {
    try {
      const bookingId = req.params.bookingId as string;
      const { amount, paymentMethod, transactionId, notes } = req.body;
      if (!amount || amount <= 0) return res.status(400).json({ error: "Amount must be greater than 0" });
      const booking = await MandapamBookingService.addPayment(bookingId, { amount, paymentMethod, transactionId, notes });
      return sendSuccess(res, booking, 200);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateBooking(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const booking = await MandapamBookingService.updateBooking(id as string, req.body);
      return sendSuccess(res, booking, 200);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteBooking(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await MandapamBookingService.deleteBooking(id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
