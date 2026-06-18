import { AppError } from "../../errors/AppError.js";
import { ErrorCodes } from "../../errors/ErrorCodes.js";
import { generateOTP, hashOTP } from "../../utils/otp.js";
import { signVerificationToken, signResetToken } from "../../utils/jwt.js";
import { enqueueAuditEvent } from "../../utils/audit.js";
import { prisma } from "../../../database/prisma.js";
import { authConfig } from "../../../config/auth.config.js";
import type { AccountRepository } from "../../../modules/account/account.repository.js";
import type { NotificationService } from "../../../modules/notification/notification.service.js";
type OtpPurpose = "REGISTER" | "RESET_PASSWORD";
export class OtpPipeline {
  constructor(
    private accountRepo: AccountRepository,
    private notificationService: NotificationService,
  ) {}
  async send(input: { email: string }, purpose: OtpPurpose) {
    const email = input.email.toLowerCase();
    if (purpose === "RESET_PASSWORD") {
      const credential = await this.accountRepo.findCredentialByEmail(email);
      if (!credential) {
        throw new AppError(
          400,
          ErrorCodes.AUTH_RESET_SESSION_INVALID,
          "AUTH_RESET_SESSION_INVALID",
        );
      }
    }
    const recent = await prisma.accountVerification.findFirst({
      where: {
        target: email,
        purpose,
        state: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });
    if (recent) {
      const cooldownSeconds = authConfig.otp.cooldownSeconds;
      const ageMs = Date.now() - recent.createdAt.getTime();
      if (ageMs < cooldownSeconds * 1000) {
        throw new AppError(
          429,
          ErrorCodes.AUTH_OTP_COOLDOWN,
          "AUTH_OTP_COOLDOWN",
        );
      }
    }
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiryMs = authConfig.otp.expiryMinutes * 60 * 1000;
    const expiresAt = new Date(Date.now() + expiryMs);
    await prisma.accountVerification.create({
      data: {
        type: "EMAIL",
        target: email,
        purpose,
        otpHash,
        state: "PENDING",
        expiresAt,
        attempts: 0,
        maxAttempts: authConfig.otp.maxAttempts,
      },
    });
    await enqueueAuditEvent("OTP_SENT", undefined, { email, purpose });
    if (purpose === "REGISTER") {
      await this.notificationService.sendRegistrationOtpEmail(email, otp);
    } else {
      await this.notificationService.sendPasswordResetOtpEmail(email, otp);
    }
    return null;
  }
  async verify(input: { email: string; otp: string }, purpose: OtpPurpose) {
    const email = input.email.toLowerCase();
    const verification = await prisma.accountVerification.findFirst({
      where: {
        target: email,
        purpose,
        state: "PENDING",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!verification) {
      throw new AppError(410, ErrorCodes.AUTH_OTP_EXPIRED, "AUTH_OTP_EXPIRED");
    }
    if (verification.attempts >= verification.maxAttempts) {
      await prisma.accountVerification.update({
        where: { id: verification.id },
        data: { state: "EXPIRED" },
      });
      throw new AppError(
        429,
        ErrorCodes.AUTH_OTP_MAX_ATTEMPTS,
        "AUTH_OTP_MAX_ATTEMPTS",
      );
    }
    await prisma.accountVerification.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });
    const inputHash = hashOTP(input.otp);
    if (inputHash !== verification.otpHash) {
      throw new AppError(400, ErrorCodes.AUTH_OTP_INVALID, "AUTH_OTP_INVALID");
    }
    await prisma.accountVerification.update({
      where: { id: verification.id },
      data: { state: "VERIFIED" },
    });
    if (purpose === "REGISTER") {
      const verificationToken = signVerificationToken({
        sub: verification.id,
        purpose: "register",
      });
      await prisma.registrationSession.create({
        data: {
          verificationId: verification.id,
          snapshotTarget: email,
          expiresAt: new Date(Date.now() + 300000),
        },
      });
      await enqueueAuditEvent("OTP_VERIFIED", undefined, { email, purpose });
      return { verificationToken };
    } else {
      const resetToken = signResetToken({
        sub: verification.id,
        purpose: "reset_password",
      });
      await prisma.resetSession.create({
        data: {
          verificationId: verification.id,
          snapshotTarget: email,
          expiresAt: new Date(Date.now() + 300000),
        },
      });
      await enqueueAuditEvent("OTP_VERIFIED", undefined, { email, purpose });
      return { resetToken };
    }
  }
}
