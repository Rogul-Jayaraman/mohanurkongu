import { VerificationRepository } from '../modules/verification/verification.repository.js';
import { authConfig } from '../config/auth.config.js';
import { logger } from '../common/utils/logger.js';

export async function purgeVerifications(): Promise<void> {
  const repo = new VerificationRepository();
  const count = await repo.purgeArchived(authConfig.jobs.purgeAfterDays);
  if (count > 0) {
    logger.info({ count, thresholdDays: authConfig.jobs.purgeAfterDays }, 'Purged archived verifications');
  }
}

