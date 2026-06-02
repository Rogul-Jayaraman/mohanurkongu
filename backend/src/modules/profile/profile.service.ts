import { ProfileRepository } from './profile.repository.js';
import { StorageService } from '../storage/storage.service.js';
import { AccountService } from '../account/account.service.js';
import { MembershipGuard } from '../membership/membership.guard.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import { prisma } from '../../database/prisma.js';
import { appConfig } from '../../config/app.config.js';
import { ProfileUpsertService } from './profile-upsert.service.js';
import type { ProfileStatus } from '@prisma/client';

export class ProfileService {
  private upsertService = new ProfileUpsertService();

  constructor(
    private repo: ProfileRepository,
    private storageService: StorageService,
    private accountService: AccountService,
    private membershipGuard?: MembershipGuard,
  ) {}

  private reverseMapProfessional(prof: any) {
    return {
      education: prof.education ?? null,
      jobSectorId: prof.jobSectorId ?? null,
      jobDetail: prof.jobDetail ?? null,
      companyName: prof.companyName ?? null,
      jobLocationEn: prof.jobLocation ?? null,
      jobLocationTa: null,
      monthlySalary: prof.monthlySalary ? Number(prof.monthlySalary) : null,
    };
  }

  private reverseMapAssets(assets: any) {
    return {
      landEn: assets.land ?? null,
      landTa: null,
      residenceType: assets.residenceType ?? null,
      otherAssetsEn: assets.otherAssets ?? null,
      otherAssetsTa: null,
      vehicle: assets.vehicle ?? null,
    };
  }

  private reverseMapPartnerPreference(pp: any) {
    return {
      ageMin: pp.ageMin ?? null,
      ageMax: pp.ageMax ?? null,
      heightMinId: pp.heightMin?.valueCm ?? null,
      heightMaxId: pp.heightMax?.valueCm ?? null,
      monthlySalary: pp.monthlySalary ? Number(pp.monthlySalary) : null,
      expectationNoteEn: pp.expectationNote ?? null,
      expectationNoteTa: null,
      preferredLocationEn: pp.preferredLocation ?? null,
      preferredLocationTa: null,
    };
  }

