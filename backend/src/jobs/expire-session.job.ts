import { SessionRepository } from '../modules/session/session.repository.js';
import { logger } from '../common/utils/logger.js';

export async function runSessionExpiry(): Promise<void> {
  const repo = new SessionRepository();
  const count = await repo.expireSessions();
  if (count > 0) {
    logger.info({ count }, 'Expired stale sessions');
  }
}
