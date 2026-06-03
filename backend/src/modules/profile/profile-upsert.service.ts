import { prisma } from '../../database/prisma.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';

export class ProfileUpsertService {
  private readonly COMPLEXION_MAP: Record<string, string | null> = {
    'VERY_FAIR': 'FAIR',
    'NOT_SPECIFIED': null,
  };

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

  async resolveUploadTokenField(value: string | undefined): Promise<string | undefined> {
    if (!value) return undefined;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return value;
    const upload = await prisma.upload.findUnique({ where: { uploadToken: value } });
    if (!upload) throw new AppError(400, ErrorCodes.UPLOAD_NOT_FOUND, ErrorCodes.UPLOAD_NOT_FOUND);
    return upload.id;
  }

  async resolveUploadTokensInDto(dto: any): Promise<void> {
    if (dto.photos) {
      dto.photos.primaryUploadId = await this.resolveUploadTokenField(dto.photos.primaryUploadId);
      if (dto.photos.galleryUploadIds) {
        dto.photos.galleryUploadIds = await Promise.all(
          dto.photos.galleryUploadIds.map((id: string) => this.resolveUploadTokenField(id)),
        );
      }
    }
    if (dto.horoscope) {
      dto.horoscope.rasiChartUploadId = await this.resolveUploadTokenField(dto.horoscope.rasiChartUploadId);
      dto.horoscope.navamsaChartUploadId = await this.resolveUploadTokenField(dto.horoscope.navamsaChartUploadId);
    }
  }

  collectUploadIds(dto: any): string[] {
    const ids: string[] = [];
    if (dto.photos?.primaryUploadId) ids.push(dto.photos.primaryUploadId);
    if (dto.photos?.galleryUploadIds) ids.push(...dto.photos.galleryUploadIds.filter(Boolean));
    if (dto.horoscope?.rasiChartUploadId) ids.push(dto.horoscope.rasiChartUploadId);
    if (dto.horoscope?.navamsaChartUploadId) ids.push(dto.horoscope.navamsaChartUploadId);
    return [...new Set(ids)];
  }

  async validateUploadOwnership(uploadIds: string[], accountId: string) {
    if (uploadIds.length > 0) {
      const owned = await prisma.upload.count({
        where: { id: { in: uploadIds }, ownerAccountId: accountId },
      });
      if (owned !== uploadIds.length) {
        throw new AppError(403, ErrorCodes.AUTH_FORBIDDEN, ErrorCodes.AUTH_FORBIDDEN);
      }
    }
  }

