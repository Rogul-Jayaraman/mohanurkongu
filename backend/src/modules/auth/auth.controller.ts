import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../common/responses/ApiResponse.js";
import { getDeviceInfo } from "../../common/utils/device.js";
import { ErrorCodes } from "../../common/errors/ErrorCodes.js";
import { AppError } from "../../common/errors/AppError.js";
import { clearRefreshCookie } from "../../common/utils/cookie.js";
import { PORTAL_CONFIGS } from "../../common/auth/types.js";
import type { SessionService } from "../session/session.service.js";
import type { AccountRepository } from "../account/account.repository.js";
import type { AccountService } from "../account/account.service.js";
import type { MembershipService } from "../membership/membership.service.js";
import type { NotificationService } from "../notification/notification.service.js";
import { OtpPipeline } from "../../common/auth/pipelines/otp.pipeline.js";
import { createLoginPipeline } from "../../common/auth/pipelines/login.pipeline.js";
import { createRegisterPipeline } from "../../common/auth/pipelines/register.pipeline.js";
import { createRefreshPipeline } from "../../common/auth/pipelines/refresh.pipeline.js";
import { createResetPasswordPipeline } from "../../common/auth/pipelines/reset-password.pipeline.js";
import { createChangePasswordPipeline } from "../../common/auth/pipelines/change-password.pipeline.js";

export class AuthController {
  private loginPipeline;
  private adminLoginPipeline;
  private registerPipeline;
  private refreshPipeline;
  private adminRefreshPipeline;
  private resetPasswordPipeline;
  private changePasswordPipeline;

  constructor(
    private sessionService: SessionService,
    private accountRepo: AccountRepository,
    private accountService: AccountService,
    private membershipService: MembershipService,
    private notificationService: NotificationService,
    public otpPipeline: OtpPipeline,
  ) {
    this.loginPipeline = createLoginPipeline(
      accountRepo,
      sessionService,
      membershipService,
      PORTAL_CONFIGS.USER,
    );
    this.adminLoginPipeline = createLoginPipeline(
      accountRepo,
      sessionService,
      membershipService,
      PORTAL_CONFIGS.ADMIN,
    );
    this.registerPipeline = createRegisterPipeline(
      accountRepo,
      accountService,
      notificationService,
    );
    this.refreshPipeline = createRefreshPipeline(
      sessionService,
      membershipService,
      PORTAL_CONFIGS.USER,
    );
    this.adminRefreshPipeline = createRefreshPipeline(
      sessionService,
      membershipService,
      PORTAL_CONFIGS.ADMIN,
    );
    this.resetPasswordPipeline = createResetPasswordPipeline();
    this.changePasswordPipeline = createChangePasswordPipeline();
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.registerPipeline(req.body);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const device = getDeviceInfo(req);
      const result = await this.loginPipeline({
        input: req.body,
        device,
        res,
      });
      sendSuccess(res, {
        accessToken: result.accessToken,
        sessionId: result.sessionId,
      });
    } catch (err) {
      next(err);
    }
  };

  adminLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const device = getDeviceInfo(req);
      const result = await this.adminLoginPipeline({
        input: req.body,
        device,
        res,
      });
      sendSuccess(res, {
        accessToken: result.accessToken,
        accountId: result.accountId,
        role: "ADMIN",
        sessionId: result.sessionId,
      });
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        throw new AppError(
          401,
          ErrorCodes.AUTH_TOKEN_INVALID,
          "AUTH_TOKEN_INVALID",
        );
      }

      const device = getDeviceInfo(req);
      const result = await this.refreshPipeline({
        input: { refreshToken },
        device,
        res,
      });
      sendSuccess(res, { accessToken: result.accessToken });
    } catch (err) {
      next(err);
    }
  };

  adminRefresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        throw new AppError(
          401,
          ErrorCodes.AUTH_TOKEN_INVALID,
          "AUTH_TOKEN_INVALID",
        );
      }

      const device = getDeviceInfo(req);
      const result = await this.adminRefreshPipeline({
        input: { refreshToken },
        device,
        res,
      });
      sendSuccess(res, { accessToken: result.accessToken });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) {
        await this.sessionService.revokeSession(refreshToken, "LOGOUT");
      }
      clearRefreshCookie(res, "/auth");
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  };

  adminLogout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) {
        await this.sessionService.revokeSession(refreshToken, "ADMIN_LOGOUT");
      }
      clearRefreshCookie(res, "/admin/auth");
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  };

  logoutAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.sessionService.revokeAll(req.account.sub);
      clearRefreshCookie(res, "/auth");
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.resetPasswordPipeline(req.body);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : "";
      const result = await this.changePasswordPipeline({
        ...req.body,
        accessToken: token,
      });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  sendRegistrationOtp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await this.otpPipeline.send(req.body, "REGISTER");
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  };

  verifyRegistrationOtp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const result = await this.otpPipeline.verify(req.body, "REGISTER");
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  sendPasswordResetOtp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await this.otpPipeline.send(req.body, "RESET_PASSWORD");
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  };

  verifyPasswordResetOtp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const result = await this.otpPipeline.verify(req.body, "RESET_PASSWORD");
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };
}
