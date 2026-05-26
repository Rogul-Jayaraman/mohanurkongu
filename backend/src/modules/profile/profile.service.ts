import { ProfileRepository } from './profile.repository.js';
import { StorageService } from '../storage/storage.service.js';
import { AccountService } from '../account/account.service.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import { prisma } from '../../database/prisma.js';
import { appConfig } from '../../config/app.config.js';
import type { ProfileStatus } from '@prisma/client';

export class ProfileService {
  private readonly COMPLEXION_MAP: Record<string, string | null> = {
    'VERY_FAIR': 'FAIR',
    'NOT_SPECIFIED': null,
  };

  private readonly RESIDENCE_REVERSE_MAP: Record<string, string> = {
    'OWNED': 'OWN_HOUSE',
  };

  constructor(
    private repo: ProfileRepository,
    private storageService: StorageService,
    private accountService: AccountService,
  ) {}

  private mapBasicData(data: any) {
    const m: any = {};
    if (data.gender !== undefined) m.gender = data.gender;
    if (data.dob !== undefined) m.dob = new Date(data.dob);
    if (data.diet !== undefined) m.diet = data.diet;
    if (data.bloodGroup !== undefined) m.bloodGroup = data.bloodGroup;
    if (data.height !== undefined && data.height !== null) m.heightId = data.height;
    if (data.weight !== undefined) m.weight = data.weight;
    if (data.complexion !== undefined) {
      const mapped = this.COMPLEXION_MAP[data.complexion];
      if (mapped !== undefined) {
        if (mapped !== null) m.complexion = mapped;
      } else {
        m.complexion = data.complexion;
      }
    }
    if (data.maritalStatus !== undefined) m.maritalStatus = data.maritalStatus;
    return m;
  }

  private reverseMapBasic(basic: any) {
    return {
      profileFor: basic.profileForId?.toString() ?? null,
      gender: basic.gender ?? null,
      dob: basic.dob?.toISOString() ?? null,
      diet: basic.diet ?? null,
      bloodGroup: basic.bloodGroup ?? null,
      height: basic.heightId ?? null,
      weight: basic.weight ?? null,
      complexion: basic.complexion ?? null,
      maritalStatus: basic.maritalStatus ?? null,
      currentDistrict: null,
      currentTaluk: null,
      currentCityEn: null,
      currentCityTa: null,
      currentStateEn: null,
      currentStateTa: null,
      currentCountryEn: null,
      currentCountryTa: null,
      nativeDistrict: null,
      nativeTaluk: null,
    };
  }

  private mapProfessionalData(data: any) {
    const m: any = {};
    if (data.education !== undefined) m.education = data.education;
    if (data.jobSectorId !== undefined) m.jobSectorId = data.jobSectorId;
    if (data.jobDetail !== undefined) m.jobDetail = data.jobDetail;
    if (data.companyName !== undefined) m.companyName = data.companyName;
    if (data.jobLocationEn !== undefined) m.jobLocation = data.jobLocationEn;
    if (data.monthlySalary !== undefined) m.monthlySalary = data.monthlySalary;
    return m;
  }

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

  private mapAssetsData(data: any) {
    const m: any = {};
    if (data.landEn !== undefined) m.land = data.landEn;
    if (data.residenceType !== undefined) {
      m.residenceType = data.residenceType;
    }
    if (data.otherAssetsEn !== undefined) m.otherAssets = data.otherAssetsEn;
    if (data.vehicle !== undefined) m.vehicle = data.vehicle;
    return m;
  }

  private reverseMapAssets(assets: any) {
    return {
      landEn: assets.land ?? null,
      landTa: null,
      residenceType: this.RESIDENCE_REVERSE_MAP[assets.residenceType] ?? assets.residenceType ?? null,
      otherAssetsEn: assets.otherAssets ?? null,
      otherAssetsTa: null,
      vehicle: assets.vehicle ?? null,
    };
  }

