import { Request, Response, NextFunction } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * ANSI Color Codes for Terminal Styling
 */
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

/**
 * Masks sensitive fields in request/response data
 */
const maskSensitiveData = (data: any): any => {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(item => maskSensitiveData(item));
  if (typeof data !== 'object') return data;
  if (data instanceof Date) return data;

  const masked: any = { ...data };
  const sensitiveFields = ['password', 'token', 'confirmPassword', 'access_token', 'otp', 'refreshToken'];
  
  for (const key in masked) {
    if (sensitiveFields.includes(key)) {
      masked[key] = '••••••••';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }
  return masked;
};

export const structuredLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const originalJson = res.json;

  res.json = function (body: unknown) {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusColor = status >= 400 ? COLORS.red : status >= 300 ? COLORS.yellow : COLORS.green;

    const logEntry = {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: status,
      durationMs: duration,
      response: body,
    };

    if (isProduction) {
      console.log(JSON.stringify(logEntry));
    } else {
      // ─────────────────────────────────────────────────────────────
      // INCOMING REQUEST
      // ─────────────────────────────────────────────────────────────
      console.log(
        `\n${COLORS.cyan}┌─────────────────────────────────────────────────────────────┐${COLORS.reset}`
      );
      console.log(
        `${COLORS.cyan}│${COLORS.reset} ${COLORS.bright}${COLORS.blue}INCOMING REQUEST${COLORS.reset} ${COLORS.gray}[${req.requestId}]${COLORS.reset}`
      );
      console.log(
        `${COLORS.cyan}├─────────────────────────────────────────────────────────────┤${COLORS.reset}`
      );

      // Method & Path
      console.log(
        `${COLORS.cyan}│${COLORS.reset} ${COLORS.bright}${req.method}${COLORS.reset} ${COLORS.magenta}${req.path}${COLORS.reset}`
      );

      // Params
      if (req.params && Object.keys(req.params).length > 0) {
        const params = JSON.stringify(req.params, null, 2)
          .split('\n')
          .map((line, i) => (i === 0 ? line : `  ${line}`))
          .join('\n');
        console.log(`${COLORS.cyan}│${COLORS.reset} ${COLORS.yellow}Params:${COLORS.reset} ${params.replace(/\n/g, `\n${COLORS.cyan}│${COLORS.reset} `)}`);
      }

      // Query
      if (req.query && Object.keys(req.query).length > 0) {
        const query = JSON.stringify(req.query, null, 2)
          .split('\n')
          .map((line, i) => (i === 0 ? line : `  ${line}`))
          .join('\n');
        console.log(`${COLORS.cyan}│${COLORS.reset} ${COLORS.magenta}Query:${COLORS.reset}  ${query.replace(/\n/g, `\n${COLORS.cyan}│${COLORS.reset} `)}`);
      }

      // Body
      if (req.body && Object.keys(req.body).length > 0) {
        const maskedBody = maskSensitiveData(req.body);
        const body = JSON.stringify(maskedBody, null, 2)
          .split('\n')
          .map((line, i) => (i === 0 ? line : `  ${line}`))
          .join('\n');
        console.log(`${COLORS.cyan}│${COLORS.reset} ${COLORS.blue}Body:${COLORS.reset}   ${body.replace(/\n/g, `\n${COLORS.cyan}│${COLORS.reset} `)}`);
      }

      // ─────────────────────────────────────────────────────────────
      // OUTGOING RESPONSE
      // ─────────────────────────────────────────────────────────────
      console.log(
        `${COLORS.cyan}├─────────────────────────────────────────────────────────────┤${COLORS.reset}`
      );
      console.log(
        `${COLORS.cyan}│${COLORS.reset} ${COLORS.bright}${COLORS.green}OUTGOING RESPONSE${COLORS.reset}`
      );
      console.log(
        `${COLORS.cyan}├─────────────────────────────────────────────────────────────┤${COLORS.reset}`
      );

      // Status
      console.log(
        `${COLORS.cyan}│${COLORS.reset} Status:   ${statusColor}${COLORS.bright}${status}${COLORS.reset}`
      );

      // Duration
      const durationColor = duration > 1000 ? COLORS.yellow : duration > 500 ? COLORS.dim : COLORS.green;
      console.log(
        `${COLORS.cyan}│${COLORS.reset} Duration: ${durationColor}${duration}ms${COLORS.reset}`
      );

      // Response Data
      if (body) {
        const maskedResponse = maskSensitiveData(body);
        const response = JSON.stringify(maskedResponse, null, 2)
          .split('\n')
          .map((line, i) => (i === 0 ? line : `  ${line}`))
          .join('\n');
        console.log(
          `${COLORS.cyan}│${COLORS.reset} Data:     ${response.replace(/\n/g, `\n${COLORS.cyan}│${COLORS.reset} `)}`
        );
      }

      console.log(
        `${COLORS.cyan}└─────────────────────────────────────────────────────────────┘${COLORS.reset}\n`
      );
    }

    return originalJson.call(this, body);
  };

  next();
};
