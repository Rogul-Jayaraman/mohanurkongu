import { prisma } from '../../database/prisma.js';

export class AdminVerificationRepository {
  private mapProfileToFlat(profile: any) {
    const en = profile.translations?.find((t: any) => t.language === 'EN');
    const ta = profile.translations?.find((t: any) => t.language === 'TA');
    const accEn = profile.account?.translations?.find((t: any) => t.language === 'EN');
    const accTa = profile.account?.translations?.find((t: any) => t.language === 'TA');
    const b = profile.basic;
    const cl = b?.currentLocation;
    const nl = b?.nativeLocation;

    const calculateAge = (dob: Date | undefined | null): number => {
      if (!dob) return 0;
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      return age;
    };

    const val = (x: any) => x ?? null;

    return {
      id: profile.id,
      regNo: profile.regNo ?? profile.id,
      status: profile.currentStatus,
      firstNameEn: en?.firstName ?? null,
      lastNameEn: en?.lastName ?? null,
      firstNameTa: ta?.firstName ?? null,
      lastNameTa: ta?.lastName ?? null,
      name: [en?.firstName, en?.lastName].filter(Boolean).join(' ') || [ta?.firstName, ta?.lastName].filter(Boolean).join(' '),
      createdByEn: accEn ? [accEn.firstName, accEn.lastName].filter(Boolean).join(' ') : null,
      createdByTa: accTa ? [accTa.firstName, accTa.lastName].filter(Boolean).join(' ') : null,
      community: profile.community?.community?.code ?? null,
      caste: profile.community?.caste?.code ?? null,
      kulam: profile.community?.kulam?.code ?? null,
      kuladeivamEn: en?.kuladeivam ?? null,
      kuladeivamTa: ta?.kuladeivam ?? null,
      age: b?.dob ? calculateAge(b.dob) : null,
      dob: b?.dob?.toISOString() ?? null,
      gender: b?.gender ?? null,
      education: profile.professional?.education ?? null,
      jobDetail: profile.professional?.jobDetail ?? null,
      profilePhoto: profile.photo?.primaryUpload?.objectKey
        ? { url: `/media/${profile.photo.primaryUpload.objectKey}`, width: profile.photo.primaryUpload.width, height: profile.photo.primaryUpload.height }
        : null,
      photo: profile.photo?.primaryUpload?.objectKey
        ? { url: `/media/${profile.photo.primaryUpload.objectKey}`, width: profile.photo.primaryUpload.width, height: profile.photo.primaryUpload.height }
        : null,
      createdAt: profile.createdAt.toISOString(),
      submittedAt: profile.createdAt.toISOString(),

      currentDistrictEn: val(cl?.district?.code),
      currentDistrict: val(cl?.district?.code),
      currentDistrictTa: val(cl?.district?.code),
      currentTaluk: val(cl?.taluk?.code),
      currentTalukTa: val(cl?.taluk?.code),
      currentCityEn: val(cl?.isOther ? en?.currentCity : null),
      currentCityTa: val(cl?.isOther ? ta?.currentCity : null),
      currentStateEn: val(cl?.isOther ? en?.currentState : null),
      currentStateTa: val(cl?.isOther ? ta?.currentState : null),
      currentCountryEn: val(cl?.isOther ? en?.currentCountry : null),
      currentCountryTa: val(cl?.isOther ? ta?.currentCountry : null),

      nativeDistrictEn: val(nl?.district?.code),
      nativeDistrict: val(nl?.district?.code),
      nativeDistrictTa: val(nl?.district?.code),
      nativeTaluk: val(nl?.taluk?.code),
      nativeCityEn: val(nl?.isOther ? en?.nativeCity : null),
      nativeCityTa: val(nl?.isOther ? ta?.nativeCity : null),
      nativeStateEn: val(nl?.isOther ? en?.nativeState : null),
      nativeStateTa: val(nl?.isOther ? ta?.nativeState : null),
      nativeCountryEn: val(nl?.isOther ? en?.nativeCountry : null),
      nativeCountryTa: val(nl?.isOther ? ta?.nativeCountry : null),
    };
  }

  async findPendingProfiles(params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    const where: any = { currentStatus: 'PENDING' };

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

    return {
      profiles: profiles.map((p: any) => this.mapProfileToFlat(p)),
      total,
    };
  }

  async findById(id: string) {
    return prisma.profile.findUnique({ where: { id } });
  }

  async getQueueStats() {
    const [pending, total] = await Promise.all([
      prisma.profile.count({ where: { currentStatus: 'PENDING' } }),
      prisma.profile.count(),
    ]);
    return { pending, total };
  }
}
