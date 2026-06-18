import type { StepFunction } from "../types.js";
import { pipeline as runner } from "../Pipeline.js";
import { createRotateSessionStep } from "../steps/rotateSession.step.js";
import { setRefreshCookieStep } from "../steps/setRefreshCookie.step.js";
import { createResolveCapabilitiesStep } from "../steps/resolveCapabilities.step.js";
import type { SessionService } from "../../../modules/session/session.service.js";
import type { MembershipService } from "../../../modules/membership/membership.service.js";
import type { PortalConfig } from "../types.js";
import type { DeviceInfo } from "../../utils/device.js";
import type { Response } from "express";
interface RefreshInput {
  input?: { refreshToken?: string };
  device?: DeviceInfo;
  res: Response;
}
export function createRefreshPipeline(
  sessionService: SessionService,
  membershipService: MembershipService,
  portal: PortalConfig,
) {
  const steps: StepFunction[] = [
    createRotateSessionStep(sessionService),
    setRefreshCookieStep,
    createResolveCapabilitiesStep(membershipService),
  ];
  return async (ctx: RefreshInput) => {
    const result = await runner.run(steps, {
      input: { refreshToken: ctx.input?.refreshToken },
      device: ctx.device,
      res: ctx.res,
      portal,
    } as any);
    return { accessToken: result.session!.accessToken };
  };
}
