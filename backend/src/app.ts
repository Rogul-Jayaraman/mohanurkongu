import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { appConfig } from './config/app.config.js';
import { authConfig } from './config/auth.config.js';
import { requestId } from './common/middleware/requestId.js';
import { language } from './common/middleware/language.js';
import { requestLogger } from './common/middleware/requestLogger.js';
import { errorHandler } from './common/middleware/errorHandler.js';
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
import { NotificationService } from './modules/notification/notification.service.js';
import { StorageService } from './modules/storage/storage.service.js';
import { LocalStorageService } from './modules/storage/providers/local-storage.service.js';
import type { IStorageProvider } from './modules/storage/providers/storage-provider.interface.js';
import { UploadService } from './modules/upload/upload.service.js';
import { ProfileService } from './modules/profile/profile.service.js';
import { ImagePipelineService } from './modules/image/image-pipeline.service.js';
import { AdminVerificationRepository } from './modules/admin-verification/admin-verification.repository.js';
import { AdminVerificationService } from './modules/admin-verification/admin-verification.service.js';
import { AdminVerificationController } from './modules/admin-verification/admin-verification.controller.js';
import { AdminProfilesRepository } from './modules/admin-profiles/admin-profiles.repository.js';
import { AdminProfilesService } from './modules/admin-profiles/admin-profiles.service.js';
import { AdminProfilesController } from './modules/admin-profiles/admin-profiles.controller.js';
import { AdminDashboardRepository } from './modules/admin-dashboard/admin-dashboard.repository.js';
import { AdminDashboardService } from './modules/admin-dashboard/admin-dashboard.service.js';
import { AdminDashboardController } from './modules/admin-dashboard/admin-dashboard.controller.js';
import { MembershipService } from './modules/membership/membership.service.js';
import { MembershipGuard } from './modules/membership/membership.guard.js';
import { MembershipController } from './modules/membership/membership.controller.js';

  // Controllers
import { AuthController } from './modules/auth/auth.controller.js';
import { VerificationController } from './modules/verification/verification.controller.js';
import { AccountController } from './modules/account/account.controller.js';
import { AdminAuthController } from './modules/admin-auth/admin-auth.controller.js';
import { AdminAccountController } from './modules/admin-auth/admin-account.controller.js';
import { UploadController } from './modules/upload/upload.controller.js';
import { ProfileController } from './modules/profile/profile.controller.js';
import { OtpPipeline } from './common/auth/pipelines/otp.pipeline.js';

