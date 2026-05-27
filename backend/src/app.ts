import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { appConfig } from './config/app.config.js';
import { authConfig } from './config/auth.config.js';
import { requestId } from './common/middleware/requestId.js';
import { language } from './common/middleware/language.js';
import { requestLogger } from './common/middleware/requestLogger.js';
import { errorHandler } from './common/middleware/errorHandler.js';
import { requireSession } from './common/middleware/requireAuth.js';
import { translate } from './common/utils/translation.js';
import { ErrorCodes } from './common/errors/ErrorCodes.js';
import { sendSuccess } from './common/responses/ApiResponse.js';
import { logger } from './common/utils/logger.js';
import { prisma } from './database/prisma.js';
import { getEmailQueue } from './modules/notification/email.queue.js';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

// Repositories
import { VerificationRepository } from './modules/verification/verification.repository.js';
import { SessionRepository } from './modules/session/session.repository.js';
import { AccountRepository } from './modules/account/account.repository.js';
import { StorageRepository } from './modules/storage/storage.repository.js';
import { ProfileRepository } from './modules/profile/profile.repository.js';

// Services
import { VerificationService } from './modules/verification/verification.service.js';
import { SessionService } from './modules/session/session.service.js';
import { AccountService } from './modules/account/account.service.js';
import { AuthService } from './modules/auth/auth.service.js';
import { AdminAuthService } from './modules/admin-auth/admin-auth.service.js';
import { NotificationService } from './modules/notification/notification.service.js';
import { StorageService } from './modules/storage/storage.service.js';
import { LocalStorageService } from './modules/storage/providers/local-storage.service.js';
import type { IStorageProvider } from './modules/storage/providers/storage-provider.interface.js';
import { UploadService } from './modules/upload/upload.service.js';
import { ProfileService } from './modules/profile/profile.service.js';
import { ImagePipelineService } from './modules/image/image-pipeline.service.js';

// Controllers
import { AuthController } from './modules/auth/auth.controller.js';
import { VerificationController } from './modules/verification/verification.controller.js';
import { AccountController } from './modules/account/account.controller.js';
import { AdminAuthController } from './modules/admin-auth/admin-auth.controller.js';
import { AdminAccountController } from './modules/admin-auth/admin-account.controller.js';
import { UploadController } from './modules/upload/upload.controller.js';
import { ProfileController } from './modules/profile/profile.controller.js';

// Routes
import { createAuthRoutes } from './modules/auth/auth.routes.js';
import { createVerificationRoutes } from './modules/verification/verification.routes.js';
import { createAccountRoutes } from './modules/account/account.routes.js';
import { createAdminAuthRoutes } from './modules/admin-auth/admin-auth.routes.js';
import { createAdminAccountRoutes } from './modules/admin-auth/admin-account.routes.js';
import { createUploadRoutes } from './modules/upload/upload.routes.js';
import { createProfileRoutes } from './modules/profile/profile.routes.js';
import horoscopeRouter from './modules/horoscope/index.js';

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
    crossOriginResourcePolicy: { policy: 'cross-origin' },
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

  // Health check — must be before global rate limiter
  app.get('/health', async (_req, res, next) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      sendSuccess(res, {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: appConfig.nodeEnv,
        database: 'connected',
      });
    } catch {
      res.status(503).json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Database not reachable' },
      });
    }
  });

  // Metrics endpoint (Prometheus format)
  app.get('/metrics', (_req, res) => {
    const mem = process.memoryUsage();
    const now = Date.now();
    res.type('text/plain');
    res.send([
      `# HELP process_up 1 if process is running`,
      `# TYPE process_up gauge`,
      `process_up 1`,
      ``,
      `# HELP process_start_time_seconds Unix timestamp of process start`,
      `# TYPE process_start_time_seconds gauge`,
      `process_start_time_seconds ${Math.floor((now - process.uptime() * 1000) / 1000)}`,
      ``,
      `# HELP process_cpu_seconds_total Total CPU seconds`,
      `# TYPE process_cpu_seconds_total counter`,
      `process_cpu_seconds_total ${process.cpuUsage().user / 1e6}`,
      ``,
      `# HELP process_resident_memory_bytes Resident memory in bytes`,
      `# TYPE process_resident_memory_bytes gauge`,
      `process_resident_memory_bytes ${mem.rss}`,
      ``,
      `# HELP process_heap_bytes Process heap size in bytes`,
      `# TYPE process_heap_bytes gauge`,
      `process_heap_bytes ${mem.heapUsed}`,
      ``,
      `# HELP nodejs_eventloop_lag_seconds Event loop lag in seconds`,
      `# TYPE nodejs_eventloop_lag_seconds gauge`,
      `nodejs_eventloop_lag_seconds 0`,
    ].join('\n'));
  });

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
  app.use(requestLogger);

  // --- DI ---
  const verificationRepo = new VerificationRepository();
  const sessionRepo = new SessionRepository();
  const accountRepo = new AccountRepository();

  const notificationService = new NotificationService();
  const verificationService = new VerificationService(verificationRepo);
  const accountService = new AccountService(accountRepo);
  const sessionService = new SessionService(sessionRepo, accountRepo);

  // AuthModule
  const authService = new AuthService(sessionService, accountRepo, accountService, notificationService);
  const authController = new AuthController(authService);

  // VerificationModule
  const verificationController = new VerificationController(verificationService, notificationService);

  // AccountModule
  const accountController = new AccountController(accountService);

  // AdminAuthModule
  const adminAuthService = new AdminAuthService(accountRepo, sessionService, accountService);
  const adminAuthController = new AdminAuthController(adminAuthService);

  // AdminAccountModule
  const adminAccountController = new AdminAccountController(accountRepo);

  // StorageModule
  const storageRepo = new StorageRepository();
  const localStorageProvider: IStorageProvider = new LocalStorageService();
  const storageService = new StorageService(localStorageProvider, storageRepo);

  // ImagePipelineModule
  const imagePipelineService = new ImagePipelineService();

  // UploadModule
  const uploadService = new UploadService(storageService, imagePipelineService);
  const uploadController = new UploadController(uploadService);

  // ProfileModule
  const profileRepo = new ProfileRepository();
  const profileService = new ProfileService(profileRepo, storageService, accountService);
  const profileController = new ProfileController(profileService);

  // --- Bull Board ---
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');
  createBullBoard({
    queues: [new BullMQAdapter(getEmailQueue())],
    serverAdapter,
  });
  app.use('/admin/queues', serverAdapter.getRouter());

  // Serve uploaded media (local dev)
  app.use('/media', express.static(appConfig.storageDir));

  // --- Routes ---
  app.use('/', createAuthRoutes(authController));
  app.use('/', createVerificationRoutes(verificationController));
  app.use('/', createAccountRoutes(accountController));
  app.use('/admin', createAdminAuthRoutes(adminAuthController));
  app.use('/admin', createAdminAccountRoutes(adminAccountController));
  app.use('/horoscope', horoscopeRouter);
  app.use('/', createUploadRoutes(uploadController));
  app.use('/', createProfileRoutes(profileController));

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
