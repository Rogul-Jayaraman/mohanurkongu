import type { StepFunction } from "../types.js";
import { pipeline as runner } from "../Pipeline.js";
import { createValidateVerificationTokenStep } from "../steps/validateVerificationToken.step.js";
import { createResolveAccountForResetStep } from "../steps/resolveAccountForReset.step.js";
import { createResolveResetSessionStep } from "../steps/resolveResetSession.step.js";
import { hashPasswordStep } from "../steps/hashPassword.step.js";
import { updatePasswordStep } from "../steps/updatePassword.step.js";
import { revokeAllSessionsStep } from "../steps/revokeSessions.step.js";
import { markResetSessionUsedStep } from "../steps/accountManagement.steps.js";
import { enqueueAuditEvent } from "../../utils/audit.js";
import { PORTAL_CONFIGS } from "../types.js";
export function createResetPasswordPipeline() {
  const steps: StepFunction[] = [
    createValidateVerificationTokenStep("reset_password"),
    createResolveResetSessionStep(),
    createResolveAccountForResetStep(),
    hashPasswordStep,
    updatePasswordStep,
    revokeAllSessionsStep,
    markResetSessionUsedStep,
  ];
  return async (input: Record<string, unknown>) => {
    const ctx = await runner.run(steps, { input, portal: PORTAL_CONFIGS.USER });
    await enqueueAuditEvent("PASSWORD_RESET", ctx.accountId, {});
    return { message: "Password reset successfully" };
  };
}
