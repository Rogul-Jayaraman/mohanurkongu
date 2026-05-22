import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ErrorCode, sendError } from '../utils/errors';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

/**
 * Middleware to authenticate requests via JWT token.
 * Validates the Bearer token in the Authorization header and attaches the user payload to the request object.
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, ErrorCode.ERR_AUTH_008);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret') as { userId: string, role: string };
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return sendError(res, ErrorCode.ERR_AUTH_008);
  }
};

export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return sendError(res, ErrorCode.ERR_AUTH_007);
  }
};

/**
 * Optional authentication middleware.
 * If token is provided and valid, req.user will be populated, else it ignores.
 */
export const optionalAuthenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret') as { userId: string, role: string };
      req.user = decoded;
    } catch (e) {
      // Do nothing, let req.user be undefined
    }
  }
  next();
};
