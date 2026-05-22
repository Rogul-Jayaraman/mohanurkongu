import { Request, Response } from 'express';
import prisma from '../config/prisma';
import * as authService from '../services/auth';
import { ErrorCode, sendError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { changePasswordSchema } from '../utils/validators/settings';

/**
 * changePassword: Authenticated account password update.
 * Checks current password before allowing rotation to a new one.
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    // 1. Validate Input
    const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);

    const userId = (req as any).user?.userId;
    const role = (req as any).user?.role;

    if (!userId) {
      return sendError(res, ErrorCode.ERR_AUTH_003, 'Identity lost. Please re-authenticate.');
    }

    // 2. Fetch Account (User or Admin)
    let account;
    if (role === 'ADMIN') {
      account = await authService.findAdminByEmail((req as any).user.email);
    } else {
      account = await prisma.user.findUnique({ where: { id: userId } });
    }

    if (!account) {
      return sendError(res, ErrorCode.ERR_AUTH_003, 'Account not found.');
    }

    // 3. Verify Old Password
    const isValid = await authService.verifyPassword(oldPassword, account.password);
    if (!isValid) {
      return sendError(res, ErrorCode.ERR_AUTH_002, 'The current password provided is incorrect.');
    }

    // 4. Mutation: Hash and Update
    const hashedPassword = await authService.hashPassword(newPassword);
    
    if (role === 'ADMIN') {
      await authService.updateAdminPassword(account.id, hashedPassword);
    } else {
      await authService.updateUserPassword(userId, hashedPassword);
    }

    return sendSuccess(res, { message: 'Security credentials updated successfully.' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return sendError(res, ErrorCode.ERR_VALIDATION_001, 'Invalid security key format.', error.errors);
    }
    console.error('Change Password Error:', error);
    return sendError(res, ErrorCode.ERR_SERVER_001, 'An internal failure occurred during encryption rotation.');
  }
};
