import type { PipelineContext } from '../types.js';
import { hashPassword } from '../../utils/crypto.js';

export async function hashPasswordStep(ctx: PipelineContext): Promise<PipelineContext> {
  const password = ctx.input.password as string;
  if (!password) {
    throw new Error('Missing password in context input');
  }

  ctx.passwordHash = await hashPassword(password);
  return ctx;
}
