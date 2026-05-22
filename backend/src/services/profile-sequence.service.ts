import prisma from '../config/prisma';

export class ProfileSequenceService {
  static async generateRegNo(tx?: any): Promise<string> {
    const db = tx || prisma;
    const record = await db.profileSequence.upsert({
      where: { id: 1 },
      update: { nextSeq: { increment: 1 } },
      create: { id: 1, nextSeq: 1001 },
    });
    const seq = record.nextSeq.toString().padStart(4, '0');
    return `MK-${seq}`;
  }
}
