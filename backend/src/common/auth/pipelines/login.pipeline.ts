import type { StepFunction, PortalConfig } from "../types.js";
import { pipeline as runner } from "../Pipeline.js";
import { createResolveCredentialStep } from "../steps/resolveCredential.step.js";
import { createVerifyPasswordStep } from "../steps/verifyPassword.step.js";
import { checkAccountStateStep } from "../steps/checkAccountState.step.js";
import { roleGateStep } from "../steps/roleGate.step.js";
import { createResolveCapabilitiesStep } from "../steps/resolveCapabilities.step.js";
import { createCreateSessionStep } from "../steps/createSession.step.js";
import { setRefreshCookieStep } from "../steps/setRefreshCookie.step.js";
import type { AccountRepository } from "../../../modules/account/account.repository.js";
import type { SessionService } from "../../../modules/session/session.service.js";
import type { MembershipService } from "../../../modules/membership/membership.service.js";
import type { DeviceInfo } from "../../utils/device.js";
import type { Response } from "express";
interface LoginInput {
  input: Record<string, unknown>;
  device?: DeviceInfo;
  res: Response;
}
export function createLoginPipeline(
  accountRepo: AccountRepository,
  sessionService: SessionService,
  membershipService: MembershipService,
  portal: PortalConfig,
) {
  const steps: StepFunction[] = [
    createResolveCredentialStep(accountRepo),
    createVerifyPasswordStep(accountRepo),
    checkAccountStateStep,
    roleGateStep,
    createResolveCapabilitiesStep(membershipService),
    createCreateSessionStep(sessionService),
    setRefreshCookieStep,
  ];
  return async (ctx: LoginInput) => {
    const result = await runner.run(steps, {
      input: ctx.input,
      device: ctx.device,
      res: ctx.res,
      portal,
    } as any);
    return {
      accessToken: result.session!.accessToken,
      sessionId: result.session!.sessionId,
      accountId: result.credential!.accountId,
    };
  };
}
