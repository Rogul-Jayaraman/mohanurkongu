import { VerificationRepository } from '../modules/verification/verification.repository.js';
import { authConfig } from '../config/auth.config.js';
import { logger } from '../common/utils/logger.js';

export async function archiveVerifications(): Promise<void> {
  const repo = new VerificationRepository();
  const count = await repo.archiveOld(authConfig.jobs.archiveAfterDays);
  if (count > 0) {
    logger.info({ count, thresholdDays: authConfig.jobs.archiveAfterDays }, 'Archived old verifications');
  }
}
