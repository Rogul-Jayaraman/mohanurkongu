import prisma from '../config/prisma';

export class HoroscopeSnapshotService {
  static async createSnapshot(
    tx: any,
    profileId: string,
    requestJson: any,
    responseJson: any,
    inputHash: string,
  ) {
    const latest = await tx.horoscopeSnapshot.findFirst({
      where: { profileId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const version = (latest?.version ?? 0) + 1;

    await tx.horoscopeSnapshot.updateMany({
      where: { profileId, supersededAt: null },
      data: { supersededAt: new Date() },
    });

    const summary = {
      rasiSignIndex: responseJson.summary?.rasiSignIndex ?? null,
      lagnaSignIndex: responseJson.summary?.lagnaSignIndex ?? null,
      nakshatraIndex: responseJson.summary?.nakshatraIndex ?? null,
      nakshatraPada: responseJson.summary?.nakshatraPada ?? null,
    };

    return tx.horoscopeSnapshot.create({
      data: {
        profileId,
        version,
        requestJson,
        responseJson,
        summaryJson: summary,
        inputHash,
        generatorVersion: '1.0',
      },
    });
  }

  static async getLatestForProfile(profileId: string) {
    return prisma.horoscopeSnapshot.findFirst({
      where: { profileId, supersededAt: null },
      orderBy: { version: 'desc' },
    });
  }

  static async findExistingByHash(tx: any, inputHash: string) {
    return tx.horoscopeSnapshot.findFirst({
      where: { inputHash, supersededAt: null },
      orderBy: { version: 'desc' },
    });
  }
}
