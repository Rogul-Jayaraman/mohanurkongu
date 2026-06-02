import { prisma } from '../../database/prisma.js';

export class AdminProfilesRepository {
  async findAll(params: {
    page: number; limit: number; search?: string; status?: string;
    sortBy?: string; sortOrder?: string; communityId?: string; regNo?: string;
    createdAtFrom?: string; createdAtTo?: string;
  }) {
    const {
      page, limit, search, status, sortBy, sortOrder,
      communityId, regNo, createdAtFrom, createdAtTo,
    } = params;
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

    if (communityId) {
      const parsed = parseInt(communityId, 10);
      if (!isNaN(parsed)) where.community = { communityId: parsed };
    }

    if (regNo) {
      where.regNo = regNo;
    }

    if (createdAtFrom || createdAtTo) {
      where.createdAt = {};
      if (createdAtFrom) where.createdAt.gte = new Date(createdAtFrom);
      if (createdAtTo) where.createdAt.lte = new Date(createdAtTo);
    }

    const validSortFields = ['createdAt', 'updatedAt', 'regNo'];
    const orderField = validSortFields.includes(sortBy || '') ? sortBy! : 'createdAt';
    const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: orderDir },
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
