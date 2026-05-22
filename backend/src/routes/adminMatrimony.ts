import { Router } from 'express';
import * as adminController from '../controllers/adminMatrimony.controller';
import { authenticate, authorizeAdmin } from '../middlewares/auth';

const router = Router();

// All routes here require admin privileges
router.use(authenticate, authorizeAdmin);

// --- ACCOUNTS ---
router.get('/accounts', adminController.getAccounts);
router.patch('/accounts/:id/suspend', adminController.suspendAccount);
router.patch('/accounts/:id/revoke-suspension', adminController.revokeSuspension);
// TODO: Re-implement plan routes with new plan system

// --- PROFILES ---
router.get('/profiles', adminController.getProfiles);
router.get('/verification', adminController.getVerificationProfiles);
router.get('/profiles/:id', adminController.getProfileById);
router.patch('/profiles/:id/verify', adminController.verifyProfile);
router.patch('/profiles/:id/block', adminController.blockProfile);
router.patch('/profiles/:id/status', adminController.updateProfileStatus);

// --- DASHBOARD ---
router.get('/stats', adminController.getDashboardStats);

// TODO: Re-implement premium price settings with new plan system

export default router;
