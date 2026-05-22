import { Response } from 'express';

/**
 * Standardized Error Code System
 * All API errors return both a human-readable message and a machine-readable code
 */

export enum ErrorCode {
  // Auth Errors
  ERR_AUTH_001 = 'ERR_AUTH_001', // User already exists
  ERR_AUTH_002 = 'ERR_AUTH_002', // Invalid credentials
  ERR_AUTH_003 = 'ERR_AUTH_003', // User not found
  ERR_AUTH_004 = 'ERR_AUTH_004', // Invalid or expired OTP
  ERR_AUTH_005 = 'ERR_AUTH_005', // Email delivery failed
  ERR_AUTH_006 = 'ERR_AUTH_006', // Incomplete registration
  ERR_AUTH_007 = 'ERR_AUTH_007', // Forbidden access
  ERR_AUTH_008 = 'ERR_AUTH_008', // Unauthenticated (Missing/Invalid Token)
  ERR_AUTH_009 = 'ERR_AUTH_009', // SMS delivery failed

  // Validation Errors
  ERR_VALIDATION_001 = 'ERR_VALIDATION_001', // Invalid request body

  // Server Errors
  ERR_SERVER_001 = 'ERR_SERVER_001', // Internal server error

  // Profile Errors
  ERR_PROFILE_001 = 'ERR_PROFILE_001', // Profile not found
  ERR_PROFILE_002 = 'ERR_PROFILE_002', // Unauthorized access to profile
  ERR_PROFILE_003 = 'ERR_PROFILE_003', // Profile update failed
  ERR_PROFILE_004 = 'ERR_PROFILE_004', // Profile creation failed
}

export interface ApiError {
  message: string;
  code: ErrorCode;
  statusCode: number;
}

/**
 * Error Code Descriptions for documentation
 */
const errorDescriptions: Record<ErrorCode, { message: string; statusCode: number }> = {
  [ErrorCode.ERR_AUTH_001]: {
    message: 'User with this email or phone already exists',
    statusCode: 400,
  },
  [ErrorCode.ERR_AUTH_002]: {
    message: 'Invalid email or password',
    statusCode: 401,
  },
  [ErrorCode.ERR_AUTH_003]: {
    message: 'User not found',
    statusCode: 404,
  },
  [ErrorCode.ERR_AUTH_004]: {
    message: 'Invalid or expired verification code',
    statusCode: 400,
  },
  [ErrorCode.ERR_AUTH_005]: {
    message: 'Email delivery failed. Please try again later.',
    statusCode: 500,
  },
  [ErrorCode.ERR_AUTH_006]: {
    message: 'Account registration is incomplete. Please finish signing up first.',
    statusCode: 400,
  },
  [ErrorCode.ERR_VALIDATION_001]: {
    message: 'Invalid request body',
    statusCode: 400,
  },
  [ErrorCode.ERR_SERVER_001]: {
    message: 'Internal server error',
    statusCode: 500,
  },
  [ErrorCode.ERR_PROFILE_001]: {
    message: 'Profile not found',
    statusCode: 404,
  },
  [ErrorCode.ERR_PROFILE_002]: {
    message: 'You are not authorized to access or modify this profile',
    statusCode: 403,
  },
  [ErrorCode.ERR_PROFILE_003]: {
    message: 'Failed to update profile details',
    statusCode: 400,
  },
  [ErrorCode.ERR_PROFILE_004]: {
    message: 'Failed to create new profile',
    statusCode: 400,
  },
  [ErrorCode.ERR_AUTH_007]: {
    message: 'Forbidden: You do not have permission to access this resource.',
    statusCode: 403,
  },
  [ErrorCode.ERR_AUTH_008]: {
    message: 'Unauthorized: Please login to continue.',
    statusCode: 401,
  },
  [ErrorCode.ERR_AUTH_009]: {
    message: 'Failed to send SMS. Please try again.',
    statusCode: 500,
  },
};

/**
 * Create a standardized API error response
 * @param code - ErrorCode enum
 * @returns { message, code, statusCode }
 */
export function createError(code: ErrorCode): ApiError {
  const errorInfo = errorDescriptions[code];
  if (!errorInfo) {
    return {
      message: 'Unknown error',
      code: ErrorCode.ERR_SERVER_001,
      statusCode: 500,
    };
  }

  return {
    message: errorInfo.message,
    code,
    statusCode: errorInfo.statusCode,
  };
}

/**
 * Helper to send error response
 * Usage: res.status(error.statusCode).json(error);
 */
export function sendError(res: Response, code: ErrorCode, customMessage?: string, fieldErrors?: Record<string, string>): void {
  const error = createError(code);
  res.status(error.statusCode).json({
    success: false,
    data: null,
    meta: null,
    error: {
      code: error.code,
      message: customMessage || error.message,
      fieldErrors
    }
  });
}
