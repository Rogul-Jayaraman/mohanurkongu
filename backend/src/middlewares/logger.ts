import { Request, Response, NextFunction } from 'express';

/**
 * ANSI Color Codes for Terminal Styling
 * Used to make logs more readable and highlight transaction boundaries.
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
};

/**
 * Recursively masks sensitive fields in an object.
 * 
 * What it does:
 * - Scans through request/response objects and replaces sensitive data with asterisks.
 * - Handles nested objects and arrays.
 * 
 * Why it exists:
 * - To prevent PII (Personally Identifiable Information) and credentials from being logged in plain text.
 * 
 * Edge cases:
 * - Handles null/undefined data safely.
 * - Leaves Date objects as they are.
 * - Masks fields like 'password', 'token', etc.
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
            masked[key] = '********';
        } else if (typeof masked[key] === 'object') {
            masked[key] = maskSensitiveData(masked[key]);
        }
    }
    return masked;
};

/**
 * Express Middleware for logging detailed request/response transactions.
 * 
 * What it does:
 * - Intercepts the request at the start of its lifecycle.
 * - Wraps the res.json method to capture the outgoing response data.
 * - Logs request parameters, query, body, status code, duration, and response data in a formatted box.
 * 
 * Why it exists:
 * - Provides visibility into the data flow between client and server during development.
 * - Helps in debugging by showing exactly what was received and what was sent back.
 * 
 * Edge cases:
 * - Correctly calculates duration using start time.
 * - Masks sensitive data in both request and response bodies.
 * - Handles empty or missing params/query/body correctly.
 */
export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const { method, url, body, query } = req;
    
    // Intercept res.json to log everything together for a complete picture
    const originalJson = res.json;
    res.json = function(data: any) {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const statusColor = status >= 400 ? COLORS.red : (status >= 300 ? COLORS.yellow : COLORS.green);
        
        // --- LOG BLOCK START ---
        console.log(`\n${COLORS.cyan}╔══════════════════ [ TRANSACTION LOG ] ══════════════════╗${COLORS.reset}`);
        
        // 1. INCOMING REQUEST
        console.log(`${COLORS.cyan}║${COLORS.reset} ${COLORS.bright}${method}${COLORS.reset} ${url}`);
        
        // Log Params (now available after route matching)
        if (req.params && Object.keys(req.params).length > 0) {
            console.log(`${COLORS.cyan}║${COLORS.reset} ${COLORS.yellow}Params:${COLORS.reset}`, JSON.stringify(req.params, null, 2).replace(/\n/g, `\n${COLORS.cyan}║${COLORS.reset}   `));
        }
        
        // Log Query
        if (query && Object.keys(query).length > 0) {
            console.log(`${COLORS.cyan}║${COLORS.reset} ${COLORS.magenta}Query:${COLORS.reset} `, JSON.stringify(query, null, 2).replace(/\n/g, `\n${COLORS.cyan}║${COLORS.reset}   `));
        }
        
        // Log Body (POST/PUT/PATCH)
        if (body && Object.keys(body).length > 0) {
            const maskedBody = maskSensitiveData(body);
            console.log(`${COLORS.cyan}║${COLORS.reset} ${COLORS.blue}Body:${COLORS.reset}  `, JSON.stringify(maskedBody, null, 2).replace(/\n/g, `\n${COLORS.cyan}║${COLORS.reset}   `));
        }

        console.log(`${COLORS.cyan}╠══════════════════ [ OUTGOING RESPONSE ] ══════════════════╣${COLORS.reset}`);
        
        // 2. OUTGOING RESPONSE
        console.log(`${COLORS.cyan}║${COLORS.reset} Status:   ${statusColor}${status}${COLORS.reset}`);
        console.log(`${COLORS.cyan}║${COLORS.reset} Duration: ${COLORS.dim}${duration}ms${COLORS.reset}`);
        
        if (data) {
            const maskedResponse = maskSensitiveData(data);
            // Limit large response logs for readability if necessary, but here we log it all
            console.log(`${COLORS.cyan}║${COLORS.reset} Data:     `, JSON.stringify(maskedResponse, null, 2).replace(/\n/g, `\n${COLORS.cyan}║${COLORS.reset}   `));
        }
        
        console.log(`${COLORS.cyan}╚══════════════════════════════════════════════════════════╝${COLORS.reset}\n`);
        
        return originalJson.call(this, data);
    };

    next();
};
