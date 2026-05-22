import { nanoid } from 'nanoid';
import prisma from '../config/prisma';

export class DraftService {
  static async createDraft(userId: string, data: any) {
    const draftId = `DRF-${nanoid(7)}`;
    const draft = await prisma.profileDraft.create({
      data: {
        draftId,
        userId,
        currentStep: data.currentStep ?? 0,
        draftDataJson: data.draftData ?? {},
        birthDataJson: data.birthData ?? null,
        horoscopeJson: data.horoscopeJson ?? null,
        horoscopeGenerated: !!data.horoscopeJson,
        inputHash: data.inputHash ?? null,
        lastSavedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    });
    return { draftId: draft.draftId, currentStep: draft.currentStep, savedAt: draft.lastSavedAt };
  }

  static async updateDraft(draftId: string, userId: string, data: any) {
    const existing = await prisma.profileDraft.findUnique({ where: { draftId } });
    if (!existing) throw new AppError('Draft not found', 404);
    if (existing.userId !== userId) throw new AppError('Unauthorized', 403);
    if (existing.status !== 'DRAFT') throw new AppError('Draft is not editable', 409);

    const updateData: any = { lastSavedAt: new Date() };
    if (data.currentStep !== undefined) updateData.currentStep = data.currentStep;
    if (data.draftData !== undefined) updateData.draftDataJson = data.draftData;
    if (data.birthData !== undefined) updateData.birthDataJson = data.birthData;
    if (data.horoscopeJson !== undefined) {
      updateData.horoscopeJson = data.horoscopeJson;
      updateData.horoscopeGenerated = true;
      updateData.horoscopeGeneratedAt = new Date();
    }
    if (data.inputHash !== undefined) updateData.inputHash = data.inputHash;

    await prisma.profileDraft.update({ where: { draftId }, data: updateData });
    return { draftId, currentStep: data.currentStep ?? existing.currentStep, savedAt: updateData.lastSavedAt };
  }

  static async getDraft(draftId: string, userId: string) {
    const draft = await prisma.profileDraft.findUnique({ where: { draftId } });
    if (!draft) return null;
    if (draft.userId !== userId) throw new AppError('Unauthorized', 403);
    if (draft.status === 'PUBLISHED') throw new AppError('Draft already published', 409);
    if (draft.status === 'EXPIRED') throw new AppError('Draft expired', 410);
    return {
      draftId: draft.draftId,
      currentStep: draft.currentStep,
      status: draft.status,
      draftData: draft.draftDataJson,
      birthData: draft.birthDataJson,
      horoscope: draft.horoscopeJson,
      horoscopeGenerated: draft.horoscopeGenerated,
      inputHash: draft.inputHash,
      lastSavedAt: draft.lastSavedAt,
      createdAt: draft.createdAt,
    };
  }

  static async cancelDraft(draftId: string, userId: string) {
    const existing = await prisma.profileDraft.findUnique({ where: { draftId } });
    if (!existing) throw new AppError('Draft not found', 404);
    if (existing.userId !== userId) throw new AppError('Unauthorized', 403);
    if (existing.status === 'PUBLISHED') throw new AppError('Cannot cancel a published profile', 409);
    await prisma.profileDraft.update({ where: { draftId }, data: { status: 'CANCELLED' } });
    return { cancelled: true, draftId };
  }

  static async cleanupExpired() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result1 = await prisma.profileDraft.deleteMany({
      where: { status: { in: ['CANCELLED', 'EXPIRED'] }, updatedAt: { lt: thirtyDaysAgo } },
    });
    const result2 = await prisma.profileDraft.deleteMany({
      where: { status: 'DRAFT', currentStep: { lte: 1 }, updatedAt: { lt: sevenDaysAgo } },
    });
    return { deleted: result1.count + result2.count };
  }
}

class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}