  private mapPartnerPreferenceData(data: any) {
    const m: any = {};
    if (data.ageMin !== undefined) m.ageMin = data.ageMin;
    if (data.ageMax !== undefined) m.ageMax = data.ageMax;
    if (data.heightMinId != null) m.heightMinId = data.heightMinId;
    if (data.heightMaxId != null) m.heightMaxId = data.heightMaxId;
    if (data.monthlySalary !== undefined) m.monthlySalary = data.monthlySalary;
    if (data.expectationNoteEn !== undefined) m.expectationNote = data.expectationNoteEn;
    if (data.preferredLocationEn !== undefined) m.preferredLocation = data.preferredLocationEn;
    return m;
  }

  private reverseMapPartnerPreference(pp: any) {
    return {
      ageMin: pp.ageMin ?? null,
      ageMax: pp.ageMax ?? null,
      heightMinId: pp.heightMinId ?? null,
      heightMaxId: pp.heightMaxId ?? null,
      monthlySalary: pp.monthlySalary ? Number(pp.monthlySalary) : null,
      expectationNoteEn: pp.expectationNote ?? null,
      expectationNoteTa: null,
      preferredLocationEn: pp.preferredLocation ?? null,
      preferredLocationTa: null,
    };
  }

  private collectUploadIds(dto: any): string[] {
    const ids: string[] = [];
    if (dto.photos?.primaryUploadId) ids.push(dto.photos.primaryUploadId);
    if (dto.photos?.galleryUploadIds) ids.push(...dto.photos.galleryUploadIds.filter(Boolean));
    if (dto.horoscope?.rasiChartUploadId) ids.push(dto.horoscope.rasiChartUploadId);
    if (dto.horoscope?.navamsaChartUploadId) ids.push(dto.horoscope.navamsaChartUploadId);
    return [...new Set(ids)];
  }

  private async validateUploadOwnership(uploadIds: string[], accountId: string) {
    if (uploadIds.length > 0) {
      const owned = await prisma.upload.count({
        where: { id: { in: uploadIds }, ownerAccountId: accountId },
      });
      if (owned !== uploadIds.length) {
        throw new AppError(403, ErrorCodes.AUTH_FORBIDDEN, 'One or more uploads do not belong to you');
      }
    }
  }

  private async validateCreateProfile(dto: any, accountId: string) {
    const { translations, photos, ...sections } = dto;

    if (!sections.basic) {
      throw new AppError(400, ErrorCodes.PROFILE_MISSING_BASIC, 'PROFILE_MISSING_BASIC');
    }
    if (!sections.community) {
      throw new AppError(400, ErrorCodes.PROFILE_MISSING_COMMUNITY, 'PROFILE_MISSING_COMMUNITY');
    }
    if (!photos?.primaryUploadId) {
      throw new AppError(400, ErrorCodes.PROFILE_MISSING_PHOTO, 'PROFILE_MISSING_PHOTO');
    }
    const enTranslation = translations?.find((t: any) => t.language === 'EN');
    if (!enTranslation?.firstName || enTranslation.firstName.trim().length === 0) {
      throw new AppError(400, ErrorCodes.PROFILE_MISSING_DEFAULT_TRANSLATION, 'PROFILE_MISSING_DEFAULT_TRANSLATION');
    }

    const uploadIds = this.collectUploadIds(dto);
    await this.validateUploadOwnership(uploadIds, accountId);
  }

