import { prisma } from '../../database/prisma.js';
import type { AdminProfilesRepository } from './admin-profiles.repository.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import type { StorageService } from '../storage/storage.service.js';
import { ProfileUpsertService } from '../profile/profile-upsert.service.js';

export class AdminProfilesService {
  private readonly upsertService = new ProfileUpsertService();

  constructor(
    private readonly repo: AdminProfilesRepository,
    private readonly storageService?: StorageService,
  ) {}

  async listProfiles(params: {
    page: number; limit: number; search?: string; status?: string;
    sortBy?: string; sortOrder?: string; communityId?: string; regNo?: string;
    createdAtFrom?: string; createdAtTo?: string;
  }) {
    const page = Math.max(1, params.page);
    const limit = Math.min(100, Math.max(1, params.limit));

    const result = await this.repo.findAll({
      page, limit, search: params.search, status: params.status,
      sortBy: params.sortBy, sortOrder: params.sortOrder,
      communityId: params.communityId, regNo: params.regNo,
      createdAtFrom: params.createdAtFrom, createdAtTo: params.createdAtTo,
    });

    const profiles = result.profiles.map((p: any) => {
      const en = p.translations?.find((t: any) => t.language === 'EN');
      const ta = p.translations?.find((t: any) => t.language === 'TA');
      const accEn = p.account?.translations?.find((t: any) => t.language === 'EN');
      const accTa = p.account?.translations?.find((t: any) => t.language === 'TA');

      return {
        id: p.id,
        regNo: p.regNo ?? p.id,
        status: p.currentStatus,
        firstNameEn: en?.firstName ?? null,
        lastNameEn: en?.lastName ?? null,
        firstNameTa: ta?.firstName ?? null,
        lastNameTa: ta?.lastName ?? null,
        createdAt: p.createdAt.toISOString(),
        profilePhoto: p.photo?.primaryUpload?.objectKey
          ? { url: `/media/${p.photo.primaryUpload.objectKey}`, width: p.photo.primaryUpload.width, height: p.photo.primaryUpload.height }
          : null,
        owner: {
          id: p.account?.id ?? null,
          firstNameEn: accEn?.firstName ?? null,
          lastNameEn: accEn?.lastName ?? null,
          firstNameTa: accTa?.firstName ?? null,
          lastNameTa: accTa?.lastName ?? null,
        },
      };
    });

    return {
      profiles,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  async getProfileDetail(profileId: string) {
    const p = await this.repo.findFullWithOwner(profileId);
    if (!p) {
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }

    const b = p.basic;
    const c = p.community;
    const prof = p.professional;
    const f = p.family;
    const h = p.horoscope;
    const ph = p.photo;
    const a = p.assets;
    const pp = p.partnerPreference;

    const enTrans = p.translations?.find((t: any) => t.language === 'EN');
    const taTrans = p.translations?.find((t: any) => t.language === 'TA');
    const accEn = p.account?.translations?.find((t: any) => t.language === 'EN');
    const accTa = p.account?.translations?.find((t: any) => t.language === 'TA');

    const et = enTrans as any;
    const tt = taTrans as any;
    const mapLocation = (loc: any, prefix: string) => {
      if (!loc) {
        return {
          [`${prefix}IsOther`]: false,
          [`${prefix}DistrictEn`]: null,
          [`${prefix}District`]: null,
          [`${prefix}DistrictTa`]: null,
          [`${prefix}Taluk`]: null,
          [`${prefix}TalukTa`]: null,
          [`${prefix}CityEn`]: null,
          [`${prefix}CityTa`]: null,
          [`${prefix}StateEn`]: null,
          [`${prefix}StateTa`]: null,
          [`${prefix}CountryEn`]: null,
          [`${prefix}CountryTa`]: null,
        };
      }
      const isOther = loc.isOther ?? false;
      const result: any = { [`${prefix}IsOther`]: isOther };
      if (isOther) {
        result[`${prefix}DistrictEn`] = null;
        result[`${prefix}District`] = 'OTHER';
        result[`${prefix}DistrictTa`] = null;
        result[`${prefix}Taluk`] = null;
        result[`${prefix}TalukTa`] = null;
        result[`${prefix}CityEn`] = et?.[`${prefix}City`] ?? null;
        result[`${prefix}CityTa`] = tt?.[`${prefix}City`] ?? null;
        result[`${prefix}StateEn`] = et?.[`${prefix}State`] ?? null;
        result[`${prefix}StateTa`] = tt?.[`${prefix}State`] ?? null;
        result[`${prefix}CountryEn`] = et?.[`${prefix}Country`] ?? null;
        result[`${prefix}CountryTa`] = tt?.[`${prefix}Country`] ?? null;
      } else {
        result[`${prefix}DistrictEn`] = loc.district?.code ?? null;
        result[`${prefix}District`] = loc.district?.code ?? null;
        result[`${prefix}DistrictTa`] = loc.district?.code ?? null;
        result[`${prefix}Taluk`] = loc.taluk?.code ?? null;
        result[`${prefix}TalukTa`] = loc.taluk?.code ?? null;
        result[`${prefix}CityEn`] = et?.[`${prefix}City`] ?? null;
        result[`${prefix}CityTa`] = tt?.[`${prefix}City`] ?? null;
        result[`${prefix}StateEn`] = et?.[`${prefix}State`] ?? null;
        result[`${prefix}StateTa`] = tt?.[`${prefix}State`] ?? null;
        result[`${prefix}CountryEn`] = et?.[`${prefix}Country`] ?? null;
        result[`${prefix}CountryTa`] = tt?.[`${prefix}Country`] ?? null;
      }
      return result;
    };

    return {
      id: p.id,
      userId: p.accountId,
      regNo: p.regNo ?? p.id,
      status: p.currentStatus,
      adminVerified: null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      canViewFullProfile: true,

      firstNameEn: enTrans?.firstName ?? null,
      lastNameEn: enTrans?.lastName ?? null,
      firstNameTa: taTrans?.firstName ?? null,
      lastNameTa: taTrans?.lastName ?? null,
      dob: b?.dob?.toISOString() ?? null,
      gender: b?.gender ?? null,
      profileFor: b?.profileFor?.code ?? null,
      maritalStatus: b?.maritalStatus ?? null,
      diet: b?.diet ?? null,
      bloodGroup: b?.bloodGroup ?? null,
      height: b?.height?.valueCm ?? null,
      weight: b?.weight ?? null,
      complexion: b?.complexion ?? null,

      community: c?.community?.code ?? null,
      communityTa: null,
      caste: c?.caste?.code ?? null,
      casteTa: null,
      kulam: c?.kulam?.code ?? null,
      kuladeivamEn: enTrans?.kuladeivam ?? null,
      kuladeivamTa: taTrans?.kuladeivam ?? null,
      birthPlaceEn: (h?.horoscopeJson as any)?.input?.location?.displayName ?? null,
      birthPlaceTa: (h?.horoscopeJson as any)?.input?.location?.displayName ?? null,

      star: h?.nakshatra?.code ?? null,
      rasi: h?.rasi?.code ?? null,
      lagnam: h?.lagna?.code ?? null,
      laganam: h?.lagna?.code ?? null,
      dosham: null,
      birthTime: null,

      education: prof?.education ?? null,
      educationTa: null,
      jobDetail: prof?.jobDetail ?? null,
      jobDetailTa: null,
      companyName: prof?.companyName ?? null,
      jobSector: prof?.jobSector?.code ?? null,
      jobLocationEn: prof?.jobLocation ?? null,
      jobLocationTa: prof?.jobLocation ?? null,
      salaryMonthly: prof?.monthlySalary ? Number(prof.monthlySalary) : null,

      fatherNameEn: enTrans?.fatherName ?? null,
      fatherNameTa: taTrans?.fatherName ?? null,
      fatherJob: f?.fatherJob ?? null,
      fatherJobTa: null,
      fatherSalary: f?.fatherSalary ?? null,
      fatherIsLate: f != null ? !f.fatherAlive : null,
      motherNameEn: enTrans?.motherName ?? null,
      motherNameTa: taTrans?.motherName ?? null,
      motherJob: f?.motherJob ?? null,
      motherJobTa: null,
      motherSalary: f?.motherSalary ?? null,
      motherIsLate: f != null ? !f.motherAlive : null,
      noOfBrothers: f?.noOfBrother ?? null,
      noOfSisters: f?.noOfSister ?? null,

      residence: a?.residenceType ?? null,
      propertyDetailsEn: null,
      propertyDetailsTa: null,
      landEn: a?.land ?? null,
      landTa: null,
      otherAssetsEn: a?.otherAssets ?? null,
      otherAssetsTa: null,
      vehicle: a?.vehicle ?? null,

      ageMin: pp?.ageMin ?? null,
      ageMax: pp?.ageMax ?? null,
      heightMinId: pp?.heightMin?.valueCm ?? null,
      heightMaxId: pp?.heightMax?.valueCm ?? null,
      monthlySalary: pp?.monthlySalary ? Number(pp.monthlySalary) : null,
      expectationNoteEn: pp?.expectationNote ?? null,
      expectationNoteTa: null,
      preferredLocationEn: pp?.preferredLocation ?? null,
      preferredLocationTa: null,

      horoscope: h ? {
        id: h.id,
        profileId: h.profileId,
        mode: h.mode,
        rasi: h.rasiChart?.objectKey
          ? { url: `/media/${h.rasiChart.objectKey}`, width: h.rasiChart.width, height: h.rasiChart.height }
          : null,
        navamsa: h.navamsaChart?.objectKey
          ? { url: `/media/${h.navamsaChart.objectKey}`, width: h.navamsaChart.width, height: h.navamsaChart.height }
          : null,
        lagna: null,
        birthTime: (h.horoscopeJson as any)?.input
          ? `${(h.horoscopeJson as any).input.dateOfBirth}T${(h.horoscopeJson as any).input.timeOfBirth}:00.000Z`
          : null,
        birthPlace: (h.horoscopeJson as any)?.input?.location?.displayName ?? null,
        horoscopeJson: h.horoscopeJson ?? null,
      } : null,

      profilePhoto: ph?.primaryUpload?.objectKey
        ? { url: `/media/${ph.primaryUpload.objectKey}`, width: ph.primaryUpload.width, height: ph.primaryUpload.height }
        : null,
      gallery: ph?.gallery
        ?.map((g: any) => g.upload?.objectKey
          ? { url: `/media/${g.upload.objectKey}`, width: g.upload.width, height: g.upload.height }
          : null)
        .filter(Boolean) ?? [],

      rejectionReasonEn: p.rejectionReasonEn ?? null,
      rejectionReasonTa: p.rejectionReasonTa ?? null,
      statusReasonEn: null,
      statusReasonTa: null,
      archiveReasonEn: (p as any).archiveReasonEn ?? null,
      archiveReasonTa: (p as any).archiveReasonTa ?? null,
      blockReasonEn: null,
      blockReasonTa: null,

      owner: {
        id: p.account?.id ?? null,
        phone: p.account?.credential?.phone ?? null,
        email: p.account?.credential?.email ?? null,
        firstNameEn: accEn?.firstName ?? null,
        lastNameEn: accEn?.lastName ?? null,
        firstNameTa: accTa?.firstName ?? null,
        lastNameTa: accTa?.lastName ?? null,
      },

      svgData: null,
      svgDataEn: null,
      svgNavamsaData: null,
      svgNavamsaDataEn: null,
      dasaRemaining: null,
      horoscopeFile: null,
      galleryPhotos: null,
      galleryFiles: null,
      verifiedAt: null,
      verifiedBy: null,
      expectationEn: null,
      expectationTa: null,
      isOwner: false,

      ...mapLocation(b?.currentLocation, 'current'),
      ...mapLocation(b?.nativeLocation, 'native'),
    };
  }

  async updateProfile(adminId: string, profileId: string, dto: any, ipAddress?: string) {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { currentStatus: true, accountId: true },
    });

    if (!profile) {
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }
    if (profile.currentStatus !== 'PENDING') {
      throw new AppError(400, ErrorCodes.PROFILE_WRONG_STATUS, 'PROFILE_WRONG_STATUS');
    }

    const { translations, photos, ...sections } = dto;

    await this.upsertService.resolveUploadTokensInDto(dto);

    return prisma.$transaction(async (tx) => {
      await this.upsertService.upsertSections(tx, profileId, sections, photos, translations, true);

      await tx.profileStateHistory.create({
        data: {
          profileId,
          changedByAccountId: adminId,
          fromStatus: 'PENDING',
          toStatus: 'PENDING',
        },
      });

      await tx.profileReview.create({
        data: {
          profileId,
          reviewerId: adminId,
          action: 'UPDATE',
        },
      });

      await tx.adminAuditEvent.create({
        data: {
          actorId: adminId,
          profileId,
          action: 'PROFILE_EDITED',
          ipAddress: ipAddress || null,
        },
      });

      return { profileId, status: 'PENDING' };
    });
  }

