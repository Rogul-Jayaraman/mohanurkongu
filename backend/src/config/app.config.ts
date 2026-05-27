import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config();

export const appConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
  storageDir: process.env.STORAGE_DIR || path.join(process.cwd(), '..', 'storage'),
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim()),
  logLevel: process.env.LOG_LEVEL || 'info',
  cookieSecret: process.env.COOKIE_SECRET || 'change-me-cookie-secret-min-32-chars',
  cookieSecure: process.env.COOKIE_SECURE === 'true',

  prefixes: {
    account: process.env.ACCOUNT_NO_PREFIX || 'MKM',
    reg: process.env.REG_NO_PREFIX || 'MK',
  },

  get isDev() {
    return this.nodeEnv === 'development';
  },
  get isProd() {
    return this.nodeEnv === 'production';
  },

  appUrl: process.env.APP_URL || 'http://localhost:5173',
};
