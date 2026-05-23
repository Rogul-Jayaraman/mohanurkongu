import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { appConfig } from './config/app.config.js';
import { authConfig } from './config/auth.config.js';
import { requestId } from './common/middleware/requestId.js';
import { language } from './common/middleware/language.js';
import { errorHandler } from './common/middleware/errorHandler.js';
import { translate } from './common/utils/translation.js';
import { ErrorCodes } from './common/errors/ErrorCodes.js';
import { sendSuccess } from './common/responses/ApiResponse.js';
import { logger } from './common/utils/logger.js';

import { VerificationRepository } from './modules/verification/verification.repository.js';
import { SessionRepository } from './modules/session/session.repository.js';
import { AccountRepository } from './modules/account/account.repository.js';
import { VerificationService } from './modules/verification/verification.service.js';
import { SessionService } from './modules/session/session.service.js';
import { AccountService } from './modules/account/account.service.js';
import { AuthService } from './modules/auth/auth.service.js';
import { AuthController } from './modules/auth/auth.controller.js';
import { createAuthRoutes } from './modules/auth/auth.routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  app.use(cors({
    origin: appConfig.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'Accept-Language'],
  }));

  app.use(cookieParser(appConfig.cookieSecret));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  const globalLimiter = rateLimit({
    windowMs: authConfig.rateLimit.windowMs,
    max: authConfig.rateLimit.globalMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: ErrorCodes.RATE_LIMIT_EXCEEDED, message: 'Too many requests' },
    },
  });
  app.use(globalLimiter);

  app.use((req, res, next) => {
    res.setTimeout(30000, () => {
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          error: { code: 'REQUEST_TIMEOUT', message: 'Request timed out' },
        });
      }
    });
    next();
  });

  app.use(requestId);
  app.use(language);

  // Health check
  app.get('/health', (_req, res) => {
    sendSuccess(res, {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: appConfig.nodeEnv,
    });
  });

  // DI
  const verificationRepo = new VerificationRepository();
  const sessionRepo = new SessionRepository();
  const accountRepo = new AccountRepository();

  const verificationService = new VerificationService(verificationRepo);
  const accountService = new AccountService(accountRepo);
  const sessionService = new SessionService(sessionRepo, accountRepo);
  const authService = new AuthService(verificationService, sessionService, accountRepo, accountService);
  const authController = new AuthController(authService);

  // Routes
  const authRoutes = createAuthRoutes(authController);
  app.use(authRoutes);

  // 404
  app.use((_req, res) => {
    const lang = res.locals?.lang || 'en';
    res.status(404).json({
      success: false,
      error: {
        code: ErrorCodes.NOT_FOUND,
        message: translate(ErrorCodes.NOT_FOUND, lang),
      },
    });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}
