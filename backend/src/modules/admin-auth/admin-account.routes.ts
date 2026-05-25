import { Router } from 'express';
import type { AdminAccountController } from './admin-account.controller.js';
import { requireSession } from '../../common/middleware/requireAuth.js';
import { requireRole } from '../../common/guards/role.guard.js';

export function createAdminAccountRoutes(controller: AdminAccountController): Router {
  const router = Router();

  router.use(requireSession, requireRole('ADMIN'));

  router.get('/accounts', controller.listAccounts);
  router.get('/accounts/:id', controller.getAccountDetail);
  router.post('/accounts/:id/suspend', controller.suspendAccount);
  router.post('/accounts/:id/restore', controller.restoreAccount);

  return router;
}
