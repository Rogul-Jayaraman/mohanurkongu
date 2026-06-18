import type { StepFunction } from "../types.js";
import { pipeline as runner } from "../Pipeline.js";
import { createVerifyCurrentPasswordStep } from "../steps/updatePassword.step.js";
import { hashPasswordStep } from "../steps/hashPassword.step.js";
import { updatePasswordStep } from "../steps/updatePassword.step.js";
import {
  resolveAccountFromSessionStep,
  revokeAllSessionsStep,
} from "../steps/revokeSessions.step.js";
import { PORTAL_CONFIGS } from "../types.js";
export function createChangePasswordPipeline() {
  const steps: StepFunction[] = [
    resolveAccountFromSessionStep,
    createVerifyCurrentPasswordStep(),
    hashPasswordStep,
    updatePasswordStep,
    revokeAllSessionsStep,
  ];
  return async (input: Record<string, unknown>) => {
    const ctx = await runner.run(steps, { input, portal: PORTAL_CONFIGS.USER });
    return { message: "Password changed successfully" };
  };
}
