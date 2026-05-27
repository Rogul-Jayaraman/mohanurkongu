import { VerificationRepository } from '../modules/verification/verification.repository.js';
import { logger } from '../common/utils/logger.js';

export async function expireVerifications(): Promise<void> {
  try {
    const repo = new VerificationRepository();
    const count = await repo.expirePending();
    if (count > 0) {
      logger.info({ count }, 'Expired pending verifications');
    }
  } catch (err) {
    logger.error({ err }, 'expire-verifications job failed');
  }
}
