import { prisma } from '../../database/prisma.js';

export class AdminProfilesRepository {
  async findAll(params: { page: number; limit: number; search?: string; status?: string }) {
    const { page, limit, search, status } = params;
    const where: any = {};

    if (status && status !== 'All') {
      where.currentStatus = status;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { regNo: { contains: term, mode: 'insensitive' } },
        { translations: { some: { firstName: { contains: term, mode: 'insensitive' } } } },
        { translations: { some: { lastName: { contains: term, mode: 'insensitive' } } } },
      ];
    }

    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          basic: {
            include: {
              profileFor: true,
              height: true,
              currentLocation: { include: { district: true, taluk: true } },
              nativeLocation: { include: { district: true, taluk: true } },
            },
          },
          community: { include: { community: true, caste: true, kulam: true } },
          professional: { include: { jobSector: true } },
          photo: {
            include: {
              primaryUpload: { select: { uploadToken: true, objectKey: true, width: true, height: true } },
            },
          },
          translations: true,
          account: {
            include: {
              credential: { select: { email: true, phone: true } },
              translations: true,
            },
          },
        },
      }),
      prisma.profile.count({ where }),
    ]);

    return { profiles, total };
  }

  async findFullWithOwner(profileId: string) {
    return prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        basic: {
          include: {
            profileFor: true,
            height: true,
            currentLocation: { include: { district: true, taluk: true } },
            nativeLocation: { include: { district: true, taluk: true } },
          },
        },
        community: { include: { community: true, caste: true, kulam: true } },
        professional: { include: { jobSector: true } },
        family: true,
        horoscope: {
          include: {
            rasi: true,
            nakshatra: true,
            lagna: true,
            rasiChart: { select: { uploadToken: true, objectKey: true, width: true, height: true } },
            navamsaChart: { select: { uploadToken: true, objectKey: true, width: true, height: true } },
          },
        },
        photo: {
          include: {
            primaryUpload: { select: { uploadToken: true, objectKey: true, width: true, height: true } },
            gallery: { include: { upload: { select: { uploadToken: true, objectKey: true, width: true, height: true } } } },
          },
        },
        assets: true,
        partnerPreference: {
          include: {
            heightMin: true,
            heightMax: true,
          },
        },
        translations: true,
        history: { orderBy: { createdAt: 'desc' }, take: 5 },
        account: {
          include: {
            credential: { select: { email: true, phone: true } },
            translations: true,
          },
        },
      },
    });
  }
}