  async archiveProfile(adminId: string, profileId: string, dto: { reasonEn: string; reasonTa?: string }, ipAddress?: string) {
    const profile = await prisma.profile.findUnique({ where: { id: profileId }, select: { currentStatus: true } });

    if (!profile) {
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }
    if (profile.currentStatus !== 'ACTIVE') {
      throw new AppError(400, ErrorCodes.PROFILE_WRONG_STATUS, 'PROFILE_WRONG_STATUS');
    }
    if (!dto.reasonEn || dto.reasonEn.trim().length === 0) {
      throw new AppError(400, ErrorCodes.ARCHIVE_REASON_REQUIRED, ErrorCodes.ARCHIVE_REASON_REQUIRED);
    }

    return prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: profileId },
        data: {
          currentStatus: 'ARCHIVED',
          archiveReasonEn: dto.reasonEn,
          archiveReasonTa: dto.reasonTa || null,
          archivedAt: new Date(),
        },
      });

      await tx.profileStateHistory.create({
        data: {
          profileId,
          changedByAccountId: adminId,
          fromStatus: 'ACTIVE',
          toStatus: 'ARCHIVED',
        },
      });

      await tx.profileReview.create({
        data: {
          profileId,
          reviewerId: adminId,
          action: 'ARCHIVE',
          reasonEn: dto.reasonEn,
          reasonTa: dto.reasonTa || null,
        },
      });

      await tx.adminAuditEvent.create({
        data: {
          actorId: adminId,
          profileId,
          action: 'PROFILE_ARCHIVED',
          ipAddress: ipAddress || null,
        },
      });

      return { profileId, status: 'ARCHIVED' };
    });
  }

  async deleteProfile(adminId: string, profileId: string, ipAddress?: string) {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { currentStatus: true },
    });

    if (!profile) {
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }
    if (!['DRAFT', 'PENDING', 'ACTIVE', 'ARCHIVED', 'REJECTED'].includes(profile.currentStatus)) {
      throw new AppError(400, ErrorCodes.PROFILE_WRONG_STATUS, 'PROFILE_WRONG_STATUS');
    }

    return prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: profileId },
        data: { currentStatus: 'DELETED' },
      });

      await tx.profileStateHistory.create({
        data: {
          profileId,
          changedByAccountId: adminId,
          fromStatus: profile.currentStatus,
          toStatus: 'DELETED',
        },
      });

      await tx.profileReview.create({
        data: {
          profileId,
          reviewerId: adminId,
          action: 'DELETE',
        },
      });

      await tx.adminAuditEvent.create({
        data: {
          actorId: adminId,
          profileId,
          action: 'PROFILE_DELETED',
          ipAddress: ipAddress || null,
        },
      });

      if (this.storageService) {
        const fullProfile = await tx.profile.findUnique({
          where: { id: profileId },
          include: {
            photo: { include: { gallery: true } },
            horoscope: true,
          },
        });

        if (fullProfile) {
          const uploadIds: string[] = [];
          if (fullProfile.photo?.primaryUploadId) uploadIds.push(fullProfile.photo.primaryUploadId);
          if (fullProfile.photo?.gallery) uploadIds.push(...fullProfile.photo.gallery.map((g: any) => g.uploadId));
          if (fullProfile.horoscope?.rasiChartUploadId) uploadIds.push(fullProfile.horoscope.rasiChartUploadId);
          if (fullProfile.horoscope?.navamsaChartUploadId) uploadIds.push(fullProfile.horoscope.navamsaChartUploadId);
          const uniqueIds = [...new Set(uploadIds)];
          if (uniqueIds.length > 0) {
            await this.storageService.bulkTransitionStatus(uniqueIds, ['ATTACHED', 'ACTIVE'], 'DELETE_PENDING', tx);
          }
        }
      }

      return { profileId, status: 'DELETED' };
    });
  }

  async getAuditTrail(profileId: string) {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, regNo: true },
    });
    if (!profile) {
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }

    const [stateHistory, reviews, queue] = await Promise.all([
      prisma.profileStateHistory.findMany({
        where: { profileId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.profileReview.findMany({
        where: { profileId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { reviewer: { select: { id: true, translations: true } } },
      }),
      prisma.verificationQueue.findUnique({
        where: { profileId },
        select: { assignedTo: true, priority: true, createdAt: true, completedAt: true },
      }),
    ]);

    // Resolve account names for state history changedBy
    const accountIds = [...new Set(stateHistory.map((h: any) => h.changedByAccountId).filter(Boolean))];
    const accounts = accountIds.length > 0
      ? await prisma.account.findMany({
          where: { id: { in: accountIds } },
          select: { id: true, translations: true },
        })
      : [];
    const accountMap = new Map(accounts.map((a: any) => [a.id, a]));

    const formatName = (account: any) => {
      if (!account) return null;
      const en = account.translations?.find((t: any) => t.language === 'EN');
      return en ? `${en.firstName ?? ''} ${en.lastName ?? ''}`.trim() : null;
    };

    return {
      stateHistory: stateHistory.map((h: any) => {
        const changedByAccount = h.changedByAccountId ? accountMap.get(h.changedByAccountId) : null;
        return {
          from: h.fromStatus,
          to: h.toStatus,
          changedBy: formatName(changedByAccount) || h.changedByAccountId,
          changedAt: h.createdAt.toISOString(),
          reason: h.reason || null,
        };
      }),
      reviews: reviews.map((r: any) => ({
        verifierName: formatName(r.reviewer),
        decision: r.action,
        comment: r.reasonEn || r.reasonTa || null,
        createdAt: r.createdAt.toISOString(),
      })),
      queue: queue
        ? {
            assignedTo: queue.assignedTo,
            priority: queue.priority,
            createdAt: queue.createdAt?.toISOString() ?? null,
            completedAt: queue.completedAt?.toISOString() ?? null,
          }
        : null,
    };
  }

  async restoreProfile(adminId: string, profileId: string, ipAddress?: string) {
    const profile = await prisma.profile.findUnique({ where: { id: profileId }, select: { currentStatus: true } });

    if (!profile) {
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }
    if (profile.currentStatus !== 'ARCHIVED') {
      throw new AppError(400, ErrorCodes.PROFILE_ALREADY_ACTIVE, 'PROFILE_ALREADY_ACTIVE');
    }

    return prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: profileId },
        data: {
          currentStatus: 'ACTIVE',
          archivedAt: null,
        },
      });

      await tx.profileStateHistory.create({
        data: {
          profileId,
          changedByAccountId: adminId,
          fromStatus: 'ARCHIVED',
          toStatus: 'ACTIVE',
        },
      });

      await tx.profileReview.create({
        data: {
          profileId,
          reviewerId: adminId,
          action: 'RESTORE',
        },
      });

      await tx.adminAuditEvent.create({
        data: {
          actorId: adminId,
          profileId,
          action: 'PROFILE_RESTORED',
          ipAddress: ipAddress || null,
        },
      });

      return { profileId, status: 'ACTIVE' };
    });
  }
}
