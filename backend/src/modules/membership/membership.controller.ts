import type { Request, Response, NextFunction } from 'express';
import { MembershipService } from './membership.service.js';
import { MembershipGuard } from './membership.guard.js';
import { sendSuccess } from '../../common/responses/ApiResponse.js';

export class MembershipController {
  constructor(
    private membershipService: MembershipService,
    private membershipGuard: MembershipGuard,
  ) {}

  listPlans = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const plans = await this.membershipService.getActivePlans();
      sendSuccess(res, { plans });
    } catch (err) { next(err); }
  };

  adminListPlans = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const plans = await this.membershipService.getAllPlans();
      sendSuccess(res, { plans });
    } catch (err) { next(err); }
  };

  adminUpdatePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan = await this.membershipService.updatePlan(req.params.id as string, req.body);
      sendSuccess(res, { plan });
    } catch (err) { next(err); }
  };

  adminGetSetting = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const value = await this.membershipService.getSetting('membership_enabled');
      sendSuccess(res, { membershipEnabled: value === 'true' });
    } catch (err) { next(err); }
  };

  adminUpdateSetting = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.account.sub;
      const { membershipEnabled } = req.body;
      await this.membershipService.updateSetting('membership_enabled', membershipEnabled ? 'true' : 'false', adminId);
      sendSuccess(res, { membershipEnabled: !!membershipEnabled });
    } catch (err) { next(err); }
  };

  getMySubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.account.sub;
      const sub = await this.membershipService.getUserSubscription(accountId);
      const caps = await this.membershipGuard.resolveCapabilities(accountId);
      sendSuccess(res, { subscription: sub, capabilities: caps });
    } catch (err) { next(err); }
  };

  getMyCapabilities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.account.sub;
      const caps = await this.membershipGuard.resolveCapabilities(accountId);
      sendSuccess(res, { capabilities: caps });
    } catch (err) { next(err); }
  };

  adminCancelSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.account.sub;
      const accountId = req.params.accountId as string;
      const { action } = req.body;
      const sub = await this.membershipService.cancelSubscription(adminId, accountId, action);
      sendSuccess(res, { subscription: sub });
    } catch (err) { next(err); }
  };

  adminAssignSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.account.sub;
      const { accountId, planId, paymentMethod, notes } = req.body;
      const sub = await this.membershipService.assignSubscription(adminId, accountId, planId, { paymentMethod, notes });
      sendSuccess(res, { subscription: sub });
    } catch (err) { next(err); }
  };

  adminGetAllSubscriptions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit, cursor, status } = req.query;
      const result = await this.membershipService.getAllSubscriptions({
        limit: limit ? Number(limit) : 20,
        cursor: cursor as string | undefined,
        status: status as any,
      });
      sendSuccess(res, result);
    } catch (err) { next(err); }
  };

  getSubscriptionHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const history = await this.membershipService.getSubscriptionHistory(req.params.accountId as string);
      sendSuccess(res, { history });
    } catch (err) { next(err); }
  };

  getBillingOverview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.account.sub;
      const [plans, caps, sub, history] = await Promise.all([
        this.membershipService.getActivePlans(),
        this.membershipGuard.resolveCapabilities(accountId),
        this.membershipService.getUserSubscription(accountId),
        this.membershipService.getSubscriptionHistory(accountId),
      ]);

      sendSuccess(res, {
        currentPlan: sub
          ? { name: sub.snapshotPlanName, expiresAt: sub.expiresAt, planCode: sub.snapshotPlanCode }
          : null,
        capabilities: caps
          ? {
              searchLevel: caps.searchLevel,
              profileSlotLimit: caps.profileSlotLimit,
              shortlistLimit: caps.shortlistLimit,
              printProfile: caps.printProfile,
            }
          : null,
        plans: plans.map((p: any) => ({
          code: p.code,
          displayName: p.displayName,
          displayPrice: p.displayPrice,
          durationDays: p.durationDays,
          openLimit: p.openLimit,
          shortlistLimit: p.shortlistLimit,
          profileSlotLimit: p.profileSlotLimit,
          viewDetails: p.viewDetails,
          printProfile: p.printProfile,
          printHoroscope: p.printHoroscope,
          searchLevel: p.searchLevel,
        })),
        history: history.map((h: any) => ({
          planName: h.snapshotPlanName,
          amount: h.snapshotDisplayPrice,
          startedAt: h.startedAt,
          expiresAt: h.expiresAt,
          status: h.status,
        })),
      });
    } catch (err) { next(err); }
  };
}
