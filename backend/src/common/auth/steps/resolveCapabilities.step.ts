import type { PipelineContext } from '../types.js';
import { MembershipService } from '../../../modules/membership/membership.service.js';

export function createResolveCapabilitiesStep(membershipService: MembershipService) {
  return async (ctx: PipelineContext): Promise<PipelineContext> => {
    if (!ctx.accountId) return ctx;

    const snapshot = await membershipService.resolveCapabilities(ctx.accountId);
    if (snapshot) {
      ctx.capabilities = {
        planCode: snapshot.planCode,
        planName: snapshot.planName,
        openLimit: snapshot.openLimit,
        shortlistLimit: snapshot.shortlistLimit,
        profileSlotLimit: snapshot.profileSlotLimit,
        viewDetails: snapshot.viewDetails,
        printProfile: snapshot.printProfile,
        printHoroscope: snapshot.printHoroscope,
        searchLevel: snapshot.searchLevel,
        isActive: snapshot.isActive,
        expiresAt: snapshot.expiresAt?.toISOString() ?? null,
      };
    }

    return ctx;
  };
}
