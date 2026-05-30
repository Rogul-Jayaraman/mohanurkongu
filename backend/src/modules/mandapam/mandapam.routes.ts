import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import type { MandapamController } from './mandapam.controller.js';
import { requireSession } from '../../common/middleware/requireAuth.js';
import { requireRole } from '../../common/guards/role.guard.js';
import { authConfig } from '../../config/auth.config.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';

const adminMutationLimiter = rateLimit({
  windowMs: authConfig.rateLimit.windowMs,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(429, ErrorCodes.RATE_LIMIT_EXCEEDED, ErrorCodes.RATE_LIMIT_EXCEEDED));
  },
});

export function createMandapamRoutes(controller: MandapamController): Router {
  const router = Router();

  // ── Public (no auth) ──
  router.get('/mandapam/packages', controller.getPublicPackages);
  router.get('/mandapam/packages/:code', controller.getPublicPackageByCode);
  router.get('/mandapam/facilities', controller.getPublicFacilities);
  router.get('/mandapam/addons', controller.getPublicAddons);

  // ── Admin Packages ──
  router.get('/admin/mandapam/packages', requireSession, requireRole('ADMIN'), controller.adminGetAllPackages);
  router.get('/admin/mandapam/packages/:id', requireSession, requireRole('ADMIN'), controller.adminGetPackageById);
  router.patch('/admin/mandapam/packages/:id', requireSession, requireRole('ADMIN'), adminMutationLimiter, controller.adminUpdatePackage);
  router.delete('/admin/mandapam/packages/:id/functions/:functionId', requireSession, requireRole('ADMIN'), controller.adminDeleteFunction);

  // ── Admin Facilities ──
  router.get('/admin/mandapam/facilities', requireSession, requireRole('ADMIN'), controller.adminGetAllFacilities);
  router.post('/admin/mandapam/facilities', requireSession, requireRole('ADMIN'), adminMutationLimiter, controller.adminCreateFacility);
  router.patch('/admin/mandapam/facilities/:id', requireSession, requireRole('ADMIN'), adminMutationLimiter, controller.adminUpdateFacility);
  router.delete('/admin/mandapam/facilities/:id', requireSession, requireRole('ADMIN'), controller.adminDeleteFacility);

  // ── Admin Addons ──
  router.get('/admin/mandapam/addons', requireSession, requireRole('ADMIN'), controller.adminGetAllAddons);
  router.post('/admin/mandapam/addons', requireSession, requireRole('ADMIN'), adminMutationLimiter, controller.adminCreateAddon);
  router.patch('/admin/mandapam/addons/:id', requireSession, requireRole('ADMIN'), adminMutationLimiter, controller.adminUpdateAddon);
  router.delete('/admin/mandapam/addons/:id', requireSession, requireRole('ADMIN'), controller.adminDeleteAddon);

  return router;
}
