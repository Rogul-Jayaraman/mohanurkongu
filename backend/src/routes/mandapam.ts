import { Router } from "express";
import { MandapamController } from "../controllers/mandapamController";
import { authenticate, authorizeAdmin } from "../middlewares/auth";

const router = Router();

// Package management (Admin only)
router.post("/package", authenticate, authorizeAdmin, MandapamController.createPackage);
router.get("/packages", authenticate, authorizeAdmin, MandapamController.listPackages);
router.put("/package/:id", authenticate, authorizeAdmin, MandapamController.updatePackage);
router.patch("/package/:id/status", authenticate, authorizeAdmin, MandapamController.togglePackageStatus);

// Booking management (Admin only)
router.get("/bookings", authenticate, authorizeAdmin, MandapamController.listBookings);
router.get("/calendar", authenticate, authorizeAdmin, MandapamController.getCalendar);
router.get("/booking/by-date", authenticate, authorizeAdmin, MandapamController.getBookingByDate);
router.post("/booking", authenticate, authorizeAdmin, MandapamController.createBooking);
router.post("/block-date", authenticate, authorizeAdmin, MandapamController.blockDate);
router.delete("/block-date", authenticate, authorizeAdmin, MandapamController.unblockDate);
router.get("/blocked-date/:date", authenticate, authorizeAdmin, MandapamController.getBlockedDetails);
router.patch("/booking/:id", authenticate, authorizeAdmin, MandapamController.updateBooking);
router.post("/bookings/:bookingId/payments", authenticate, authorizeAdmin, MandapamController.addPayment);
router.delete("/booking/:id", authenticate, authorizeAdmin, MandapamController.deleteBooking);

export default router;
