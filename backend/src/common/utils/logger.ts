import pino from 'pino';
import { appConfig } from '../../config/app.config.js';

export const logger = pino({
  level: appConfig.logLevel,
  ...(appConfig.isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      }
    : {}),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.body.password',
      'req.body.currentPassword',
      'req.body.newPassword',
      'req.body.otp',
      'req.body.token',
      'req.body.refreshToken',
      'req.body.accessToken',
    ],
    censor: '[REDACTED]',
  },
});