  private async upsertSections(tx: any, profileId: string, sections: any, photos: any, translations: any) {
    if (sections.basic !== undefined && sections.basic !== null) {
      const data = this.mapBasicData(sections.basic);
      if (data.heightId !== undefined) {
        const h = await tx.height.findUnique({ where: { valueCm: data.heightId } });
        if (!h) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid height');
        data.heightId = h.id;
      }
      const locationFields = ['currentDistrict', 'currentTaluk', 'currentCityEn', 'currentCityTa',
        'currentStateEn', 'currentStateTa', 'currentCountryEn', 'currentCountryTa',
        'nativeDistrict', 'nativeTaluk'];
      const hasLocationData = locationFields.some(f => sections.basic[f] !== undefined && sections.basic[f] !== null);
      if (hasLocationData) {
        for (const prefix of ['current', 'native']) {
          const district = sections.basic[`${prefix}District`];
          if (district !== undefined && district !== null) {
            const isOther = district === 'OTHER';
            let locationId;
            if (isOther) {
              const loc = await tx.location.create({ data: { isOther: true } });
              locationId = loc.id;
              for (const entry of [{ lang: 'EN', suffix: 'En' }, { lang: 'TA', suffix: 'Ta' }]) {
                const transData: Record<string, any> = {};
                const city = sections.basic[`${prefix}City${entry.suffix}`];
                const state = sections.basic[`${prefix}State${entry.suffix}`];
                const country = sections.basic[`${prefix}Country${entry.suffix}`];
                if (city !== undefined) transData[`${prefix}City`] = city;
                if (state !== undefined) transData[`${prefix}State`] = state;
                if (country !== undefined) transData[`${prefix}Country`] = country;
                if (Object.keys(transData).length > 0) {
                  await tx.profileTranslation.upsert({
                    where: { profileId_language: { profileId, language: entry.lang } },
                    create: { profile: { connect: { id: profileId } }, language: entry.lang, ...transData },
                    update: transData,
                  });
                }
              }
            } else {
              const d = await tx.district.findUnique({ where: { code: district } });
              const talukCode = sections.basic[`${prefix}Taluk`];
              const t = talukCode
                ? await tx.taluk.findFirst({ where: { code: talukCode, districtId: d?.id } })
                : null;
              const loc = await tx.location.create({
                data: { isOther: false, districtId: d?.id ?? null, talukId: t?.id ?? null },
              });
              locationId = loc.id;
              for (const entry of [{ lang: 'EN', suffix: 'En' }, { lang: 'TA', suffix: 'Ta' }]) {
                const transData: Record<string, any> = {};
                const city = sections.basic[`${prefix}City${entry.suffix}`];
                const state = sections.basic[`${prefix}State${entry.suffix}`];
                const country = sections.basic[`${prefix}Country${entry.suffix}`];
                if (city !== undefined) transData[`${prefix}City`] = city;
                if (state !== undefined) transData[`${prefix}State`] = state;
                if (country !== undefined) transData[`${prefix}Country`] = country;
                if (Object.keys(transData).length > 0) {
                  await tx.profileTranslation.upsert({
                    where: { profileId_language: { profileId, language: entry.lang } },
                    create: { profile: { connect: { id: profileId } }, language: entry.lang, ...transData },
                    update: transData,
                  });
                }
              }
            }
            if (locationId) {
              (data as any)[`${prefix}LocationId`] = locationId;
            }
          }
        }
      }
      if (Object.keys(data).length > 0) {
        if (sections.basic.profileFor && typeof sections.basic.profileFor === 'string') {
          const pf = await tx.profileFor.findUnique({ where: { code: sections.basic.profileFor } });
          if (!pf) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid profileFor');
          data.profileForId = pf.id;
        }
        const required = ['profileForId', 'gender', 'dob', 'diet', 'heightId'];
        const hasRequired = required.every(f => data[f] !== undefined && data[f] !== null);
        if (hasRequired) {
          const { profileForId, heightId, currentLocationId, nativeLocationId, ...rest } = data;
          await tx.profileBasic.upsert({
            where: { profileId },
            create: {
              profile: { connect: { id: profileId } },
              profileFor: { connect: { id: profileForId } },
              height: { connect: { id: heightId } },
              ...(currentLocationId != null ? { currentLocation: { connect: { id: currentLocationId } } } : {}),
              ...(nativeLocationId != null ? { nativeLocation: { connect: { id: nativeLocationId } } } : {}),
              ...rest,
            },
            update: data,
          });
        }
      }
    }

    if (sections.community !== undefined && sections.community !== null) {
      const d = sections.community;
      const cleaned: any = {};
      if (d.community !== undefined && d.community !== null) {
        const com = await tx.community.findUnique({ where: { code: d.community } });
        if (!com) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid community');
        cleaned.communityId = com.id;
      }
      if (d.communityId !== undefined) cleaned.communityId = d.communityId;
      if (d.caste !== undefined && d.caste !== null) {
        if (cleaned.communityId != null) {
          const ca = await tx.caste.findFirst({ where: { communityId: cleaned.communityId, code: d.caste } });
          if (!ca) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid caste');
          cleaned.casteId = ca.id;
        } else {
          const ca = await tx.caste.findFirst({ where: { code: d.caste } });
          if (ca) cleaned.casteId = ca.id;
        }
      }
      if (d.casteId !== undefined) cleaned.casteId = d.casteId;
      if (d.kulam !== undefined && d.kulam !== null) {
        const kl = await tx.kulam.findUnique({ where: { code: d.kulam } });
        if (!kl) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid kulam');
        cleaned.kulamId = kl.id;
      }
      if (d.kulamId !== undefined) cleaned.kulamId = d.kulamId;
      if (Object.keys(cleaned).length > 0 && cleaned.communityId != null && cleaned.casteId != null) {
        const { communityId, casteId, kulamId, ...rest } = cleaned;
        await tx.profileCommunity.upsert({
          where: { profileId },
          create: {
            profile: { connect: { id: profileId } },
            community: { connect: { id: communityId } },
            caste: { connect: { id: casteId } },
            ...(kulamId != null ? { kulam: { connect: { id: kulamId } } } : {}),
            ...rest,
          },
          update: cleaned,
        });
      }
    }

    if (sections.professional !== undefined && sections.professional !== null) {
      const d = sections.professional;
      const data: any = {};
      if (d.education !== undefined) data.education = d.education;
      if (d.jobSector !== undefined && d.jobSector !== null) {
        const js = await tx.jobSector.findUnique({ where: { code: d.jobSector } });
        if (!js) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid jobSector');
        data.jobSectorId = js.id;
      }
      if (d.jobSectorId !== undefined) data.jobSectorId = d.jobSectorId;
      if (d.jobDetail !== undefined) data.jobDetail = d.jobDetail;
      if (d.companyName !== undefined) data.companyName = d.companyName;
      if (d.jobLocationEn !== undefined) data.jobLocation = d.jobLocationEn;
      if (d.monthlySalary !== undefined) data.monthlySalary = d.monthlySalary;
      if (Object.keys(data).length > 0) {
        const { jobSectorId, ...rest } = data;
        await tx.profileProfessional.upsert({
          where: { profileId },
          create: {
            profile: { connect: { id: profileId } },
            ...(jobSectorId != null ? { jobSector: { connect: { id: jobSectorId } } } : {}),
            ...rest,
          },
          update: data,
        });
      }
    }

    if (sections.family !== undefined && sections.family !== null) {
      const data = sections.family;
      const cleaned: any = {};
      if (data.fatherAlive !== undefined) cleaned.fatherAlive = data.fatherAlive;
      if (data.fatherName !== undefined) cleaned.fatherName = data.fatherName;
      if (data.fatherJob !== undefined) cleaned.fatherJob = data.fatherJob;
      if (data.fatherSalary !== undefined) cleaned.fatherSalary = data.fatherSalary;
      if (data.motherAlive !== undefined) cleaned.motherAlive = data.motherAlive;
      if (data.motherName !== undefined) cleaned.motherName = data.motherName;
      if (data.motherJob !== undefined) cleaned.motherJob = data.motherJob;
      if (data.motherSalary !== undefined) cleaned.motherSalary = data.motherSalary;
      if (data.noOfBrother !== undefined) cleaned.noOfBrother = data.noOfBrother;
      if (data.noOfSister !== undefined) cleaned.noOfSister = data.noOfSister;
      if (Object.keys(cleaned).length > 0) {
        await tx.profileFamily.upsert({
          where: { profileId },
          create: { profile: { connect: { id: profileId } }, ...cleaned },
          update: cleaned,
        });
      }
    }

    if (sections.horoscope !== undefined && sections.horoscope !== null) {
      const data = sections.horoscope;
      const cleaned: any = {};
      if (data.mode !== undefined) {
        cleaned.mode = data.mode;
      }
      if (data.rasi !== undefined && data.rasi !== null) {
        const r = await tx.rasi.findUnique({ where: { code: data.rasi } });
        if (!r) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid rasi');
        cleaned.rasiId = r.id;
      }
      if (data.rasiId !== undefined) cleaned.rasiId = data.rasiId;
      if (data.nakshatra !== undefined && data.nakshatra !== null) {
        const n = await tx.nakshatra.findUnique({ where: { code: data.nakshatra } });
        if (!n) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid nakshatra');
        cleaned.nakshatraId = n.id;
      }
      if (data.nakshatraId !== undefined) cleaned.nakshatraId = data.nakshatraId;
      if (data.lagna !== undefined && data.lagna !== null) {
        const l = await tx.lagna.findUnique({ where: { code: data.lagna } });
        if (!l) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid lagna');
        cleaned.lagnaId = l.id;
      }
      if (data.lagnaId !== undefined) cleaned.lagnaId = data.lagnaId;
      if (data.rasiChartUploadId !== undefined) cleaned.rasiChartUploadId = data.rasiChartUploadId;
      if (data.navamsaChartUploadId !== undefined) cleaned.navamsaChartUploadId = data.navamsaChartUploadId;
      if (data.horoscopeJson !== undefined) cleaned.horoscopeJson = data.horoscopeJson;
      if (Object.keys(cleaned).length > 0) {
        if (cleaned.mode == null || cleaned.mode === 'none') return;
        const { rasiId, nakshatraId, lagnaId, rasiChartUploadId, navamsaChartUploadId, ...rest } = cleaned;
        await tx.profileHoroscope.upsert({
          where: { profileId },
          create: {
            profile: { connect: { id: profileId } },
            ...(rasiId != null ? { rasi: { connect: { id: rasiId } } } : {}),
            ...(nakshatraId != null ? { nakshatra: { connect: { id: nakshatraId } } } : {}),
            ...(lagnaId != null ? { lagna: { connect: { id: lagnaId } } } : {}),
            ...(rasiChartUploadId != null ? { rasiChart: { connect: { id: rasiChartUploadId } } } : {}),
            ...(navamsaChartUploadId != null ? { navamsaChart: { connect: { id: navamsaChartUploadId } } } : {}),
            ...rest,
          },
          update: cleaned,
        });
      }
    }

    if (photos !== undefined && photos !== null) {
      const photoData: any = {};
      if (photos.primaryUploadId !== undefined) photoData.primaryUploadId = photos.primaryUploadId;

      if (Object.keys(photoData).length > 0 || photos.galleryUploadIds) {
        const { primaryUploadId, ...rest } = photoData;
        const profilePhoto = await tx.profilePhoto.upsert({
          where: { profileId },
          create: {
            profile: { connect: { id: profileId } },
            ...(primaryUploadId != null ? { primaryUpload: { connect: { id: primaryUploadId } } } : {}),
            ...rest,
          },
          update: photoData,
        });

        if (photos.galleryUploadIds) {
          const newIds = photos.galleryUploadIds.filter(Boolean) as string[];
          const existing = await tx.profileGalleryPhoto.findMany({
            where: { profilePhotoId: profilePhoto.id },
          });
          const existingIds = existing.map((g: { uploadId: string }) => g.uploadId);
          const toRemove = existing.filter((g: { uploadId: string }) => !newIds.includes(g.uploadId));
          const toAdd = newIds.filter((id: string) => !existingIds.includes(id));

          if (toRemove.length > 0) {
            await tx.profileGalleryPhoto.deleteMany({
              where: { id: { in: toRemove.map((g: { id: string }) => g.id) } },
            });
          }

          for (const uploadId of toAdd) {
            await tx.profileGalleryPhoto.create({
              data: { profilePhotoId: profilePhoto.id, uploadId },
            });
          }
        }
      }
    }

    if (sections.assets !== undefined && sections.assets !== null) {
      const data = this.mapAssetsData(sections.assets);
      if (Object.keys(data).length > 0) {
        await tx.profileAssets.upsert({
          where: { profileId },
          create: { profile: { connect: { id: profileId } }, ...data },
          update: data,
        });
      }
    }

    if (sections.partnerPreference !== undefined && sections.partnerPreference !== null) {
      const data = this.mapPartnerPreferenceData(sections.partnerPreference);
      for (const key of ['heightMinId', 'heightMaxId']) {
        if (data[key] != null) {
          const h = await tx.height.findUnique({ where: { valueCm: data[key] } });
          if (!h) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, `Invalid ${key}`);
          data[key] = h.id;
        }
      }
      if (Object.keys(data).length > 0) {
        const { heightMinId, heightMaxId, ...rest } = data;
        await tx.partnerPreference.upsert({
          where: { profileId },
          create: {
            profile: { connect: { id: profileId } },
            ...(heightMinId != null ? { heightMin: { connect: { id: heightMinId } } } : {}),
            ...(heightMaxId != null ? { heightMax: { connect: { id: heightMaxId } } } : {}),
            ...rest,
          },
          update: data,
        });
      }
    }