  async upsertSections(tx: any, profileId: string, sections: any, photos: any, translations: any, isUpdate = false) {
    if (sections.basic !== undefined && sections.basic !== null) {
      const data = this.mapBasicData(sections.basic);
      if (data.heightId !== undefined && !(isUpdate && data.heightId === '')) {
        const h = await tx.height.findUnique({ where: { valueCm: data.heightId } });
        if (!h) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, ErrorCodes.VALIDATION_ERROR);
        data.heightId = h.id;
      } else if (isUpdate && data.heightId === '') {
        delete data.heightId;
      }
      const locationFields = ['currentDistrict', 'currentTaluk', 'currentCityEn', 'currentCityTa',
        'currentStateEn', 'currentStateTa', 'currentCountryEn', 'currentCountryTa',
        'nativeDistrict', 'nativeTaluk'];
      const hasLocationData = locationFields.some(f => sections.basic[f] !== undefined && sections.basic[f] !== null);
      if (hasLocationData) {
        for (const prefix of ['current', 'native']) {
          const district = sections.basic[`${prefix}District`];
          if (district !== undefined && district !== null && !(isUpdate && district === '')) {
            const isOther = district === 'OTHER';
            let locationId;
            if (isOther) {
              const loc = await tx.location.create({ data: { isOther: true } });
              locationId = loc.id;
              for (const entry of [{ lang: 'EN', suffix: 'En' }, { lang: 'TA', suffix: 'Ta' }]) {
                const city = sections.basic[`${prefix}City${entry.suffix}`];
                const state = sections.basic[`${prefix}State${entry.suffix}`];
                const country = sections.basic[`${prefix}Country${entry.suffix}`];
                await tx.profileTranslation.upsert({
                  where: { profileId_language: { profileId, language: entry.lang } },
                  create: {
                    profile: { connect: { id: profileId } },
                    language: entry.lang,
                    [`${prefix}City`]: city ?? null,
                    [`${prefix}State`]: state ?? null,
                    [`${prefix}Country`]: country ?? null,
                  },
                  update: {
                    [`${prefix}City`]: city ?? null,
                    [`${prefix}State`]: state ?? null,
                    [`${prefix}Country`]: country ?? null,
                  },
                });
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
                const city = sections.basic[`${prefix}City${entry.suffix}`];
                const state = sections.basic[`${prefix}State${entry.suffix}`];
                const country = sections.basic[`${prefix}Country${entry.suffix}`];
                await tx.profileTranslation.upsert({
                  where: { profileId_language: { profileId, language: entry.lang } },
                  create: {
                    profile: { connect: { id: profileId } },
                    language: entry.lang,
                    [`${prefix}City`]: city ?? null,
                    [`${prefix}State`]: state ?? null,
                    [`${prefix}Country`]: country ?? null,
                  },
                  update: {
                    [`${prefix}City`]: city ?? null,
                    [`${prefix}State`]: state ?? null,
                    [`${prefix}Country`]: country ?? null,
                  },
                });
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
          if (!pf) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, ErrorCodes.VALIDATION_ERROR);
          data.profileForId = pf.id;
        }
        const existingBasic = await tx.profileBasic.findUnique({ where: { profileId } });
        if (existingBasic) {
          await tx.profileBasic.update({ where: { profileId }, data });
        } else {
          const required = ['profileForId', 'gender', 'dob', 'diet', 'heightId'];
          const hasRequired = required.every(f => data[f] !== undefined && data[f] !== null);
          if (!hasRequired) {
            throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Missing required basic fields');
          }
          const { profileForId, heightId, currentLocationId, nativeLocationId, ...rest } = data;
          await tx.profileBasic.create({
            data: {
              profile: { connect: { id: profileId } },
              profileFor: { connect: { id: profileForId } },
              height: { connect: { id: heightId } },
              ...(currentLocationId != null ? { currentLocation: { connect: { id: currentLocationId } } } : {}),
              ...(nativeLocationId != null ? { nativeLocation: { connect: { id: nativeLocationId } } } : {}),
              ...rest,
            },
          });
        }
      }
    }

    if (sections.community !== undefined && sections.community !== null) {
      const d = sections.community;
      const cleaned: any = {};
      if (d.community !== undefined && d.community !== null && !(isUpdate && d.community === '')) {
        const com = await tx.community.findUnique({ where: { code: d.community } });
        if (!com) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, ErrorCodes.VALIDATION_ERROR);
        cleaned.communityId = com.id;
      }
      if (d.communityId !== undefined) cleaned.communityId = d.communityId;
      if (d.caste !== undefined && d.caste !== null && !(isUpdate && d.caste === '')) {
        if (cleaned.communityId != null) {
          const ca = await tx.caste.findFirst({ where: { communityId: cleaned.communityId, code: d.caste } });
          if (!ca) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, ErrorCodes.VALIDATION_ERROR);
          cleaned.casteId = ca.id;
        } else {
          const ca = await tx.caste.findFirst({ where: { code: d.caste } });
          if (ca) cleaned.casteId = ca.id;
        }
      }
      if (d.casteId !== undefined) cleaned.casteId = d.casteId;
      if (d.kulam !== undefined && d.kulam !== null && !(isUpdate && d.kulam === '')) {
        const kl = await tx.kulam.findUnique({ where: { code: d.kulam } });
        if (!kl) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, ErrorCodes.VALIDATION_ERROR);
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
      if (d.jobSector !== undefined && d.jobSector !== null && !(isUpdate && d.jobSector === '')) {
        const js = await tx.jobSector.findUnique({ where: { code: d.jobSector } });
        if (!js) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, ErrorCodes.VALIDATION_ERROR);
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
      if (data.rasi !== undefined && data.rasi !== null && !(isUpdate && data.rasi === '')) {
        const r = await tx.rasi.findUnique({ where: { code: data.rasi } });
        if (!r) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, ErrorCodes.VALIDATION_ERROR);
        cleaned.rasiId = r.id;
      }
      if (data.rasiId !== undefined) cleaned.rasiId = data.rasiId;
      if (data.nakshatra !== undefined && data.nakshatra !== null && !(isUpdate && data.nakshatra === '')) {
        const n = await tx.nakshatra.findUnique({ where: { code: data.nakshatra } });
        if (!n) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, ErrorCodes.VALIDATION_ERROR);
        cleaned.nakshatraId = n.id;
      }
      if (data.nakshatraId !== undefined) cleaned.nakshatraId = data.nakshatraId;
      if (data.lagna !== undefined && data.lagna !== null && !(isUpdate && data.lagna === '')) {
        const l = await tx.lagna.findUnique({ where: { code: data.lagna } });
        if (!l) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, ErrorCodes.VALIDATION_ERROR);
        cleaned.lagnaId = l.id;
      }
      if (data.lagnaId !== undefined) cleaned.lagnaId = data.lagnaId;
      if (data.rasiChartUploadId !== undefined) cleaned.rasiChartUploadId = data.rasiChartUploadId;
      if (data.navamsaChartUploadId !== undefined) cleaned.navamsaChartUploadId = data.navamsaChartUploadId;
      if (data.horoscopeJson !== undefined) cleaned.horoscopeJson = data.horoscopeJson;
      if (cleaned.mode != null && cleaned.mode !== 'none' && Object.keys(cleaned).length > 0) {
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
        if (data[key] != null && !(isUpdate && data[key] === '')) {
          const h = await tx.height.findUnique({ where: { valueCm: data[key] } });
          if (!h) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, ErrorCodes.VALIDATION_ERROR);
          data[key] = h.id;
        } else if (isUpdate && data[key] === '') {
          delete data[key];
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
        console.log('[upsertSections] processing translation lang=%s firstName=%s lastName=%s', t.language, t.firstName, t.lastName);
        const createData: any = {
          profile: { connect: { id: profileId } },
          language: t.language,
        };
        const updateData: any = {};
        const translationFields = ['firstName', 'lastName', 'kuladeivam', 'fatherName', 'motherName', 'jobLocation', 'currentCity', 'currentState', 'currentCountry', 'nativeCity', 'nativeState', 'nativeCountry'];
        for (const field of translationFields) {
          if (t[field] !== undefined) {
            createData[field] = t[field];
            updateData[field] = t[field];
          }
        }
        console.log('[upsertSections] updateData keys=%s firstName=%s', Object.keys(updateData).join(','), updateData.firstName);
        const result = await tx.profileTranslation.upsert({
          where: { profileId_language: { profileId, language: t.language } },
          create: createData,
          update: updateData,
        });
        console.log('[upsertSections] upsert result id=%s firstName=%s', result.id, result.firstName);
      }
    }
  }
}
