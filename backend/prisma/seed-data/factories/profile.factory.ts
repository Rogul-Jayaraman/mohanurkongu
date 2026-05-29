import type { PrismaClient } from '@prisma/client';
import { SEED_CONFIG } from '../config.js';
import {
  random, randomInt, weightedPick, pickRandom, pickNRandom,
  generateDob, clampNormal, randomBool,
  randomDateBefore, randomDateAfter, generateRegNo, shuffleArray,
  weightedPickRaw, generateLongText, progressBar,
} from '../helpers.js';
import {
  EDUCATION_LEVELS, JOB_TITLES, COMPANY_NAMES,
} from '../names.js';
import type { AccountPlan } from './account.factory.js';
import type { UploadIndex } from './upload.factory.js';

interface LocationDef {
  districtCode: string;
  talukCode: string;
}

function pickLocation(districtWeights: Record<string, number>): LocationDef {
  const districts = Object.keys(districtWeights);
  const weights = Object.values(districtWeights);
  const dc = weightedPickRaw(districts, weights);

  const talukMap: Record<string, string[]> = {
    COIMBATORE: ['COIMBATORE (N)', 'COIMBATORE (S)', 'POLLACHI', 'METTUPALAYAM', 'SULUR', 'PERUR', 'KINATHUKADAVU', 'ANNUR'],
    ERODE: ['ERODE', 'BHAVANI', 'GOBICHETTIPALAYAM', 'PERUNDURAI', 'SATHYAMANGALAM', 'ANTHIYUR'],
    TIRUPPUR: ['TIRUPPUR NORTH', 'TIRUPPUR SOUTH', 'AVINASHI', 'PALLADAM', 'DHARAPURAM', 'KANGAYAM'],
    SALEM: ['SALEM', 'SALEM SOUTH', 'SALEM WEST', 'ATTUR', 'OMALUR', 'METTUR', 'SANKARI'],
    NAMAKKAL: ['NAMAKKAL', 'MOHANUR', 'TIRUCHENCODE', 'RASIPURAM', 'KUMARAPALAYAM'],
    TIRUVALLUR: ['TIRUVALLUR', 'POONAMALLEE', 'AVADI'],
    CHENNAI: ['EGMORE', 'MYLAPORE', 'PERAMBUR', 'AMBATTUR', 'VELACHERY'],
    DHARMAPURI: ['DHARMAPURI', 'HARUR', 'PALACODE'],
    TIRUVANNAMALAI: ['TIRUVANNAMALAI', 'ARANI', 'POLUR', 'VANDAVASI'],
    NILGIRIS: ['UDHAGAI', 'COONOOR', 'GUDALUR'],
    DINDIGUL: ['DINDIGUL EAST', 'PALANI', 'KODAIKANAL'],
    KARUR: ['KARUR', 'KULITHALAI', 'ARAVAKURICHI'],
    THIRUCHIRAPPALLI: ['TIRUCHIRAPPALLI EAST', 'SRIRANGAM', 'LALGUDI'],
    MADURAI: ['MADURAI EAST', 'MADURAI NORTH', 'MADURAI WEST'],
    KRISHNAGIRI: ['KRISHNAGIRI', 'HOSUR', 'BARGUR'],
    CHENGALPATTU: ['CHENGALPATTU', 'TAMBARAM', 'PALLAVARAM'],
    VELLORE: ['VELLORE', 'KATPADI', 'GUDIYATHAM'],
    THENI: ['THENI', 'PERIYAKULAM', 'BODINAYAKKANUR'],
    VIRUDHUNAGAR: ['VIRUDHUNAGAR', 'SIVAKASI', 'SRIVILLIPUTHUR'],
    NAGAPATTINAM: ['NAGAPATTINAM', 'VEDARANYAM'],
    THANJAVUR: ['THANJAVUR', 'KUMBAKONAM', 'PATTUKKOTAI'],
    PUDUKKOTTAI: ['PUDUKKOTTAI', 'ARANTHANGI'],
    RAMANATHAPURAM: ['RAMANATHAPURAM', 'RAMESHWARAM'],
    TIRUNELVELI: ['TIRUNELVELI', 'PALAYAMKOTTAI'],
    KANYAKUMARI: ['AGASTHEESWARAM', 'KALKULAM'],
    KANCHEEPURAM: ['KANCHEEPURAM', 'SRIPERUMBUDUR'],
    MAYILADUTHURAI: ['MAYILADUTHURAI', 'SIRKAZHI'],
    OTHER: ['AVADI'],
  };

  const taluks = talukMap[dc] || ['AVADI'];
  return { districtCode: dc, talukCode: pickRandom(taluks) };
}