  private async validateCreateProfile(dto: any, accountId: string) {
    const { translations, photos, ...sections } = dto;

    if (!sections.basic) {
      throw new AppError(400, ErrorCodes.PROFILE_MISSING_BASIC, 'PROFILE_MISSING_BASIC');
    }
    const basic = sections.basic;
    if (!basic.gender) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'GENDER_REQUIRED');
    if (!basic.dob) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'DOB_REQUIRED');
    if (!basic.diet) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'DIET_REQUIRED');
    if (!basic.heightId && basic.heightId !== 0) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'HEIGHT_REQUIRED');
    if (!basic.profileFor) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'PROFILE_FOR_REQUIRED');

    if (!sections.community) {
      throw new AppError(400, ErrorCodes.PROFILE_MISSING_COMMUNITY, 'PROFILE_MISSING_COMMUNITY');
    }
    const community = sections.community;
    if (!community.community) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'COMMUNITY_REQUIRED');
    if (!community.caste) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'CASTE_REQUIRED');

    if (!photos?.primaryUploadId) {
      throw new AppError(400, ErrorCodes.PROFILE_MISSING_PHOTO, 'PROFILE_MISSING_PHOTO');
    }
    const enTranslation = translations?.find((t: any) => t.language === 'EN');
    if (!enTranslation?.firstName || enTranslation.firstName.trim().length === 0) {
      throw new AppError(400, ErrorCodes.PROFILE_MISSING_DEFAULT_TRANSLATION, 'PROFILE_MISSING_DEFAULT_TRANSLATION');
    }

    const uploadIds = this.upsertService.collectUploadIds(dto);
    await this.upsertService.validateUploadOwnership(uploadIds, accountId);
  }

  async saveDraft(accountId: string, dto: any) {
    await this.upsertService.resolveUploadTokensInDto(dto);
    const { profileId: existingProfileId, translations, photos, ...sections } = dto;

    const uploadIds = this.upsertService.collectUploadIds(dto);
    await this.upsertService.validateUploadOwnership(uploadIds, accountId);

    return await prisma.$transaction(async (tx) => {
      let profile;
      if (existingProfileId) {
        profile = await this.repo.findDraftById(tx, existingProfileId, accountId);
        if (!profile) {
          throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'DRAFT_NOT_FOUND');
        }
      } else {
        profile = await this.repo.createProfile(tx, accountId, 'DRAFT' as ProfileStatus);
      }

      await this.upsertService.upsertSections(tx, profile.id, sections, photos, translations);

      const historyCount = await tx.profileStateHistory.count({
        where: { profileId: profile.id },
      });
      if (historyCount === 0) {
        await tx.profileStateHistory.create({
          data: { profileId: profile.id, changedByAccountId: accountId, toStatus: 'DRAFT' },
        });
      }

      if (uploadIds.length > 0) {
        await this.storageService.bulkTransitionStatus(uploadIds, ['TEMP', 'ATTACHED'], 'ATTACHED', tx);
      }

      return { profileId: profile.id };
    });
  }

  async createProfile(accountId: string, dto: any) {
    await this.upsertService.resolveUploadTokensInDto(dto);
    const { profileId: existingProfileId, translations, photos, ...sections } = dto;

    await this.validateCreateProfile(dto, accountId);

    const regNo = await this.accountService.generateRegNo();
    const uploadIds = this.upsertService.collectUploadIds(dto);

    return await prisma.$transaction(async (tx) => {
      if (this.membershipGuard) {
        const caps = await this.membershipGuard.resolveCapabilities(accountId);
        if (caps && caps.profileSlotLimit >= 0) {
          const current = await tx.profile.count({
            where: { accountId, currentStatus: { in: ['DRAFT', 'PENDING', 'ACTIVE', 'ARCHIVED'] } },
          });
          const occupiedByThis = existingProfileId ? 1 : 0;
          if (current - occupiedByThis >= caps.profileSlotLimit) {
            throw new AppError(403, ErrorCodes.MEMBERSHIP_SLOT_LIMIT_REACHED, 'MEMBERSHIP_SLOT_LIMIT_REACHED');
          }
        }
      }

      let profile;
      if (existingProfileId) {
        profile = await this.repo.findDraftById(tx, existingProfileId, accountId);
        if (!profile) {
          throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'DRAFT_NOT_FOUND');
        }
        await tx.profile.update({
          where: { id: profile.id },
          data: {
            currentStatus: 'PENDING' as ProfileStatus,
            regNo,
          },
        });
      } else {
        profile = await this.repo.createProfile(tx, accountId, 'PENDING' as ProfileStatus);
        await tx.profile.update({ where: { id: profile.id }, data: { regNo } });
      }

      await this.upsertService.upsertSections(tx, profile.id, sections, photos, translations);

      const historyCount = await tx.profileStateHistory.count({
        where: { profileId: profile.id },
      });

      await tx.profileStateHistory.create({
        data: {
          profileId: profile.id,
          changedByAccountId: accountId,
          fromStatus: historyCount > 0 ? 'DRAFT' : null,
          toStatus: 'PENDING',
        },
      });

      if (uploadIds.length > 0) {
        await this.storageService.bulkTransitionStatus(uploadIds, ['TEMP'], 'ATTACHED', tx);
      }

      await tx.verificationQueue.upsert({
        where: { profileId: profile.id },
        create: { profileId: profile.id, priority: 0 },
        update: {},
      });

      return { profileId: profile.id, regNo, status: 'PENDING' };
    });
  }

  async resumeDraft(accountId: string, profileId: string) {
    console.log('[resumeDraft] accountId=%s profileId=%s', accountId, profileId);
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, accountId, currentStatus: 'DRAFT' },
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
        horoscope: { include: { rasi: true, nakshatra: true, lagna: true, rasiChart: true, navamsaChart: true } },
        photo: { include: { primaryUpload: true, gallery: { include: { upload: true } } } },
        assets: true,
        partnerPreference: {
          include: {
            heightMin: true,
            heightMax: true,
          },
        },
        translations: true,
      },
    });

    if (!profile) {
      console.log('[resumeDraft] NOT FOUND — accountId=%s profileId=%s', accountId, profileId);
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }

    console.log('[resumeDraft] FOUND profile — id=%s accountId=%s currentStatus=%s', profile.id, profile.accountId, profile.currentStatus);
    console.log('[resumeDraft] includes basic=%s community=%s professional=%s family=%s horoscope=%s photo=%s assets=%s partnerPref=%s translations=%s',
      !!profile.basic, !!profile.community, !!profile.professional, !!profile.family,
      !!profile.horoscope, !!profile.photo, !!profile.assets, !!profile.partnerPreference,
      profile.translations?.length ?? 0);

    const dto: any = {};

    if (profile.basic) {
      const b = profile.basic;
      const enT = profile.translations?.find((t: any) => t.language === 'EN');
      const taT = profile.translations?.find((t: any) => t.language === 'TA');
      const cl = b.currentLocation;
      const nl = b.nativeLocation;
      dto.basic = {
        profileFor: b.profileFor?.code ?? null,
        gender: b.gender ?? null,
        dob: b.dob?.toISOString() ?? null,
        diet: b.diet ?? null,
        bloodGroup: b.bloodGroup ?? null,
        height: b.height?.valueCm ?? null,
        weight: b.weight ?? null,
        complexion: b.complexion ?? null,
        maritalStatus: b.maritalStatus ?? null,
        currentDistrict: cl?.isOther ? 'OTHER' : (cl?.district?.code ?? null),
        currentTaluk: cl?.taluk?.code ?? null,
        currentCityEn: cl?.isOther ? (enT?.currentCity ?? null) : null,
        currentCityTa: cl?.isOther ? (taT?.currentCity ?? null) : null,
        currentStateEn: cl?.isOther ? (enT?.currentState ?? null) : null,
        currentStateTa: cl?.isOther ? (taT?.currentState ?? null) : null,
        currentCountryEn: cl?.isOther ? (enT?.currentCountry ?? null) : null,
        currentCountryTa: cl?.isOther ? (taT?.currentCountry ?? null) : null,
        nativeDistrict: nl?.isOther ? 'OTHER' : (nl?.district?.code ?? null),
        nativeTaluk: nl?.taluk?.code ?? null,
        nativeCityEn: nl?.isOther ? (enT?.nativeCity ?? null) : null,
        nativeCityTa: nl?.isOther ? (taT?.nativeCity ?? null) : null,
        nativeStateEn: nl?.isOther ? (enT?.nativeState ?? null) : null,
        nativeStateTa: nl?.isOther ? (taT?.nativeState ?? null) : null,
        nativeCountryEn: nl?.isOther ? (enT?.nativeCountry ?? null) : null,
        nativeCountryTa: nl?.isOther ? (taT?.nativeCountry ?? null) : null,
      };
    }

    if (profile.community) {
      dto.community = {
        community: profile.community.community?.code ?? null,
        caste: profile.community.caste?.code ?? null,
        kulam: profile.community.kulam?.code ?? null,
      };
    }

    if (profile.professional) {
      dto.professional = {
        education: profile.professional.education ?? null,
        jobSector: profile.professional.jobSector?.code ?? null,
        jobDetail: profile.professional.jobDetail ?? null,
        companyName: profile.professional.companyName ?? null,
        jobLocationEn: profile.professional.jobLocation ?? null,
        jobLocationTa: null,
        monthlySalary: profile.professional.monthlySalary ? Number(profile.professional.monthlySalary) : null,
      };
    }

    if (profile.family) {
      dto.family = {
        fatherAlive: profile.family.fatherAlive,
        fatherName: profile.family.fatherName ?? null,
        fatherJob: profile.family.fatherJob ?? null,
        fatherSalary: profile.family.fatherSalary ?? null,
        motherAlive: profile.family.motherAlive,
        motherName: profile.family.motherName ?? null,
        motherJob: profile.family.motherJob ?? null,
        motherSalary: profile.family.motherSalary ?? null,
        noOfBrother: profile.family.noOfBrother ?? null,
        noOfSister: profile.family.noOfSister ?? null,
      };
    }

    if (profile.horoscope) {
      dto.horoscope = {
        mode: profile.horoscope.mode,
        rasi: profile.horoscope.rasi?.code ?? null,
        nakshatra: profile.horoscope.nakshatra?.code ?? null,
        lagna: profile.horoscope.lagna?.code ?? null,
        rasiChartUploadId: profile.horoscope.rasiChartUploadId ?? null,
        navamsaChartUploadId: profile.horoscope.navamsaChartUploadId ?? null,
        rasiChartUploadUrl: profile.horoscope.rasiChart?.objectKey ? `/media/${profile.horoscope.rasiChart.objectKey}` : null,
        navamsaChartUploadUrl: profile.horoscope.navamsaChart?.objectKey ? `/media/${profile.horoscope.navamsaChart.objectKey}` : null,
        horoscopeJson: profile.horoscope.horoscopeJson ?? null,
      };
    }

    if (profile.photo) {
      dto.photos = {
        primaryUploadId: profile.photo.primaryUploadId ?? null,
        primaryUploadUrl: profile.photo.primaryUpload?.objectKey ? `/media/${profile.photo.primaryUpload.objectKey}` : null,
        galleryUploadIds: profile.photo.gallery.map((g: any) => g.uploadId),
        galleryUploadUrls: profile.photo.gallery
          .map((g: any) => g.upload?.objectKey ? `/media/${g.upload.objectKey}` : null)
          .filter(Boolean),
      };
    }

    if (profile.assets) {
      dto.assets = this.reverseMapAssets(profile.assets);
    }

    if (profile.partnerPreference) {
      dto.partnerPreference = this.reverseMapPartnerPreference(profile.partnerPreference);
    }

    if (profile.translations && profile.translations.length > 0) {
      dto.translations = profile.translations.map((t: any) => ({
        language: t.language,
        firstName: t.firstName ?? null,
        lastName: t.lastName ?? null,
        kuladeivam: t.kuladeivam ?? null,
        fatherName: t.fatherName ?? null,
        motherName: t.motherName ?? null,
        jobLocation: t.jobLocation ?? null,
        currentCity: t.currentCity ?? null,
        currentState: t.currentState ?? null,
        currentCountry: t.currentCountry ?? null,
        nativeCity: t.nativeCity ?? null,
        nativeState: t.nativeState ?? null,
        nativeCountry: t.nativeCountry ?? null,
      }));
    }

    console.log('[resumeDraft] RETURNING dto keys=%s', Object.keys(dto).join(', '));
    return dto;
  }

  private async transitionProfileUploads(profileId: string, toStatus: string) {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        photo: { include: { gallery: true } },
        horoscope: true,
      },
    });
    if (!profile) return;
    const uploadIds: string[] = [];
    if (profile.photo?.primaryUploadId) uploadIds.push(profile.photo.primaryUploadId);
    if (profile.photo?.gallery) uploadIds.push(...profile.photo.gallery.map((g: any) => g.uploadId));
    if (profile.horoscope?.rasiChartUploadId) uploadIds.push(profile.horoscope.rasiChartUploadId);
    if (profile.horoscope?.navamsaChartUploadId) uploadIds.push(profile.horoscope.navamsaChartUploadId);
    const uniqueIds = [...new Set(uploadIds)];
    if (uniqueIds.length > 0) {
      await this.storageService.bulkTransitionStatus(uniqueIds, ['ATTACHED', 'ACTIVE'], toStatus);
    }
  }

  async deleteDraft(accountId: string, profileId: string) {
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, accountId, currentStatus: 'DRAFT' },
      include: {
        photo: { include: { gallery: true } },
        horoscope: true,
      },
    });

    if (!profile) {
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }

    const uploadIds: string[] = [];
    if (profile.photo?.primaryUploadId) uploadIds.push(profile.photo.primaryUploadId);
    if (profile.photo?.gallery) uploadIds.push(...profile.photo.gallery.map((g: any) => g.uploadId));
    if (profile.horoscope?.rasiChartUploadId) uploadIds.push(profile.horoscope.rasiChartUploadId);
    if (profile.horoscope?.navamsaChartUploadId) uploadIds.push(profile.horoscope.navamsaChartUploadId);

    const uniqueUploadIds = [...new Set(uploadIds)];

    if (uniqueUploadIds.length > 0) {
      await this.storageService.bulkTransitionStatus(uniqueUploadIds, ['ATTACHED', 'ACTIVE'], 'DELETE_PENDING');
    }
    await prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: profile.id },
        data: { currentStatus: 'DELETED' },
      });

      await tx.profileStateHistory.create({
        data: {
          profileId: profile.id,
          changedByAccountId: accountId,
          fromStatus: 'DRAFT',
          toStatus: 'DELETED',
        },
      });
    });
  }

  private mapLocationFields(loc: any, prefix: string, enTrans?: any, taTrans?: any) {
    const result: any = {};
    const val = (x: any) => x ?? null;
    if (!loc) {
      result[`${prefix}IsOther`] = false;
      result[`${prefix}DistrictEn`] = null;
      result[`${prefix}District`] = null;
      result[`${prefix}DistrictTa`] = null;
      result[`${prefix}Taluk`] = null;
      result[`${prefix}TalukTa`] = null;
      result[`${prefix}CityEn`] = null;
      result[`${prefix}CityTa`] = null;
      result[`${prefix}StateEn`] = null;
      result[`${prefix}StateTa`] = null;
      result[`${prefix}CountryEn`] = null;
      result[`${prefix}CountryTa`] = null;
      return result;
    }

    const isOther = loc.isOther ?? false;
    result[`${prefix}IsOther`] = isOther;

    if (isOther) {
      result[`${prefix}DistrictEn`] = null;
      result[`${prefix}District`] = 'OTHER';
      result[`${prefix}DistrictTa`] = null;
      result[`${prefix}Taluk`] = null;
      result[`${prefix}TalukTa`] = null;
      result[`${prefix}CityEn`] = val(enTrans?.[`${prefix}City`]);
      result[`${prefix}CityTa`] = val(taTrans?.[`${prefix}City`]);
      result[`${prefix}StateEn`] = val(enTrans?.[`${prefix}State`]);
      result[`${prefix}StateTa`] = val(taTrans?.[`${prefix}State`]);
      result[`${prefix}CountryEn`] = val(enTrans?.[`${prefix}Country`]);
      result[`${prefix}CountryTa`] = val(taTrans?.[`${prefix}Country`]);
    } else {
      result[`${prefix}DistrictEn`] = val(loc.district?.code);
      result[`${prefix}District`] = val(loc.district?.code);
      result[`${prefix}DistrictTa`] = val(loc.district?.code);
      result[`${prefix}Taluk`] = val(loc.taluk?.code);
      result[`${prefix}TalukTa`] = val(loc.taluk?.code);
      result[`${prefix}CityEn`] = val(enTrans?.[`${prefix}City`]);
      result[`${prefix}CityTa`] = val(taTrans?.[`${prefix}City`]);
      result[`${prefix}StateEn`] = val(enTrans?.[`${prefix}State`]);
      result[`${prefix}StateTa`] = val(taTrans?.[`${prefix}State`]);
      result[`${prefix}CountryEn`] = val(enTrans?.[`${prefix}Country`]);
      result[`${prefix}CountryTa`] = val(taTrans?.[`${prefix}Country`]);
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────
  // My Profiles — card list
  // ─────────────────────────────────────────────────────────
  async getMyProfiles(accountId: string, q?: string) {
    const profiles = await this.repo.findAllByAccountId(accountId);
    // Client-side filter for search query
    const filteredProfiles = q && q.trim()
      ? profiles.filter(p => {
          const en = p.translations?.find((t: any) => t.language === 'EN');
          const ta = p.translations?.find((t: any) => t.language === 'TA');
          const nameEn = [en?.firstName, en?.lastName].filter(Boolean).join(' ').toLowerCase();
          const nameTa = [ta?.firstName, ta?.lastName].filter(Boolean).join(' ').toLowerCase();
          const regNo = (p.regNo ?? '').toLowerCase();
          const term = q.trim().toLowerCase();
          return nameEn.includes(term) || nameTa.includes(term) || regNo.includes(term);
        })
      : profiles;

    return filteredProfiles.map(p => {
      const en = p.translations?.find(t => t.language === 'EN');
      const ta = p.translations?.find(t => t.language === 'TA');

      const firstNameEn = en?.firstName ?? null;
      const lastNameEn = en?.lastName ?? null;
      const firstNameTa = ta?.firstName ?? null;
      const lastNameTa = ta?.lastName ?? null;

      const name = [firstNameEn, lastNameEn].filter(Boolean).join(' ')
        || [firstNameTa, lastNameTa].filter(Boolean).join(' ')
        || '—';

      return {
        id: p.id,
        regNo: p.regNo ?? '-',
        status: p.currentStatus,
        isOwner: true,
        name,

        firstNameEn,
        lastNameEn,
        firstNameTa,
        lastNameTa,

        dob: p.basic?.dob?.toISOString() ?? null,
        gender: p.basic?.gender ?? null,
        community: p.community?.community?.code ?? null,
        education: p.professional?.education ?? null,
        jobDetail: p.professional?.jobDetail ?? null,

        profilePhoto: p.photo?.primaryUpload?.objectKey
          ? { url: `/media/${p.photo.primaryUpload.objectKey}`, width: p.photo.primaryUpload.width, height: p.photo.primaryUpload.height }
          : null,

        ...this.mapLocationFields(p.basic?.currentLocation, 'current', en, ta),
      };
    });
  }

  // ─────────────────────────────────────────────────────────
  // Showcase profiles — public endpoint for login page carousel
  // ─────────────────────────────────────────────────────────
  async getShowcaseProfiles() {
    const take = 5;

    const [brides, grooms] = await Promise.all([
      prisma.profile.findMany({
        where: {
          currentStatus: 'ACTIVE',
          account: { currentState: 'ACTIVE' },
          basic: { gender: 'FEMALE' },
        },
        orderBy: { createdAt: 'desc' },
        take,
        include: {
          photo: {
            include: {
              primaryUpload: { select: { objectKey: true, width: true, height: true } },
            },
          },
          translations: { select: { language: true, firstName: true, lastName: true } },
        },
      }),
      prisma.profile.findMany({
        where: {
          currentStatus: 'ACTIVE',
          account: { currentState: 'ACTIVE' },
          basic: { gender: 'MALE' },
        },
        orderBy: { createdAt: 'desc' },
        take,
        include: {
          photo: {
            include: {
              primaryUpload: { select: { objectKey: true, width: true, height: true } },
            },
          },
          translations: { select: { language: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    const mapProfile = (p: any) => {
      const en = p.translations?.find((t: any) => t.language === 'EN');
      const ta = p.translations?.find((t: any) => t.language === 'TA');
      return {
        id: p.id,
        regNo: p.regNo ?? '-',
        firstNameEn: en?.firstName ?? null,
        lastNameEn: en?.lastName ?? null,
        firstNameTa: ta?.firstName ?? null,
        lastNameTa: ta?.lastName ?? null,
        profilePhoto: p.photo?.primaryUpload?.objectKey
          ? { url: `/media/public/${p.photo.primaryUpload.objectKey}`, width: p.photo.primaryUpload.width, height: p.photo.primaryUpload.height }
          : null,
      };
    };

    return {
      brides: brides.map(mapProfile),
      grooms: grooms.map(mapProfile),
    };
  }

  // ─────────────────────────────────────────────────────────
  // Browse profiles — for discovery/matching
  // ─────────────────────────────────────────────────────────
  async browseProfiles(accountId: string, params: any) {
    const {
      limit = 20,
      cursor,
      sort = 'createdAt_desc',
      gender,
      q,
      currentDistrict,
      currentTaluk,
      nativeDistrict,
      ageMin,
      ageMax,
      heightMin,
      heightMax,
      minWeight,
      maxWeight,
      maritalStatus,
      complexion,
      diet,
      caste,
      kulam,
      kulamAvoid,
      kuladeivam,
      rasi,
      nakshatra,
      laganam,
      dosham,
      education,
      jobSector,
      jobTitle,
      jobLocation,
      salaryMin,
      salaryMax,
      residence,
      minAgeDiff,
      maxAgeDiff,
    } = params;

    const limitNum = Number(limit);
    const safeLimit = Number.isNaN(limitNum) ? 20 : limitNum;

    // ─── Build WHERE clause ───────────────────────────────
    const where: any = { currentStatus: 'ACTIVE', account: { currentState: 'ACTIVE' } };

    // Gender filter
    if (gender) {
      where.basic = { gender };
    }

    // Age filter — convert to dob range
    if (ageMin || ageMax) {
      const now = new Date();
      const dobFilter: any = {};
      if (ageMin) {
        dobFilter.lte = new Date(now.getFullYear() - ageMin, now.getMonth(), now.getDate());
      }
      if (ageMax) {
        dobFilter.gte = new Date(now.getFullYear() - ageMax, now.getMonth(), now.getDate());
      }
      where.basic = { ...where.basic, dob: dobFilter };
    }

    // Age difference filter — compute from requester's profile DOB
    if (minAgeDiff !== undefined || maxAgeDiff !== undefined) {
      const myProfile = await prisma.profile.findFirst({
        where: { accountId, currentStatus: 'ACTIVE' },
        select: { basic: { select: { dob: true } } },
        orderBy: { createdAt: 'asc' },
      });
      if (myProfile?.basic?.dob) {
        const myAge = this.calculateAge(myProfile.basic.dob.toISOString());
        const diffMin = Number(minAgeDiff ?? -5);
        const diffMax = Number(maxAgeDiff ?? 5);
        const computedMinAge = myAge + Math.min(diffMin, diffMax);
        const computedMaxAge = myAge + Math.max(diffMin, diffMax);
        const now = new Date();
        const dobFilter: any = {};
        if (computedMinAge >= 18) {
          dobFilter.lte = new Date(now.getFullYear() - computedMinAge, now.getMonth(), now.getDate());
        }
        if (computedMaxAge >= 18) {
          dobFilter.gte = new Date(now.getFullYear() - computedMaxAge, now.getMonth(), now.getDate());
        }
        where.basic = { ...where.basic, dob: dobFilter };
      }
    }

    // Height filter — value in cm via height relation
    if (heightMin || heightMax) {
      const hFilter: any = {};
      if (heightMin) hFilter.gte = heightMin;
      if (heightMax) hFilter.lte = heightMax;
      where.basic = { ...where.basic, height: { valueCm: hFilter } };
    }

    // Weight filter
    if (minWeight || maxWeight) {
      const wFilter: any = {};
      if (minWeight) wFilter.gte = minWeight;
      if (maxWeight) wFilter.lte = maxWeight;
      where.basic = { ...where.basic, weight: wFilter };
    }

    // Direct basic fields
    if (maritalStatus) where.basic = { ...where.basic, maritalStatus };
    if (complexion) where.basic = { ...where.basic, complexion };
    if (diet) where.basic = { ...where.basic, diet };

    // Location filters — current
    if (currentDistrict) {
      const locFilter: any = currentDistrict === 'OTHER'
        ? { isOther: true }
        : { district: { code: currentDistrict } };
      if (currentTaluk) {
        locFilter.taluk = { code: currentTaluk };
      }
      where.basic = { ...where.basic, currentLocation: locFilter };
    }

    // Location filters — native
    if (nativeDistrict) {
      where.basic = {
        ...where.basic,
        nativeLocation: nativeDistrict === 'OTHER'
          ? { isOther: true }
          : { district: { code: nativeDistrict } },
      };
    }

    // Community filters
    const communityFilter: any = {};
    if (caste) communityFilter.caste = { code: caste };
    if (kulam) communityFilter.kulam = { code: kulam };
    if (kulamAvoid && kulamAvoid.length > 0) {
      if (communityFilter.kulam) {
        const specific = communityFilter.kulam.code;
        communityFilter.kulam = { code: { in: [specific], notIn: kulamAvoid } };
      } else {
        communityFilter.kulam = { code: { notIn: kulamAvoid } };
      }
    }
    if (Object.keys(communityFilter).length > 0) {
      where.community = communityFilter;
    }

    // Horoscope filters
    const horoscopeFilter: any = {};
    if (rasi) horoscopeFilter.rasi = { code: rasi };
    if (nakshatra) horoscopeFilter.nakshatra = { code: nakshatra };
    if (laganam) horoscopeFilter.lagna = { code: laganam };
    if (Object.keys(horoscopeFilter).length > 0) {
      where.horoscope = horoscopeFilter;
    }

    // Professional filters
    const profFilter: any = {};
    if (education) profFilter.education = { contains: education, mode: 'insensitive' };
    if (jobSector) profFilter.jobSector = { code: jobSector };
    if (jobTitle) profFilter.jobDetail = { contains: jobTitle, mode: 'insensitive' };
    if (jobLocation) profFilter.jobLocation = { contains: jobLocation, mode: 'insensitive' };
    if (salaryMin || salaryMax) {
      const salFilter: any = {};
      // salaryMin/Max are annual in lakhs; DB stores monthlySalary
      if (salaryMin) salFilter.gte = salaryMin * 100000 / 12;
      if (salaryMax) salFilter.lte = salaryMax * 100000 / 12;
      profFilter.monthlySalary = salFilter;
    }
    if (Object.keys(profFilter).length > 0) {
      where.professional = profFilter;
    }

    // Assets filters
    if (residence) {
      where.assets = { residenceType: residence };
    }

    // Text search on translations
    if (q && q.trim()) {
      const qTerm = q.trim();
      const searchConditions: any[] = [
        { firstName: { contains: qTerm, mode: 'insensitive' } },
        { lastName: { contains: qTerm, mode: 'insensitive' } },
      ];
      if (kuladeivam) {
        searchConditions.push({ kuladeivam: { contains: kuladeivam, mode: 'insensitive' } });
      }
      where.translations = { some: { OR: searchConditions } };
    } else if (kuladeivam) {
      where.translations = {
        some: { kuladeivam: { contains: kuladeivam, mode: 'insensitive' } },
      };
    }

    // ─── Membership search level restrictions ─────────────
    if (this.membershipGuard) {
      const searchLevel = await this.membershipGuard.getSearchLevel(accountId);
      // Location filter group: currentDistrict, currentTaluk, ageDiff
      const locationKeys = ['currentDistrict', 'currentTaluk', 'minAgeDiff', 'maxAgeDiff'];
      // Community filter group: kulam, kuladeivam, kulamAvoid
      const communityKeys = ['kulam', 'kuladeivam', 'kulamAvoid'];
      if (searchLevel === 'BASIC') {
        locationKeys.forEach(k => { if (where[k]) delete where[k]; });
        communityKeys.forEach(k => { if (where[k]) delete where[k]; });
        delete where.professional;
        delete where.horoscope;
        delete where.assets;
      } else if (searchLevel === 'EXTENDED') {
        delete where.professional;
        delete where.horoscope;
        delete where.assets;
      } else if (searchLevel === 'ADVANCED') {
        delete where.professional;
        if (where.assets) delete where.assets;
      }
    }

    // ─── Sort ─────────────────────────────────────────────
    const sortMap: Record<string, string> = {
      'newest': 'createdAt_desc',
      'oldest': 'createdAt_asc',
      'age_asc': 'age_low_high',
      'age_desc': 'age_high_low',
    };
    const normalizedSort = sortMap[sort] || sort;

    let orderBy: any = { createdAt: 'desc' };
    if (normalizedSort === 'createdAt_asc') {
      orderBy = { createdAt: 'asc' };
    } else if (normalizedSort === 'age_low_high') {
      orderBy = { basic: { dob: 'desc' } };
    } else if (normalizedSort === 'age_high_low') {
      orderBy = { basic: { dob: 'asc' } };
    }

    // ─── Execute query ────────────────────────────────────
    const profiles = await prisma.profile.findMany({
      where,
      orderBy,
      take: safeLimit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        basic: {
          include: {
            currentLocation: { include: { district: true, taluk: true } },
          },
        },
        professional: true,
        community: { include: { community: true } },
        photo: {
          include: {
            primaryUpload: { select: { uploadToken: true, objectKey: true, width: true, height: true } },
          },
        },
        translations: true,
      },
    });

    const hasMore = profiles.length > safeLimit;
    if (hasMore) {
      profiles.pop();
    }

      const profileIds = profiles.map(p => p.id);
      const shortlistedRows = await prisma.shortlist.findMany({
        where: { accountId, profileId: { in: profileIds } },
        select: { profileId: true },
      });
      const shortlistedIds = new Set(shortlistedRows.map(r => r.profileId));

      const profileSummaries = profiles.map(p => {
      const en = p.translations?.find(t => t.language === 'EN');
      const ta = p.translations?.find(t => t.language === 'TA');

      const firstNameEn = en?.firstName ?? null;
      const lastNameEn = en?.lastName ?? null;
      const firstNameTa = ta?.firstName ?? null;
      const lastNameTa = ta?.lastName ?? null;

      const { currentIsOther: _, ...locationFields } = this.mapLocationFields(p.basic?.currentLocation, 'current', en, ta);

      return {
        id: p.id,
        regNo: p.regNo,
        firstNameEn,
        lastNameEn,
        firstNameTa,
        lastNameTa,
        age: this.calculateAge(p.basic?.dob?.toISOString() ?? ''),
        education: p.professional?.education ?? '',
        community: p.community?.community?.code ?? '',
        jobDetail: p.professional?.jobDetail ?? '',
        ...locationFields,
        profilePhoto: p.photo?.primaryUpload?.objectKey
          ? { url: `/media/${p.photo.primaryUpload.objectKey}`, width: p.photo.primaryUpload.width, height: p.photo.primaryUpload.height }
          : null,
        isShortlisted: shortlistedIds.has(p.id),
      };
    });

    const lastProfile = profiles[profiles.length - 1];
    return {
      profiles: profileSummaries,
      pagination: {
        cursor: hasMore && lastProfile ? lastProfile.id : null,
        hasMore,
        limit,
      },
    };
  }

  private calculateAge(dobString: string): number {
    if (!dobString) return 0;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  // ─────────────────────────────────────────────────────────
  // Shortlist toggle — add/remove a shortlist entry
  // ─────────────────────────────────────────────────────────
  async toggleShortlist(accountId: string, profileId: string, action: 'add' | 'remove') {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { account: { select: { currentState: true } } },
    });

    if (!profile) {
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }
    if (profile.accountId === accountId) {
      throw new AppError(400, ErrorCodes.SHORTLIST_OWN_PROFILE, 'SHORTLIST_OWN_PROFILE');
    }
    if (profile.currentStatus !== 'ACTIVE') {
      throw new AppError(400, ErrorCodes.PROFILE_WRONG_STATUS, 'PROFILE_WRONG_STATUS');
    }
    if (profile.account.currentState === 'SUSPENDED') {
      throw new AppError(400, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }

    return prisma.$transaction(async (tx) => {
      if (action === 'add' && this.membershipGuard) {
        const caps = await this.membershipGuard.resolveCapabilities(accountId);
        if (caps && caps.shortlistLimit >= 0) {
          const current = await tx.shortlist.count({ where: { accountId } });
          if (current >= caps.shortlistLimit) {
            throw new AppError(403, ErrorCodes.MEMBERSHIP_SHORTLIST_LIMIT_REACHED, 'MEMBERSHIP_SHORTLIST_LIMIT_REACHED');
          }
        }
      }

      if (action === 'add') {
        await tx.shortlist.upsert({
          where: { profileId_accountId: { profileId, accountId } },
          create: { profileId, accountId },
          update: {},
        });
        const entry = await tx.shortlist.findUnique({
          where: { profileId_accountId: { profileId, accountId } },
        });
        return { isShortlisted: true, shortlistedAt: entry?.createdAt.toISOString() };
      } else {
        await tx.shortlist.deleteMany({ where: { profileId, accountId } });
        return { isShortlisted: false };
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // Fetch shortlisted profiles for current user
  // ─────────────────────────────────────────────────────────
  async fetchShortlisted(accountId: string, params: any) {
    const { limit = 20, cursor, q } = params;
    const limitNum = Number(limit);
    const safeLimit = Number.isNaN(limitNum) ? 20 : limitNum;

    // Text search on shortlisted profiles
    const profileWhere: any = { currentStatus: 'ACTIVE' };
    if (q && q.trim()) {
      const qTerm = q.trim();
      profileWhere.translations = {
        some: {
          OR: [
            { firstName: { contains: qTerm, mode: 'insensitive' } },
            { lastName: { contains: qTerm, mode: 'insensitive' } },
          ],
        },
      };
    }

    const rows = await prisma.shortlist.findMany({
      where: {
        accountId,
        profile: {
          ...profileWhere,
          account: { currentState: 'ACTIVE' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: safeLimit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        profile: {
          include: {
            basic: { include: { currentLocation: { include: { district: true, taluk: true } } } },
            professional: true,
            community: { include: { community: true } },
            photo: { include: { primaryUpload: { select: { uploadToken: true, objectKey: true, width: true, height: true } } } },
            translations: true,
          },
        },
      },
    });

    const hasMore = rows.length > safeLimit;
    if (hasMore) rows.pop();

    const profileSummaries = rows.map(r => {
      const p = r.profile;
      const en = p.translations?.find(t => t.language === 'EN');
      const ta = p.translations?.find(t => t.language === 'TA');

      const firstNameEn = en?.firstName ?? null;
      const lastNameEn = en?.lastName ?? null;
      const firstNameTa = ta?.firstName ?? null;
      const lastNameTa = ta?.lastName ?? null;

      const { currentIsOther: _, ...locationFields } = this.mapLocationFields(p.basic?.currentLocation, 'current', en, ta);

      return {
        id: p.id,
        regNo: p.regNo,
        firstNameEn,
        lastNameEn,
        firstNameTa,
        lastNameTa,
        age: this.calculateAge(p.basic?.dob?.toISOString() ?? ''),
        education: p.professional?.education ?? '',
        community: p.community?.community?.code ?? '',
        jobDetail: p.professional?.jobDetail ?? '',
        ...locationFields,
        profilePhoto: p.photo?.primaryUpload?.objectKey
          ? { url: `/media/${p.photo.primaryUpload.objectKey}`, width: p.photo.primaryUpload.width, height: p.photo.primaryUpload.height }
          : null,
        isShortlisted: true,
      };
    });

    const lastRow = rows[rows.length - 1];
    return {
      profiles: profileSummaries,
      pagination: {
        cursor: hasMore && lastRow ? lastRow.id : null,
        hasMore,
        limit,
      },
    };
  }

  // ─────────────────────────────────────────────────────────
  // Profile detail — full view
  // ─────────────────────────────────────────────────────────
  async getProfile(accountId: string, profileId: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId)) {
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }

    // Phase 1: lightweight meta fetch for status/ownership check
    // (avoids pulling all relations before we know the viewer's level)
    const meta = await this.repo.findProfileMeta(profileId);
    if (!meta) {
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }

    const owner = meta.accountId === accountId;
    if (meta.currentStatus === 'DELETED') {
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }
    if (meta.currentStatus === 'ARCHIVED' && !owner) {
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }
    if (meta.currentStatus === 'REJECTED' && !owner) {
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }
    if ((meta.currentStatus === 'DRAFT' || meta.currentStatus === 'PENDING') && !owner) {
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }
    if (meta.account.currentState === 'SUSPENDED' && !owner) {
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }

    // ─── Membership: resolve capabilities before full fetch ─
    const levels = ['BASIC', 'EXTENDED', 'ADVANCED', 'FULL'];
    let viewDetails: 'BASIC' | 'EXTENDED' | 'ADVANCED' | 'FULL' = 'FULL';
    let canPrintProfile = false;
    let canPrintHoroscope = false;
    if (!owner && this.membershipGuard) {
      const { allowed } = await this.membershipGuard.checkOpenQuota(accountId);
      if (!allowed) {
        throw new AppError(403, ErrorCodes.MEMBERSHIP_QUOTA_EXCEEDED, 'MEMBERSHIP_QUOTA_EXCEEDED');
      }
      await this.membershipGuard.consumeOpenQuota(accountId, profileId);
      const caps = await this.membershipGuard.resolveCapabilities(accountId);
      viewDetails = caps?.viewDetails ?? 'BASIC';
      canPrintProfile = caps?.printProfile ?? false;
      canPrintHoroscope = caps?.printHoroscope ?? false;
    }
    // Owners always get full access
    if (owner) {
      canPrintProfile = true;
      canPrintHoroscope = true;
      viewDetails = 'FULL';
    }

    // Phase 2: full fetch segmented by membership level
    const profile: any = await this.repo.findFullWithDetails(profileId, viewDetails);
    if (!profile) {
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }

    const b = profile.basic;
    const c = profile.community;
    const prof = profile.professional;
    const f = profile.family;
    const h = profile.horoscope;
    const ph = profile.photo;
    const a = profile.assets;
    const pp = profile.partnerPreference;

    const enTrans = profile.translations?.find((t: any) => t.language === 'EN');
    const taTrans = profile.translations?.find((t: any) => t.language === 'TA');

    const vd = (lvl: string) => levels.indexOf(viewDetails) >= levels.indexOf(lvl);

    const showProfessional = owner || vd('EXTENDED');
    const showFamily = owner || vd('EXTENDED');
    const showHoroscopeLabels = owner || vd('EXTENDED');
    const showHoroscopeCharts = owner || vd('ADVANCED');
    const showContact = owner || vd('FULL');
    const showGallery = owner || vd('EXTENDED');

    const result: any = {
      // Identity
      id: profile.id,
      canPrintProfile,
      canPrintHoroscope,
      regNo: meta.regNo ?? '-',
      status: meta.currentStatus,
      isOwner: owner,
      rejectionReasonEn: meta.rejectionReasonEn ?? null,
      rejectionReasonTa: meta.rejectionReasonTa ?? null,

      // Name
      firstNameEn: enTrans?.firstName ?? null,
      lastNameEn: enTrans?.lastName ?? null,
      firstNameTa: taTrans?.firstName ?? null,
      lastNameTa: taTrans?.lastName ?? null,
      profileFor: b?.profileFor?.code ?? null,

      // Basic
      dob: b?.dob?.toISOString() ?? null,
      gender: b?.gender ?? null,
      diet: b?.diet ?? null,
      bloodGroup: b?.bloodGroup ?? null,
      height: b?.height?.valueCm ?? null,
      weight: b?.weight ?? null,
      complexion: b?.complexion ?? null,
      maritalStatus: b?.maritalStatus ?? null,
      age: null,

      // Location
      ...this.mapLocationFields(b?.currentLocation, 'current', enTrans, taTrans),
      ...this.mapLocationFields(b?.nativeLocation, 'native', enTrans, taTrans),

      // Community
      community: c?.community?.code ?? null,
      caste: c?.caste?.code ?? null,
      kulam: c?.kulam?.code ?? null,
      kuladeivamEn: enTrans?.kuladeivam ?? null,
      kuladeivamTa: taTrans?.kuladeivam ?? null,
      birthPlaceEn: (h?.horoscopeJson as any)?.input?.location?.displayName ?? null,
      birthPlaceTa: (h?.horoscopeJson as any)?.input?.location?.displayName ?? null,
    };

    // --- Sections gated by membership level ---
    // Professional (gated: BASIC→hidden, EXTENDED+→visible)
    if (showProfessional) {
      result.education = prof?.education ?? null;
      result.jobDetail = prof?.jobDetail ?? null;
      result.jobSector = prof?.jobSector?.code ?? null;
      result.companyName = prof?.companyName ?? null;
      result.jobLocationEn = prof?.jobLocation ?? null;
      result.jobLocationTa = prof?.jobLocation ?? null;
      result.salaryMonthly = prof?.monthlySalary ? Number(prof.monthlySalary) : null;
      result.profession = prof?.jobDetail ?? null;
    } else if (prof != null) {
      result.professionalLocked = true;
    }

    // Family (gated: BASIC→hidden, EXTENDED+→visible)
    if (showFamily) {
      result.fatherNameEn = enTrans?.fatherName ?? null;
      result.fatherNameTa = taTrans?.fatherName ?? null;
      result.fatherJob = f?.fatherJob ?? null;
      result.fatherSalary = f?.fatherSalary ?? null;
      result.fatherIsLate = f != null ? !f.fatherAlive : null;
      result.motherNameEn = enTrans?.motherName ?? null;
      result.motherNameTa = taTrans?.motherName ?? null;
      result.motherJob = f?.motherJob ?? null;
      result.motherSalary = f?.motherSalary ?? null;
      result.motherIsLate = f != null ? !f.motherAlive : null;
      result.noOfBrother = f?.noOfBrother ?? null;
      result.noOfSister = f?.noOfSister ?? null;
    } else if (f != null) {
      result.familyLocked = true;
    }

    // Assets (always visible)
    result.residence = a?.residenceType ?? null;
    result.landEn = a?.land ?? null;
    result.otherAssetsEn = a?.otherAssets ?? null;
    result.vehicle = a?.vehicle ?? null;

    // Partner Preference
    result.ageMin = pp?.ageMin ?? null;
    result.ageMax = pp?.ageMax ?? null;
    result.heightMinId = pp?.heightMin?.valueCm ?? null;
    result.heightMaxId = pp?.heightMax?.valueCm ?? null;
    result.monthlySalary = pp?.monthlySalary ? Number(pp.monthlySalary) : null;
    result.expectationNoteEn = pp?.expectationNote ?? null;
    result.preferredLocationEn = pp?.preferredLocation ?? null;

    // Contact (gated: ADVANCED→hidden, FULL/OWNER→visible)
    if (showContact) {
      result.phone = !owner ? profile.account?.credential?.phone ?? null : null;
      result.email = !owner ? profile.account?.credential?.email ?? null : null;
      result.contactLocked = false;
    } else {
      result.contactLocked = true;
    }

    // Horoscope codes (gated: BASIC→hidden, EXTENDED+→visible)
    if (showHoroscopeLabels) {
      result.star = h?.nakshatra?.code ?? null;
      result.rasi = h?.rasi?.code ?? null;
      result.lagnam = h?.lagna?.code ?? null;
    } else if (h != null) {
      result.horoscopeLabelsLocked = true;
    }

    // Horoscope full data (gated: chart images ADVANCED+, full object BASIC/EXTENDED→locked)
    if (h && showHoroscopeCharts) {
      result.horoscope = {
        mode: h.mode ?? null,
        birthTime: (h.horoscopeJson as any)?.input
          ? `${(h.horoscopeJson as any).input.dateOfBirth}T${(h.horoscopeJson as any).input.timeOfBirth}:00.000Z`
          : null,
        birthPlace: (h.horoscopeJson as any)?.input?.location?.displayName ?? null,
        rasi: h.rasiChart?.objectKey
          ? { url: `/media/${h.rasiChart.objectKey}`, width: h.rasiChart.width, height: h.rasiChart.height }
          : null,
        navamsa: h.navamsaChart?.objectKey
          ? { url: `/media/${h.navamsaChart.objectKey}`, width: h.navamsaChart.width, height: h.navamsaChart.height }
          : null,
        horoscopeJson: h.horoscopeJson ?? null,
      };
    } else if (h) {
      result.horoscope = { mode: h.mode, locked: true };
      result.horoscopeLocked = true;
    }

    // Photo
    result.profilePhoto = ph?.primaryUpload?.objectKey
      ? { url: `/media/${ph.primaryUpload.objectKey}`, width: ph.primaryUpload.width, height: ph.primaryUpload.height }
      : null;

    // Gallery (gated: BASIC→hidden, EXTENDED+→visible)
    if (showGallery) {
      result.gallery = ph?.gallery
        ?.map((g: any) => g.upload?.objectKey
          ? { url: `/media/${g.upload.objectKey}`, width: g.upload.width, height: g.upload.height }
          : null)
        .filter(Boolean) ?? [];
    } else if ((ph?.gallery?.length ?? 0) > 0) {
      result.galleryLocked = true;
    }

    return result;
  }
}