// Routes
import { createAuthRoutes } from './modules/auth/auth.routes.js';
import { createVerificationRoutes } from './modules/verification/verification.routes.js';
import { createAccountRoutes } from './modules/account/account.routes.js';
import { createAdminAuthRoutes } from './modules/admin-auth/admin-auth.routes.js';
import { createAdminAccountRoutes } from './modules/admin-auth/admin-account.routes.js';
import { createUploadRoutes } from './modules/upload/upload.routes.js';
import { createProfileRoutes } from './modules/profile/profile.routes.js';
import { createAdminVerificationRoutes } from './modules/admin-verification/admin-verification.routes.js';
import { createAdminProfilesRoutes } from './modules/admin-profiles/admin-profiles.routes.js';
import { createAdminDashboardRoutes } from './modules/admin-dashboard/admin-dashboard.routes.js';
import horoscopeRouter from './modules/horoscope/index.js';
import { createMembershipRoutes } from './modules/membership/membership.routes.js';
import { MandapamService } from './modules/mandapam/mandapam.service.js';
import { MandapamController } from './modules/mandapam/mandapam.controller.js';
import { createMandapamRoutes } from './modules/mandapam/mandapam.routes.js';
import { BookingRepository } from './modules/booking/booking.repository.js';
import { BookingService } from './modules/booking/booking.service.js';
import { BookingController } from './modules/booking/booking.controller.js';
import { createBookingRoutes, createPublicBookingRoutes } from './modules/booking/booking.routes.js';
import { AnalyticsRepository } from './modules/analytics/analytics.repository.js';
import { AnalyticsService } from './modules/analytics/analytics.service.js';
import { AnalyticsController } from './modules/analytics/analytics.controller.js';
import { createAnalyticsRoutes } from './modules/analytics/analytics.routes.js';

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

  // MembershipModule
  const membershipService = new MembershipService();
  const membershipGuard = new MembershipGuard(membershipService);
  const membershipController = new MembershipController(membershipService, membershipGuard);

  // AuthModule — pipeline-based
  const otpPipeline = new OtpPipeline(accountRepo, notificationService);
  const authController = new AuthController(
    sessionService,
    accountRepo,
    accountService,
    membershipService,
    notificationService,
    otpPipeline,
  );

  // AdminAuthModule
  const adminAuthController = new AdminAuthController(authController, accountService);

  // VerificationModule
  const verificationController = new VerificationController(verificationService, notificationService);

  // AccountModule
  const accountController = new AccountController(accountService);

  // StorageModule
  const storageRepo = new StorageRepository();
  const localStorageProvider: IStorageProvider = new LocalStorageService();
  const storageService = new StorageService(localStorageProvider, storageRepo);

  // ImagePipelineModule
  const imagePipelineService = new ImagePipelineService();

  // UploadModule
  const uploadService = new UploadService(storageService, imagePipelineService);
  const uploadController = new UploadController(uploadService);

  // AdminAccountModule
  const adminAccountController = new AdminAccountController(accountRepo, membershipService);

  // ProfileModule
  const profileRepo = new ProfileRepository();
  const profileService = new ProfileService(profileRepo, storageService, accountService, membershipGuard);
  const profileController = new ProfileController(profileService);

  // AdminVerificationModule
  const adminVerificationRepo = new AdminVerificationRepository();
  const adminVerificationService = new AdminVerificationService(adminVerificationRepo, storageService);
  const adminVerificationController = new AdminVerificationController(adminVerificationService);

  // AdminProfilesModule
  const adminProfilesRepo = new AdminProfilesRepository();
  const adminProfilesService = new AdminProfilesService(adminProfilesRepo, storageService);
  const adminProfilesController = new AdminProfilesController(adminProfilesService);

  // AdminDashboardModule
  const adminDashboardRepo = new AdminDashboardRepository();
  const adminDashboardService = new AdminDashboardService(adminDashboardRepo);
  const adminDashboardController = new AdminDashboardController(adminDashboardService);

  // MandapamModule
  const mandapamService = new MandapamService();
  const mandapamController = new MandapamController(mandapamService);

  // BookingModule
  const bookingRepo = new BookingRepository();
  const bookingService = new BookingService(bookingRepo);
  const bookingController = new BookingController(bookingService);

  // AnalyticsModule
  const analyticsRepo = new AnalyticsRepository();
  const analyticsService = new AnalyticsService(analyticsRepo);
  const analyticsController = new AnalyticsController(analyticsService);

  // --- Bull Board ---
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');
  createBullBoard({
    queues: [new BullMQAdapter(getEmailQueue())],
    serverAdapter,
  });
  app.use('/admin/queues', serverAdapter.getRouter());

  // Public media — for showcase/public profile photos
  app.use('/media/public', express.static(appConfig.storageDir, { maxAge: '1y' }));
  // Fallback: generate a simple placeholder image when no file exists on disk
  app.use('/media/public', (req, res) => {
    const svg = `<svg width="400" height="500" viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="500" fill="#F5EFE1"/><circle cx="200" cy="180" r="60" fill="#D4AF37" opacity="0.2"/><rect x="120" y="310" width="160" height="10" rx="5" fill="#D4AF37" opacity="0.3"/><rect x="140" y="330" width="120" height="8" rx="4" fill="#D4AF37" opacity="0.15"/><rect x="100" y="370" width="200" height="1" rx="0.5" fill="#D4AF37" opacity="0.1"/><rect x="120" y="390" width="160" height="6" rx="3" fill="#D4AF37" opacity="0.1"/></svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(svg);
  });

  // Resolve uploadToken (upl_xxx) to objectKey and serve the file
  // No auth on GET — images are public by design. Auth protects upload/delete only.
  app.use('/media/by-token/:uploadToken', async (req, res) => {
    const { uploadToken } = req.params;
    try {
      const upload = await prisma.upload.findUnique({ where: { uploadToken } });
      if (!upload) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Upload not found' } });
      }
      const filePath = path.join(appConfig.storageDir, upload.objectKey);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.sendFile(filePath);
    } catch {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal error' } });
    }
  });

  // Serve uploaded media files (local dev) — no auth on GET.
  // Membership gating is enforced at the API layer (profile/browse endpoints),
  // not at the media serving layer.
  app.use('/media', express.static(appConfig.storageDir, { maxAge: '1y' }));

  // --- Routes ---
  app.use('/', createAuthRoutes(authController));
  app.use('/', createVerificationRoutes(verificationController));
  app.use('/', createAccountRoutes(accountController));
  app.use('/admin', createAdminAuthRoutes(adminAuthController));
  app.use('/admin', createAdminAccountRoutes(adminAccountController));
  app.use('/horoscope', horoscopeRouter);
  app.use('/', createUploadRoutes(uploadController));
  app.use('/', createProfileRoutes(profileController));
  app.use('/admin', createAdminVerificationRoutes(adminVerificationController));
  app.use('/admin', createAdminProfilesRoutes(adminProfilesController));
  app.use('/admin', createAdminDashboardRoutes(adminDashboardController));
  app.use('/', createMembershipRoutes(membershipController));
  app.use('/', createMandapamRoutes(mandapamController));
  app.use('/', createBookingRoutes(bookingController));
  app.use('/', createPublicBookingRoutes(bookingController));
  app.use('/admin', createAnalyticsRoutes(analyticsController));

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
