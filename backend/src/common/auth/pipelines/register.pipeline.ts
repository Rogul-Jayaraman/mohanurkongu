import type { PipelineContext, StepFunction } from "../types.js";
import { pipeline as runner } from "../Pipeline.js";
import { createValidateVerificationTokenStep } from "../steps/validateVerificationToken.step.js";
import { hashPasswordStep } from "../steps/hashPassword.step.js";
import { createResolveRegistrationSessionStep } from "../steps/resolveRegistrationSession.step.js";
import { enqueueAuditEvent } from "../../utils/audit.js";
import {
  createCheckEmailUniquenessStep,
  createCreateAccountStep,
  assignUserRoleStep,
  assignFreeSubscriptionStep,
  markRegistrationSessionUsedStep,
} from "../steps/accountManagement.steps.js";
import type { AccountRepository } from "../../../modules/account/account.repository.js";
import type { AccountService } from "../../../modules/account/account.service.js";
import type { NotificationService } from "../../../modules/notification/notification.service.js";
import { appConfig } from "../../../config/app.config.js";
import { PORTAL_CONFIGS } from "../types.js";
export function createRegisterPipeline(
  accountRepo: AccountRepository,
  accountService: AccountService,
  notificationService: NotificationService,
) {
  async function sendWelcomeEmailStep(
    ctx: PipelineContext,
  ): Promise<PipelineContext> {
    if (!ctx.email || !ctx.accountId) return ctx;
    const name = (ctx.input.firstNameEn as string) || "";
    const profileUrl = `${appConfig.appUrl}/manamaalai/profile/edit`;
    await notificationService.sendWelcomeEmail(ctx.email, name, profileUrl);
    return ctx;
  }
  const steps: StepFunction[] = [
    createValidateVerificationTokenStep("register"),
    createResolveRegistrationSessionStep(),
    hashPasswordStep,
    createCheckEmailUniquenessStep(accountRepo),
    createCreateAccountStep(accountService),
    assignUserRoleStep,
    assignFreeSubscriptionStep,
    markRegistrationSessionUsedStep,
    sendWelcomeEmailStep,
  ];
  return async (input: Record<string, unknown>) => {
    const ctx = await runner.run(steps, { input, portal: PORTAL_CONFIGS.USER });
    await enqueueAuditEvent("REGISTER", ctx.accountId, { email: ctx.email });
    return { accountId: ctx.accountId!, email: ctx.email! };
  };
}
