import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';
import { sendError, ErrorCode } from '../utils/errors';

/**
 * Generates a signed upload signature for Cloudinary.
 * This allows the frontend to upload directly while keeping secrets secure.
 * 
 * Target path structure: jadagam/{type}/{id}
 */
export const getCloudinarySignature = async (req: Request, res: Response) => {
  try {
    const { type, folder } = req.query as { type: string, folder?: string };
    const userId = (req as any).user?.userId;

    if (!userId) {
       return sendError(res, ErrorCode.ERR_AUTH_004);
    }

    if (!type) {
      return res.status(400).json({ error: 'Upload type (rasi/navamsa/pdf) is required' });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Deterministic public_id to avoid redundant uploads
    // Format: jadagam/rasi/user123
    const publicId = `jadagam/${type}/${userId}`;
    const targetFolder = folder || process.env.CLOUDINARY_FOLDER || 'Matrimony';

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        public_id: publicId,
        folder: targetFolder,
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    res.json({
      signature,
      timestamp,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      public_id: publicId,
      folder: targetFolder,
    });
  } catch (error) {
    console.error('Cloudinary signature error:', error);
    sendError(res, ErrorCode.ERR_SERVER_001);
  }
};