async function ensureLocation(
  prisma: PrismaClient,
  districtCode: string,
  talukCode: string,
  districtIdMap: Map<string, number>,
  talukMap: Map<string, number>,
): Promise<string> {
  const districtId = districtIdMap.get(districtCode);
  if (!districtId) {
    const loc = await prisma.location.create({ data: { isOther: true } });
    return loc.id;
  }

  let talukId: number | undefined;
  const key = `${districtId}_${talukCode}`;
  talukId = talukMap.get(key);

  const existing = await prisma.location.findFirst({
    where: { districtId, talukId: talukId || undefined },
  });
  if (existing) return existing.id;

  const loc = await prisma.location.create({
    data: { isOther: false, districtId, talukId: talukId || null },
  });
  return loc.id;
}

export async function seedProfiles(
  prisma: PrismaClient,
  accountIndex: Record<number, any>,
  uploadIndex: UploadIndex,
  refs: any,
): Promise<Record<string, any>> {
  const profileIndex: Record<string, any> = {};
  const statusDistribution = SEED_CONFIG.PROFILE_STATUS_DISTRIBUTION;
  const allAccountIds = Object.values(accountIndex).map((ai: any) => ai.account.id);
  const shuffledAccounts = shuffleArray(allAccountIds);

  let idx = 0;
  let regNoCounter = 1;
  let created = 0;
  const totalProfiles = Object.values(statusDistribution).reduce((a, b) => a + b, 0);
  const usedPrimaryUploads = new Set<string>();

  for (const [status, count] of Object.entries(statusDistribution)) {
    for (let i = 0; i < count; i++) {
      if (idx >= shuffledAccounts.length) break;
      const accountId = shuffledAccounts[idx];
      idx++;
      const accEntry = Object.values(accountIndex).find((ai: any) => ai.account.id === accountId);
      if (!accEntry) continue;
      const plan: AccountPlan = accEntry.plan;

      const isEdgeCase = random() < 0.05;
      const isBigGallery = random() < (isEdgeCase ? 0.30 : SEED_CONFIG.EDGE_CASE_CONFIG.LARGE_GALLERY_PCT);
      const noHoroscope = random() < SEED_CONFIG.EDGE_CASE_CONFIG.MISSING_HOROSCOPE_PCT;
      const emptyGallery = random() < SEED_CONFIG.EDGE_CASE_CONFIG.EMPTY_GALLERY_PCT;
      const singlePhoto = random() < SEED_CONFIG.EDGE_CASE_CONFIG.SINGLE_PHOTO_PCT;
      const veryLongBio = random() < SEED_CONFIG.EDGE_CASE_CONFIG.VERY_LONG_BIO_PCT;
      const conflictingPrefs = random() < SEED_CONFIG.EDGE_CASE_CONFIG.CONFLICTING_PREFERENCES_PCT;

      const dob = generateDob(plan.age);
      const hasBasic = status !== 'DRAFT' || randomBool(60);
      const hasCommunity = status !== 'DRAFT' || randomBool(50);
      const hasProfessional = hasBasic && (status === 'DRAFT' ? randomBool(20) : randomBool(SEED_CONFIG.SECTION_COMPLETION.PROFESSIONAL * 100));
      const hasFamily = hasBasic && randomBool(SEED_CONFIG.SECTION_COMPLETION.FAMILY * 100);
      const hasHoroscope = hasBasic && !noHoroscope && (status === 'DRAFT' ? randomBool(10) : randomBool(SEED_CONFIG.SECTION_COMPLETION.HOROSCOPE * 100));
      const hasPrimaryPhoto = hasBasic && (status === 'DRAFT' ? randomBool(20) : randomBool(SEED_CONFIG.SECTION_COMPLETION.PRIMARY_PHOTO * 100));
      const hasGallery = hasPrimaryPhoto && !emptyGallery && (isBigGallery || randomBool(SEED_CONFIG.SECTION_COMPLETION.GALLERY * 100));
      const hasAssets = hasBasic && randomBool(SEED_CONFIG.SECTION_COMPLETION.ASSETS * 100);
      const hasPartnerPref = hasBasic && randomBool(SEED_CONFIG.SECTION_COMPLETION.PARTNER_PREFERENCE * 100);
      const hasTaTrans = randomBool(SEED_CONFIG.SECTION_COMPLETION.TA_TRANSLATION * 100);

      const createdAt = plan.createdAt || randomDateBefore(new Date(), 180);
      let activatedAt: Date | null = null;
      let approvedAt: Date | null = null;
      let approvedBy: string | null = null;
      let archivedAt: Date | null = null;
      let rejectedAt: Date | null = null;
      let rejectionReasonEn: string | null = null;
      let rejectionReasonTa: string | null = null;

      if (status === 'ACTIVE') {
        activatedAt = randomDateAfter(createdAt, randomInt(1, 14));
        approvedAt = activatedAt;
        approvedBy = accountIndex[0]?.account?.id || null;
      } else if (status === 'REJECTED') {
        rejectedAt = randomDateAfter(createdAt, randomInt(1, 7));
        const rej = weightedPickRaw(
          SEED_CONFIG.REJECTION_REASONS,
          SEED_CONFIG.REJECTION_REASONS.map(r => r.weight),
        ) as any;
        rejectionReasonEn = rej.reasonEn;
        rejectionReasonTa = rej.reasonTa;
      } else if (status === 'ARCHIVED') {
        activatedAt = randomDateAfter(createdAt, randomInt(1, 14));
        approvedAt = activatedAt;
        approvedBy = accountIndex[0]?.account?.id || null;
        archivedAt = randomDateAfter(activatedAt, randomInt(30, 180));
      } else if (status === 'DELETED') {
        archivedAt = randomDateAfter(createdAt, randomInt(1, 30));
      }

      const regNo = status === 'DRAFT' || status === 'DELETED' ? null : generateRegNo(regNoCounter++);

      const loc = pickLocation(SEED_CONFIG.DISTRICT_WEIGHTS);
      const currentLocationId = hasBasic ? await ensureLocation(prisma, loc.districtCode, loc.talukCode, refs.districts, refs.taluks) : null;
      let nativeLocationId: string | null = null;
      if (hasBasic && randomBool(70)) {
        const nativeLoc = pickLocation(SEED_CONFIG.DISTRICT_WEIGHTS);
        nativeLocationId = await ensureLocation(prisma, nativeLoc.districtCode, nativeLoc.talukCode, refs.districts, refs.taluks);
      }

      const profileForCode = plan.profileFor;
      const pf = refs.profileFors.find((f: any) => f.code === profileForCode);
      const profileForId = pf?.id || refs.profileFors[0].id;

      const heightId = refs.heightMap.get(plan.heightCm) || refs.heights[0].id;

      const profile = await prisma.profile.create({
        data: {
          accountId,
          regNo,
          currentStatus: status as any,
          createdAt,
          updatedAt: createdAt,
          activatedAt,
          approvedAt,
          approvedBy,
          archivedAt: archivedAt,
          rejectedAt,
          rejectionReasonEn,
          rejectionReasonTa,
          archiveReasonEn: status === 'ARCHIVED' ? pickRandom(SEED_CONFIG.ARCHIVE_REASONS) : null,
          archiveReasonTa: status === 'ARCHIVED' ? 'சுயவிவரம் செயலிழந்தது' : null,
        },
      });

      if (regNo) {
        try {
          await prisma.publishLog.create({
            data: {
              idempotencyKey: `seed-${accountId}-${profile.id}`,
              profileId: profile.id,
              regNo,
              accountId,
              createdAt,
            },
          });
        } catch {
          // idempotency key collision — skip
        }
      }

      if (hasBasic) {
        await prisma.profileBasic.create({
          data: {
            profileId: profile.id,
            profileForId,
            gender: plan.gender as any,
            dob,
            diet: plan.diet as any,
            bloodGroup: plan.bloodGroup as any,
            heightId,
            weight: randomBool(60) ? randomInt(45, 85) : null,
            complexion: plan.complexion as any,
            maritalStatus: plan.maritalStatus as any,
            currentLocationId,
            nativeLocationId,
          },
        });
      }

      if (hasCommunity) {
        const community = refs.communities[0];
        const caste = refs.castes[0];
        const kulamCode = pickRandom(refs.kulamCodes);
        const kulam = refs.kulams.find((k: any) => k.code === kulamCode);

        await prisma.profileCommunity.create({
          data: {
            profileId: profile.id,
            communityId: community.id,
            casteId: caste.id,
            kulamId: kulam?.id || null,
          },
        });
      }

      if (hasProfessional) {
        const jobSectorCode = weightedPick(SEED_CONFIG.JOB_SECTOR_DISTRIBUTION);
        const js = refs.jobSectors.find((j: any) => j.code === jobSectorCode);
        const salaryRange = weightedPickRaw(
          SEED_CONFIG.SALARY_RANGES,
          SEED_CONFIG.SALARY_RANGES.map(r => r.weight),
        );
        const salary = randomInt(salaryRange.min, salaryRange.max === 9999999 ? randomInt(500001, 2000000) : salaryRange.max);

        await prisma.profileProfessional.create({
          data: {
            profileId: profile.id,
            education: pickRandom(EDUCATION_LEVELS),
            jobSectorId: js?.id || null,
            jobDetail: pickRandom(JOB_TITLES),
            jobLocation: loc.districtCode,
            monthlySalary: salary,
            salaryCurrency: 'INR',
            companyName: randomBool(60) ? pickRandom(COMPANY_NAMES) : null,
          },
        });
      }

      if (hasFamily) {
        const fatherAlive = randomBool(85);
        const motherAlive = randomBool(90);

        await prisma.profileFamily.create({
          data: {
            profileId: profile.id,
            fatherAlive,
            fatherName: fatherAlive ? pickRandom(['Ramasamy', 'Palaniyappan', 'Subramani', 'Muthusamy', 'Chinnasamy', 'Periyasamy', 'Kandasamy']) : null,
            fatherJob: fatherAlive ? pickRandom(['Farmer', 'Business', 'Teacher', 'Govt Employee', 'Private Employee']) : null,
            fatherSalary: fatherAlive && randomBool(60) ? randomInt(20000, 80000) : null,
            motherAlive,
            motherName: motherAlive ? pickRandom(['Lakshmi', 'Devi', 'Saraswathi', 'Parvathi', 'Kalyani', 'Gowri', 'Malliga']) : null,
            motherJob: motherAlive && randomBool(30) ? 'Housewife' : null,
            motherSalary: motherAlive && randomBool(5) ? randomInt(10000, 30000) : null,
            noOfBrother: randomInt(0, 4),
            noOfSister: randomInt(0, 4),
          },
        });
      }

      if (hasHoroscope) {
        const rasiCode = pickRandom(refs.rasiCodes);
        const nakshatraCode = pickRandom(refs.nakshatraCodes);
        const lagnaCode = pickRandom(refs.lagnaCodes);
        const rasi = refs.rasis.find((r: any) => r.code === rasiCode);
        const nakshatra = refs.nakshatras.find((n: any) => n.code === nakshatraCode);
        const lagna = refs.lagnas.find((l: any) => l.code === lagnaCode);

        const accountUploads = uploadIndex.byAccount.get(accountId);
        const myHoroscopeIds = accountUploads?.horoscope || [];
        const mode = weightedPick(SEED_CONFIG.HOROSCOPE_MODE_DISTRIBUTION) as 'GENERATED' | 'UPLOADED';
        const hasRasiChart = mode === 'UPLOADED' && myHoroscopeIds.length > 0 && randomBool(70);
        const hasNavamsaChart = mode === 'UPLOADED' && myHoroscopeIds.length > 0 && randomBool(40);
        const rasiChartId = hasRasiChart ? pickRandom(myHoroscopeIds) : null;
        const navamsaChartId = hasNavamsaChart ? pickRandom(myHoroscopeIds) : null;

        const generatedData = mode === 'GENERATED' ? {
          rasi: rasiCode,
          nakshatra: nakshatraCode,
          lagna: lagnaCode,
          birthStar: nakshatraCode,
          padam: randomInt(1, 4),
          charan: randomInt(1, 4),
          dosham: randomBool(25) ? 'Sevvai Dosham' : null,
          birthDetails: {
            day: pickRandom(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
            time: `${randomInt(0, 23)}:${String(randomInt(0, 59)).padStart(2, '0')}`,
            place: loc.districtCode,
          },
        } : null;

        await prisma.profileHoroscope.create({
          data: {
            profileId: profile.id,
            mode: mode as any,
            rasiId: rasi?.id || null,
            nakshatraId: nakshatra?.id || null,
            lagnaId: lagna?.id || null,
            rasiChartUploadId: rasiChartId,
            navamsaChartUploadId: navamsaChartId,
            horoscopeJson: generatedData,
            generatedAt: mode === 'GENERATED' ? createdAt : null,
          },
        });
      }

      if (hasPrimaryPhoto) {
        const accountUploads = uploadIndex.byAccount.get(accountId);
        const myProfileIds = accountUploads?.profile || [];

        const unused = myProfileIds.filter(id => !usedPrimaryUploads.has(id));
        let primaryUploadId: string | null = null;
        if (unused.length > 0) {
          primaryUploadId = pickRandom(unused);
          usedPrimaryUploads.add(primaryUploadId);
        }

        const profilePhoto = await prisma.profilePhoto.create({
          data: {
            profileId: profile.id,
            primaryUploadId,
          },
        });

        if (hasGallery && primaryUploadId) {
          const galleryCount = isBigGallery
            ? weightedPickRaw(
                [10, 12, 15],
                [50, 30, 20],
              )
            : weightedPickRaw(
                SEED_CONFIG.GALLERY_SIZE_DISTRIBUTION.map(g => g.size),
                SEED_CONFIG.GALLERY_SIZE_DISTRIBUTION.map(g => g.weight),
              );

          const myGalleryIds = accountUploads?.gallery || [];
          const galleryPool = myGalleryIds.filter(id => id !== primaryUploadId);
          const galleryUploads = pickNRandom(galleryPool, galleryCount);

          for (const uploadId of galleryUploads) {
            await prisma.profileGalleryPhoto.create({
              data: {
                profilePhotoId: profilePhoto.id,
                uploadId,
              },
            });
          }
        }
      }

      if (hasAssets) {
        const residenceType = weightedPick(SEED_CONFIG.RESIDENCE_TYPE_DISTRIBUTION);
        await prisma.profileAssets.create({
          data: {
            profileId: profile.id,
            land: randomBool(40) ? `${randomInt(1, 10)} acres` : null,
            residenceType: residenceType as any,
            otherAssets: randomBool(30) ? pickRandom(['Car, Gold', 'Gold, Land', 'Property', 'Investments', 'Agricultural Land']) : null,
            vehicle: randomBool(50) ? pickRandom(['Car', 'Bike', 'Car & Bike', 'SUV']) : null,
          },
        });
      }

      if (hasPartnerPref) {
        const ageMin = plan.gender === 'MALE' ? randomInt(21, 26) : randomInt(24, 28);
        const ageMax = conflictingPrefs ? ageMin - 2 : ageMin + randomInt(3, 8);
        const minHeightCm = plan.gender === 'MALE'
          ? clampNormal(155, 4, 145, 170)
          : clampNormal(165, 4, 158, 183);
        const maxHeightCm = conflictingPrefs ? minHeightCm - 5 : minHeightCm + randomInt(5, 15);

        const minHeightId = refs.heightMap.get(minHeightCm) || null;
        const maxHeightId = refs.heightMap.get(maxHeightCm) || null;

        await prisma.partnerPreference.create({
          data: {
            profileId: profile.id,
            ageMin: Math.max(18, ageMin),
            ageMax: Math.max(ageMin, ageMax),
            heightMinId: minHeightId,
            heightMaxId: maxHeightId,
            monthlySalary: randomInt(20000, 200000),
            salaryCurrency: 'INR',
            expectationNote: veryLongBio
              ? generateLongText(200)
              : (conflictingPrefs ? 'Looking for someone tall but height min is lower than max' : null),
            preferredLocation: randomBool(50) ? 'Coimbatore, Erode, Tiruppur' : null,
          },
        });
      }

      await prisma.profileTranslation.create({
        data: {
          profileId: profile.id,
          language: 'EN',
          firstName: plan.nameEn,
          lastName: plan.surNameEn,
        },
      });

      if (hasTaTrans) {
        await prisma.profileTranslation.create({
          data: {
            profileId: profile.id,
            language: 'TA',
            firstName: plan.nameTa,
            lastName: plan.surNameTa,
            kuladeivam: randomBool(40) ? pickRandom(['Kuladeivam', 'Karuppanasamy', 'Mariamman', 'Pidari']) : null,
          },
        });
      }

      await prisma.profileStateHistory.create({
        data: {
          profileId: profile.id,
          changedByAccountId: accountId,
          fromStatus: null,
          toStatus: status as any,
          reason: status === 'DRAFT' ? 'Profile created as draft' : 'Profile created',
          createdAt: createdAt,
        },
      });

      if (status === 'PENDING') {
        await prisma.profileStateHistory.create({
          data: {
            profileId: profile.id,
            changedByAccountId: accountId,
            fromStatus: 'DRAFT' as any,
            toStatus: 'PENDING' as any,
            reason: 'Profile submitted for verification',
            createdAt: randomDateAfter(createdAt, randomInt(1, 5)),
          },
        });
      }

      if (status === 'ACTIVE' && approvedAt) {
        await prisma.profileStateHistory.create({
          data: {
            profileId: profile.id,
            changedByAccountId: approvedBy || accountId,
            fromStatus: 'PENDING' as any,
            toStatus: 'ACTIVE' as any,
            reason: 'Profile approved by admin',
            createdAt: approvedAt,
          },
        });
      }

      if (status === 'REJECTED' && rejectedAt) {
        await prisma.profileStateHistory.create({
          data: {
            profileId: profile.id,
            changedByAccountId: accountIndex[0]?.account?.id || accountId,
            fromStatus: 'PENDING' as any,
            toStatus: 'REJECTED' as any,
            reason: rejectionReasonEn || 'Rejected by admin',
            createdAt: rejectedAt,
          },
        });
      }

      if (status === 'ARCHIVED' && archivedAt && activatedAt) {
        await prisma.profileStateHistory.create({
          data: {
            profileId: profile.id,
            changedByAccountId: accountId,
            fromStatus: 'ACTIVE' as any,
            toStatus: 'ARCHIVED' as any,
            reason: 'Profile archived',
            createdAt: archivedAt,
          },
        });
      }

      if (status === 'DELETED' && archivedAt) {
        await prisma.profileStateHistory.create({
          data: {
            profileId: profile.id,
            changedByAccountId: accountId,
            fromStatus: 'DRAFT' as any,
            toStatus: 'DELETED' as any,
            reason: 'Profile deleted by user',
            createdAt: archivedAt,
          },
        });
      }

      profileIndex[profile.id] = {
        profile,
        accountId,
        status,
        regNo,
        location: loc,
        plan,
        hasPrimaryPhoto,
        hasHoroscope,
        hasCommunity,
        hasBasic,
      };

      created++;
      progressBar(created, totalProfiles, 'Profiles');
    }
  }

  return profileIndex;
}