    if (translations && Array.isArray(translations)) {
      for (const t of translations) {
        const transData: any = {};
        if (t.firstName !== undefined) transData.firstName = t.firstName;
        if (t.lastName !== undefined) transData.lastName = t.lastName;
        if (t.kuladeivam !== undefined) transData.kuladeivam = t.kuladeivam;
        if (t.fatherName !== undefined) transData.fatherName = t.fatherName;
        if (t.motherName !== undefined) transData.motherName = t.motherName;
        if (t.jobLocation !== undefined) transData.jobLocation = t.jobLocation;
        if (t.currentCity !== undefined) transData.currentCity = t.currentCity;
        if (t.currentState !== undefined) transData.currentState = t.currentState;
        if (t.currentCountry !== undefined) transData.currentCountry = t.currentCountry;
        if (t.nativeCity !== undefined) transData.nativeCity = t.nativeCity;
        if (t.nativeState !== undefined) transData.nativeState = t.nativeState;
        if (t.nativeCountry !== undefined) transData.nativeCountry = t.nativeCountry;
        if (Object.keys(transData).length > 0) {
          await tx.profileTranslation.upsert({
            where: { profileId_language: { profileId, language: t.language } },
            create: { profile: { connect: { id: profileId } }, language: t.language, ...transData },
            update: transData,
          });
        }
      }
    }
  }

  async saveDraft(accountId: string, dto: any) {
    const { profileId: existingProfileId, translations, photos, ...sections } = dto;

    const uploadIds = this.collectUploadIds(dto);
    await this.validateUploadOwnership(uploadIds, accountId);

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

      await this.upsertSections(tx, profile.id, sections, photos, translations);

      const historyCount = await tx.profileStateHistory.count({
        where: { profileId: profile.id },
      });
      if (historyCount === 0) {
        await tx.profileStateHistory.create({
          data: { profileId: profile.id, changedByAccountId: accountId, toStatus: 'DRAFT' },
        });
      }

      if (uploadIds.length > 0) {
        await this.storageService.bulkTransitionStatus(uploadIds, ['TEMP', 'DRAFT'], 'DRAFT', tx);
      }

      return { profileId: profile.id };
    });
  }

  async createProfile(accountId: string, dto: any) {
    const { profileId: existingProfileId, translations, photos, ...sections } = dto;

    await this.validateCreateProfile(dto, accountId);

    const regNo = await this.accountService.generateRegNo();
    const uploadIds = this.collectUploadIds(dto);

    return await prisma.$transaction(async (tx) => {
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
            visibility: 'PRIVATE',
            regNo,
          },
        });
      } else {
        profile = await this.repo.createProfile(tx, accountId, 'PENDING' as ProfileStatus);
        await tx.profile.update({ where: { id: profile.id }, data: { regNo } });
      }

      await this.upsertSections(tx, profile.id, sections, photos, translations);

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
        await this.storageService.bulkTransitionStatus(uploadIds, ['TEMP', 'DRAFT'], 'ACTIVE', tx);
      }

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
        horoscope: { include: { rasi: true, nakshatra: true, lagna: true } },
        photo: { include: { gallery: true } },
        assets: true,
        partnerPreference: true,
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
        horoscopeJson: profile.horoscope.horoscopeJson ?? null,
      };
    }

    if (profile.photo) {
      dto.photos = {
        primaryUploadId: profile.photo.primaryUploadId ?? null,
        galleryUploadIds: profile.photo.gallery.map((g: any) => g.uploadId),
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

  async approveProfile(adminId: string, profileId: string) {
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, currentStatus: 'PENDING' },
    });

    if (!profile) {
      throw new AppError(400, ErrorCodes.PROFILE_WRONG_STATUS, 'Profile is not in PENDING status');
    }

    const regNo = profile.regNo || await this.accountService.generateRegNo();

    return await prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: profileId },
        data: {
          currentStatus: 'ACTIVE' as ProfileStatus,
          regNo: regNo || undefined,
          activatedAt: new Date(),
          approvedAt: new Date(),
          approvedBy: adminId,
        },
      });

      await tx.profileStateHistory.create({
        data: {
          profileId,
          changedByAccountId: adminId,
          fromStatus: 'PENDING',
          toStatus: 'ACTIVE',
        },
      });

      return { profileId, regNo: regNo || null, status: 'ACTIVE' };
    });
  }

  async rejectProfile(adminId: string, profileId: string, dto: { reasonEn: string; reasonTa?: string }) {
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, currentStatus: 'PENDING' },
    });

    if (!profile) {
      throw new AppError(400, ErrorCodes.PROFILE_WRONG_STATUS, 'Profile is not in PENDING status');
    }

    return await prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: profileId },
        data: {
          currentStatus: 'REJECTED' as ProfileStatus,
          rejectionReasonEn: dto.reasonEn,
          rejectionReasonTa: dto.reasonTa || null,
          rejectedAt: new Date(),
          rejectedBy: adminId,
        },
      });

      await tx.profileStateHistory.create({
        data: {
          profileId,
          changedByAccountId: adminId,
          fromStatus: 'PENDING',
          toStatus: 'REJECTED',
        },
      });

      return { profileId, status: 'REJECTED' };
    });
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

    await prisma.$transaction(async (tx) => {
      if (uniqueUploadIds.length > 0) {
        await this.storageService.hardDeleteMany(uniqueUploadIds, accountId);
      }
      await tx.profile.delete({ where: { id: profile.id } });
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
  async getMyProfiles(accountId: string) {
    const profiles = await this.repo.findAllByAccountId(accountId);
    return profiles.map(p => {
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

        profilePhoto: p.photo?.primaryUploadId ?? null,

        ...this.mapLocationFields(p.basic?.currentLocation, 'current', en, ta),
      };
    });
  }

  // ─────────────────────────────────────────────────────────
  // Profile detail — full view
  // ─────────────────────────────────────────────────────────
  async getProfile(accountId: string, profileId: string) {
    const profile = await this.repo.findFullWithDetails(profileId);
    if (!profile) {
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }

    const owner = profile.accountId === accountId;
    if (profile.currentStatus === 'DELETED' || profile.currentStatus === 'INACTIVE') {
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }
    if (profile.currentStatus === 'REJECTED' && !owner) {
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }
    if ((profile.currentStatus === 'DRAFT' || profile.currentStatus === 'PENDING') && !owner) {
      throw new AppError(404, ErrorCodes.PROFILE_NOT_FOUND, 'PROFILE_NOT_FOUND');
    }

    const b = profile.basic;
    const c = profile.community;
    const prof = profile.professional;
    const f = profile.family;
    const h = profile.horoscope;
    const ph = profile.photo;
    const a = profile.assets;

    const enTrans = profile.translations?.find(t => t.language === 'EN');
    const taTrans = profile.translations?.find(t => t.language === 'TA');

    return {
      // Identity
      id: profile.id,
      regNo: profile.regNo ?? '-',
      status: profile.currentStatus,
      isOwner: owner,
      adminVerified: null,
      rejectionReasonEn: profile.rejectionReasonEn ?? null,
      rejectionReasonTa: profile.rejectionReasonTa ?? null,
      statusReasonEn: null,
      statusReasonTa: null,
      svgDataEn: null,
      svgDataTa: null,
      dosham: null,

      // Name
      firstNameEn: enTrans?.firstName ?? null,
      lastNameEn: enTrans?.lastName ?? null,
      firstNameTa: taTrans?.firstName ?? null,
      lastNameTa: taTrans?.lastName ?? null,
      name: null,
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

      // Current location — conditional on isOther
      ...this.mapLocationFields(b?.currentLocation, 'current', enTrans, taTrans),

      // Native location — conditional on isOther
      ...this.mapLocationFields(b?.nativeLocation, 'native', enTrans, taTrans),

      // Community
      community: c?.community?.code ?? null,
      caste: c?.caste?.code ?? null,
      kulam: c?.kulam?.code ?? null,
      religion: null,
      subCaste: null,
      gothram: null,
      kuladeivamEn: enTrans?.kuladeivam ?? null,
      kuladeivamTa: taTrans?.kuladeivam ?? null,
      birthPlaceEn: (h?.horoscopeJson as any)?.input?.location?.displayName ?? null,
      birthPlaceTa: (h?.horoscopeJson as any)?.input?.location?.displayName ?? null,

      // Professional
      education: prof?.education ?? null,
      jobDetail: prof?.jobDetail ?? null,
      jobSector: prof?.jobSector?.code ?? null,
      companyName: prof?.companyName ?? null,
      jobLocationEn: prof?.jobLocation ?? null,
      jobLocationTa: prof?.jobLocation ?? null,
      salaryMonthly: prof?.monthlySalary ? Number(prof.monthlySalary) : null,
      profession: prof?.jobDetail ?? null,

      // Family
      fatherNameEn: enTrans?.fatherName ?? null,
      fatherNameTa: taTrans?.fatherName ?? null,
      fatherJob: f?.fatherJob ?? null,
      fatherSalary: f?.fatherSalary ?? null,
      fatherIsLate: f != null ? !f.fatherAlive : null,
      motherNameEn: enTrans?.motherName ?? null,
      motherNameTa: taTrans?.motherName ?? null,
      motherJob: f?.motherJob ?? null,
      motherSalary: f?.motherSalary ?? null,
      motherIsLate: f != null ? !f.motherAlive : null,
      noOfBrother: f?.noOfBrother ?? null,
      noOfBrothers: f?.noOfBrother ?? null,
      noOfSister: f?.noOfSister ?? null,
      noOfSisters: f?.noOfSister ?? null,

      // Assets
      residence: a?.residenceType ?? null,
      propertyDetailsEn: a?.land ?? a?.otherAssets ?? null,
      propertyDetailsTa: a?.land ?? a?.otherAssets ?? null,
      expectationEn: null,
      expectationTa: null,

      // Horoscope — lookup codes (top-level for display labels)
      star: h?.nakshatra?.code ?? null,
      rasi: h?.rasi?.code ?? null,
      lagnam: h?.lagna?.code ?? null,

      // Horoscope — sub-object with resolved chart image URLs
      horoscope: h ? {
        mode: h.mode ?? null,
        birthTime: (h.horoscopeJson as any)?.input
          ? `${(h.horoscopeJson as any).input.dateOfBirth}T${(h.horoscopeJson as any).input.timeOfBirth}:00.000Z`
          : null,
        birthPlace: (h.horoscopeJson as any)?.input?.location?.displayName ?? null,
        rasiChartUploadId: h.rasiChartUploadId ?? null,
        navamsaChartUploadId: h.navamsaChartUploadId ?? null,
        horoscopeJson: h.horoscopeJson ?? null,
      } : null,

      // Photo — raw uploadIds (controller resolves to URLs)
      profilePhoto: ph?.primaryUploadId ?? null,
      photo: null,
      gallery: ph?.gallery?.map(g => g.upload.id) ?? [],
    };
  }
}
