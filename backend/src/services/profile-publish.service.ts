import prisma from '../config/prisma';
import { profileSchema } from '../utils/validators/profile';
import { ProfileSequenceService } from './profile-sequence.service';
import { HoroscopeSnapshotService } from './horoscope-snapshot.service';

export class ProfilePublishService {
  static async publish(draftId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const draft = await tx.profileDraft.findUnique({ where: { draftId } });
      if (!draft) throw new AppError('Draft not found', 404);
      if (draft.userId !== userId) throw new AppError('Unauthorized', 403);
      if (draft.status !== 'DRAFT') throw new AppError('Draft already published or cancelled', 409);

      const formData = draft.draftDataJson as any;
      if (!formData) throw new AppError('Draft has no data', 400);

      const validated = profileSchema.parse({
        ...formData.basic,
        ...formData.personal,
        ...formData.community,
        ...formData.professional,
        ...formData.family,
        ...formData.assets,
        status: 'ACTIVE',
      });

      const profileId = await ProfileSequenceService.generateRegNo(tx);

      const profile = await tx.profile.create({
        data: {
          profileId,
          userId,
          regNo: profileId,
          status: 'ACTIVE',
          adminVerified: 'PENDING',
          profileFor: validated.profileFor,
          firstNameEn: validated.firstNameEn,
          lastNameEn: validated.lastNameEn,
          firstNameTa: validated.firstNameTa,
          lastNameTa: validated.lastNameTa,
          dob: validated.dob,
          gender: validated.gender,
          maritalStatus: validated.maritalStatus,
          currentDistrict: validated.currentDistrict,
          currentDistrictEn: validated.currentDistrictEn,
          currentDistrictTa: validated.currentDistrictTa,
          currentCityEn: validated.currentCityEn,
          currentCityTa: validated.currentCityTa,
          currentStateEn: validated.currentStateEn,
          currentStateTa: validated.currentStateTa,
          currentCountryEn: validated.currentCountryEn,
          currentCountryTa: validated.currentCountryTa,
          currentTaluk: validated.currentTaluk,
          nativeDistrict: validated.nativeDistrict,
          nativeTaluk: validated.nativeTaluk,
          bloodGroup: validated.bloodGroup,
          height: validated.height,
          weight: validated.weight,
          diet: validated.diet,
          complexion: validated.complexion,
          caste: validated.caste,
          community: validated.community,
          kulam: validated.kulam,
          kuladeivamEn: validated.kuladeivamEn,
          kuladeivamTa: validated.kuladeivamTa,
          star: validated.star,
          rasi: validated.rasi,
          laganam: validated.laganam,
          dosham: validated.dosham as any,
          birthTime: validated.birthTime,
          birthPlace: validated.birthPlace,
          birthLocationName: validated.birthLocationName,
          birthLatitude: validated.birthLatitude,
          birthLongitude: validated.birthLongitude,
          education: validated.education,
          jobDetail: validated.jobDetail,
          companyName: validated.companyName,
          jobSector: validated.jobSector,
          jobLocationEn: validated.jobLocationEn,
          jobLocationTa: validated.jobLocationTa,
          salaryMonthly: validated.salaryMonthly,
          fatherNameEn: validated.fatherNameEn,
          fatherNameTa: validated.fatherNameTa,
          fatherIsLate: validated.fatherIsLate ?? false,
          fatherJob: validated.fatherJob,
          fatherSalary: validated.fatherSalary,
          motherNameEn: validated.motherNameEn,
          motherNameTa: validated.motherNameTa,
          motherIsLate: validated.motherIsLate ?? false,
          motherJob: validated.motherJob,
          motherSalary: validated.motherSalary,
          noOfBrothers: validated.noOfBrothers,
          noOfSisters: validated.noOfSisters,
          residence: validated.residence,
          propertyDetailsEn: validated.propertyDetailsEn,
          propertyDetailsTa: validated.propertyDetailsTa,
          expectationEn: validated.expectationEn,
          expectationTa: validated.expectationTa,
          gallery: formData.gallery ?? [],
          profilePhoto: formData.profilePhoto ?? null,
        },
      });

      let horoscopeVersion = 0;
      if (draft.horoscopeJson && draft.birthDataJson) {
        const birthData = draft.birthDataJson as any;
        const snapshot = await HoroscopeSnapshotService.createSnapshot(
          tx,
          profile.id,
          draft.birthDataJson,
          draft.horoscopeJson,
          draft.inputHash ?? '',
        );
        horoscopeVersion = snapshot.version;

        await tx.horoscope.upsert({
          where: { profileId: profile.id },
          update: {
            mode: 'CREATE',
            horoscopeJson: draft.horoscopeJson,
            horoscopeVersion: snapshot.version,
            birthDate: birthData.dob ? new Date(birthData.dob) : null,
            birthTime: birthData.timeOfBirth ?? null,
            birthLocationName: birthData.birthLocation ?? null,
            birthLatitude: birthData.latitude ?? null,
            birthLongitude: birthData.longitude ?? null,
            timezone: birthData.timezone ?? null,
            generatedAt: new Date(),
          },
          create: {
            profileId: profile.id,
            mode: 'CREATE',
            horoscopeJson: draft.horoscopeJson,
            horoscopeVersion: snapshot.version,
            birthDate: birthData.dob ? new Date(birthData.dob) : null,
            birthTime: birthData.timeOfBirth ?? null,
            birthLocationName: birthData.birthLocation ?? null,
            birthLatitude: birthData.latitude ?? null,
            birthLongitude: birthData.longitude ?? null,
            timezone: birthData.timezone ?? null,
            generatedAt: new Date(),
          },
        });
      }

      await tx.profileSearch.create({
        data: {
          profileId: profile.id,
          gender: validated.gender ?? null,
          age: validated.dob ? Math.floor((Date.now() - new Date(validated.dob).getTime()) / 31557600000) : null,
          district: validated.currentDistrict ?? null,
          community: validated.community ?? null,
          occupation: validated.jobDetail ?? null,
          salaryRange: validated.salaryMonthly ? `${Math.floor(validated.salaryMonthly / 10000) * 10000}-${Math.ceil(validated.salaryMonthly / 10000) * 10000}` : null,
        },
      });

      await tx.profileDraft.update({
        where: { id: draft.id },
        data: { status: 'PUBLISHED', currentStep: -1 },
      });

      return {
        profileId,
        profile: {
          id: profile.id,
          profileId: profile.profileId,
          status: profile.status,
          createdAt: profile.createdAt,
        },
        horoscopeVersion,
        createdAt: profile.createdAt,
      };
    });
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
