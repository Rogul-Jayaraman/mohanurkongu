import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const PROFILE_FOR_VALUES = [
  'MYSELF', 'MY_SON', 'MY_DAUGHTER', 'MY_SISTER', 'MY_BROTHER',
] as const;

const JOB_SECTOR_VALUES = [
  'PRIVATE', 'FOREIGN', 'BUSINESS', 'DOCTOR', 'GOVT', 'SELF_EMPLOYED', 'OTHERS',
] as const;

const RASI_VALUES = [
  'MESHA', 'VRISHABHA', 'MITHUNA', 'KATAKA', 'SIMHA', 'KANYA',
  'TULA', 'VRISCHIKA', 'DHANUS', 'MAKARA', 'KUMBHA', 'MEENA',
] as const;

const NAKSHATRA_VALUES = [
  'ASHWINI', 'BHARANI', 'KRITTIKA', 'ROHINI', 'MRIGASHIRA', 'ARDRA',
  'PUNARVASU', 'PUSHYA', 'ASHLESHA', 'MAGHA', 'PURVA_PHALGUNI', 'UTTARA_PHALGUNI',
  'HASTA', 'CHITRA', 'SWATI', 'VISHAKHA', 'ANURADHA', 'JYESHTHA',
  'MULA', 'PURVA_ASHADHA', 'UTTARA_ASHADHA', 'SHRAVANA', 'DHANISHTHA', 'SHATABHISHA',
  'PURVA_BHADRAPADA', 'UTTARA_BHADRAPADA', 'REVATI',
] as const;

const KULAM_VALUES = [
  'AANTHUVAN_KULAM', 'AZHAGU_KULAM', 'AATHE_KULAM', 'AANTHAI_KULAM',
  'AADAR_KULAM', 'AAVAN_KULAM', 'EENJAN_KULAM', 'OZUKKAR_KULAM',
  'OOTHAALAR_KULAM', 'KANNAKKAN_KULAM', 'KANNAN_KULAM', 'KANNAANTHAI_KULAM',
  'KAADAI_KULAM', 'KAARI_KULAM', 'KEERAN_KULAM', 'KUZHLAAYAN_KULAM',
  'KOORAI_KULAM', 'KOOVENDHAR_KULAM', 'SAATHANTHAI_KULAM', 'SELLAN_KULAM',
  'SEMBAN_KULAM', 'SENGKANNAN_KULAM', 'SEMBUTHAN_KULAM', 'SENKUNNIER_KULAM',
  'SEVVAAYAR_KULAM', 'CHERAN_KULAM', 'CHEDAN_KULAM', 'DANANJAYAN_KULAM',
  'THAZHINJI_KULAM', 'THOORAN_KULAM', 'DEVENDRAN_KULAM', 'THOODAR_KULAM',
  'NEERUNNIYAR_KULAM', 'PAVAZHALAR_KULAM', 'PANAYAN_KULAM', 'PATHUMAN_KULAM',
  'PAYIRAN_KULAM', 'PANAGKAADAR_KULAM', 'PATHARIAR_KULAM', 'PANDIYAN_KULAM',
  'PILLAR_KULAM', 'POOSAN_KULAM', 'POOCHANTHAI_KULAM', 'PERIYAN_KULAM',
  'PERUNKUDIYAAN_KULAM', 'PORULAANTHAI_KULAM', 'PONNAR_KULAM', 'MANIYAN_KULAM',
  'MAYILAR_KULAM', 'MAADAR_KULAM', 'MUTTHAN_KULAM', 'MUZHUKATHAN_KULAM',
  'MEDHI_KULAM', 'VANNAKKAN_KULAM', 'VILLIYAR_KULAM', 'VILAYAN_KULAM',
  'VIZHIYAR_KULAM', 'VENDUVAN_KULAM', 'VENNAG_KULAM', 'VELLAMPAR_KULAM',
] as const;

const DISTRICT_VALUES = [
  'TIRUVALLUR', 'CHENNAI', 'KANCHEEPURAM', 'VELLORE', 'DHARMAPURI',
  'TIRUVANNAMALAI', 'VILLUPPURAM', 'SALEM', 'NAMAKKAL', 'ERODE',
  'NILGIRIS', 'COIMBATORE', 'DINDIGUL', 'KARUR', 'THIRUCHIRAPPALLI',
  'PERAMBALUR', 'ARIYALUR', 'CUDDALORE', 'NAGAPATTINAM', 'THIRUVARUR',
  'THANJAVUR', 'PUDUKKOTTAI', 'SIVAGANGAI', 'MADURAI', 'THENI',
  'VIRUDHUNAGAR', 'RAMANATHAPURAM', 'THOOTHUKKUDI', 'TIRUNELVELI',
  'KANYAKUMARI', 'KRISHNAGIRI', 'TIRUPPUR', 'KALLAKURICHI', 'TENKASI',
  'CHENGALPATTU', 'THIRUPATHUR', 'RANIPET', 'MAYILADUTHURAI', 'OTHER',
] as const;

const TALUKS_BY_DISTRICT: Record<string, string[]> = {
  TIRUVALLUR: ['AVADI', 'GUMMIDIPOONDI', 'PALLIPET', 'PONNERI', 'POONAMALLEE', 'R.K. PET', 'TIRUTTANI', 'TIRUVALLUR', 'UTHUKOTTAI'],
  CHENNAI: ['ALANDUR', 'AMBATTUR', 'AMINJIKARAI', 'AYANAVARAM', 'EGMORE', 'GUINDY', 'KOLATHUR', 'MADHAVARAM', 'MADURAVOYAL', 'MAMBALAM', 'MYLAPORE', 'PERAMBUR', 'PURASAWALKAM', 'SHOZHINGANALLUR', 'THIRUVOTTIYUR', 'TONDIARPET', 'VELACHERY'],
  KANCHEEPURAM: ['KANCHEEPURAM', 'KUNDRATHUR', 'SRIPERUMBUDUR', 'UTHIRAMERUR', 'WALAJABAD'],
  VELLORE: ['ANAICUT', 'GUDIYATHAM', 'KATPADI', 'K.V. KUPPAM', 'PERNAMBUT', 'VELLORE'],
  DHARMAPURI: ['DHARMAPURI', 'HARUR', 'KARIMANGALAM', 'NALLAMPALLI', 'PALACODE', 'PAPPIREDDIPATTY', 'PENNAGARAM'],
  TIRUVANNAMALAI: ['ARANI', 'CHENGAM', 'CHETPET', 'CHEYYAR', 'JAMUNAMARATHOOR', 'KALASAPAKKAM', 'KILPENNATHUR', 'POLUR', 'THANDARAMPATTU', 'TIRUVANNAMALAI', 'VANDAVASI', 'VEMBAKKAM'],
  VILLUPPURAM: ['GINGEE', 'KANDACHEEPURAM', 'MARAKKANAM', 'MELMALAIYANOOR', 'THIRUVENNAINALLUR', 'TINDIVANAM', 'VANUR', 'VIKRAVANDI', 'VILLUPPURAM'],
  SALEM: ['ATTUR', 'EDAPPADY', 'GANGAVALLI', 'KADAYAMPATTI', 'METTUR', 'OMALUR', 'PETHANAICKENPALAYAM', 'SALEM', 'SALEM SOUTH', 'SALEM WEST', 'SANKARI', 'THALAIVASAL', 'VALAPADY', 'YERCAUD'],
  NAMAKKAL: ['KOLLI HILLS', 'KUMARAPALAYAM', 'MOHANUR', 'NAMAKKAL', 'PARAMATHIVELUR', 'RASIPURAM', 'SENDAMANGALAM', 'THIRUCHENCODE'],
  ERODE: ['ANTHIYUR', 'BHAVANI', 'ERODE', 'GOBICHETTIPALAYAM', 'KODUMUDI', 'MODAKKURICHI', 'NAMBIYUR', 'PERUNDURAI', 'SATHYAMANGALAM', 'THALAVADI'],
  NILGIRIS: ['COONOOR', 'GUDALUR', 'KOTAGIRI', 'KUNDAH', 'PANDALUR', 'UDHAGAI'],
  COIMBATORE: ['ANAIMALAI', 'ANNUR', 'COIMBATORE (N)', 'COIMBATORE (S)', 'KINATHUKADAVU', 'MADUKKARAI', 'METTUPALAYAM', 'PERUR', 'POLLACHI', 'SULUR', 'VALPARAI'],
  DINDIGUL: ['ATHOOR', 'DINDIGUL EAST', 'DINDIGUL WEST', 'GUJILIAMPARAI', 'KODAIKANAL', 'NATHAM', 'NILAKOTTAI', 'ODDENCHATRAM', 'PALANI', 'VEDASANDUR'],
  KARUR: ['ARAVAKURICHI', 'KADAVUR', 'KARUR', 'KRISHNARAYAPURAM', 'KULITHALAI', 'MANMANGALAM', 'PUGALUR'],
  THIRUCHIRAPPALLI: ['LALGUDI', 'MANACHANALLUR', 'MANAPPARAI', 'MARUNGAPURI', 'MUSIRI', 'SRIRANGAM', 'THIRUVERUMBUR', 'THOTTIAM', 'THURAIYUR', 'TIRUCHIRAPPALLI EAST', 'TIRUCHIRAPPALLI WEST'],
  PERAMBALUR: ['ALATHUR', 'KUNNAM', 'PERAMBALUR', 'VEPPANTHATTAI'],
  ARIYALUR: ['ANDIMADAM', 'ARIYALUR', 'SENDURAI', 'UDAYARPALAYAM'],
  CUDDALORE: ['ANNAGRAMAM', 'BHUVANAGIRI', 'CHIDAMBARAM', 'CUDDALORE', 'KATTUMANNARKOIL', 'KURINJIPADI', 'PANRUTI', 'SRIMUSHNAM', 'TITAGUDI', 'VEPPUR', 'VRIDHACHALAM'],
  NAGAPATTINAM: ['KILVELUR', 'NAGAPATTINAM', 'THIRUKKUVALAI', 'VEDARANYAM'],
  THIRUVARUR: ['KUDAVASAL', 'MANNARGUDI', 'NANNILAM', 'NEEDAMANGALAM', 'THIRUVARUR', 'VALANGAIMAN'],
  THANJAVUR: ['KUMBAKONAM', 'ORATHANAD', 'PAPANASAM', 'PATTUKKOTAI', 'PERAVURANI', 'THANJAVUR', 'THIRUVAIYARU', 'THIRUVIDAIMARUDUR'],
  PUDUKKOTTAI: ['ALANGUDI', 'ARANTHANGI', 'AVUDAIYARKOIL', 'GANDARVAKOTTAI', 'ILLUPUR', 'KARAMBAKUDI', 'KULATHUR', 'MANAMELKUDI', 'PONNAMARAVATHI', 'PUDUKKOTTAI', 'THIRUMAYAM', 'VIRALIMALAI'],
  SIVAGANGAI: ['DEVAKOTTAI', 'ILAYANGUDI', 'KALAYARKOIL', 'KARAIKUDI', 'MANAMADURAI', 'SIVAGANGA', 'THIRUPPUVANAM', 'THIRUPPATTUR'],
  MADURAI: ['KALLIGUDI', 'MADURAI EAST', 'MADURAI NORTH', 'MADURAI SOUTH', 'MADURAI WEST', 'MELUR', 'PERAIYUR', 'THIRUPPARANKUNDRAM', 'TIRUMANGALAM', 'USILAMPATTI', 'VADIPATTI'],
  THENI: ['AUNDIPATTI', 'BODINAYAKKANUR', 'PERIYAKULAM', 'THENI', 'UTHAMAPALAYAM'],
  VIRUDHUNAGAR: ['ARUPPUKKOTTAI', 'KARIYAPATTI', 'RAJAPALAYAM', 'SATTUR', 'SIVAKASI', 'SRIVILLIPUTHUR', 'TIRUCHULI', 'VEMBAKKOTTAI', 'VIRUDHUNAGAR', 'WATRAP'],
  RAMANATHAPURAM: ['KADALADI', 'KAMUTHI', 'KILAKARAI', 'MUDUKULATHUR', 'PARAMAKUDI', 'RAJASINGAMANGALAM', 'RAMANATHAPURAM', 'RAMESHWARAM', 'THIRUVADANI'],
  THOOTHUKKUDI: ['ERAL', 'ETTAYAPURAM', 'KAYATHAR', 'KOVILPATTI', 'OTTAPIDARAM', 'SATTANKULAM', 'SRIVAIKUNDAM', 'THOOTHUKUDI', 'TIRUCHENDUR', 'VILATHIKULAM'],
  TIRUNELVELI: ['AMBASAMUDRAM', 'CHERANMAHADEVI', 'MANUR', 'NANGUNERI', 'PALAYAMKOTTAI', 'RADHAPURAM', 'THISAYANVILAI', 'TIRUNELVELI'],
  KANYAKUMARI: ['AGASTHEESWARAM', 'KALKULAM', 'KILLIYOOR', 'THIRUVATTAR', 'THOVALAI', 'VILAVAMCODE'],
  KRISHNAGIRI: ['ANCHETTY', 'BARGUR', 'DENKANIKOTTAI', 'HOSUR', 'KRISHNAGIRI', 'POCHAMPALLI', 'SHOOLAGIRI', 'UTHANGARAI'],
  TIRUPPUR: ['AVINASHI', 'DHARAPURAM', 'KANGAYAM', 'MADATHUKULAM', 'PALLADAM', 'TIRUPPUR NORTH', 'TIRUPPUR SOUTH', 'UDUMALAIPET', 'UTHUKKULI'],
  KALLAKURICHI: ['CHINNASALEM', 'KALLAKURICHI', 'KALVARAYAN HILLS', 'SANKARAPURAM', 'TIRUKKOILUR', 'ULUNDURPET', 'VANAPURAM'],
  TENKASI: ['ALANGULAM', 'KADAYANALLUR', 'SANKARANKOIL', 'SHENKOTTAI', 'SIVAGIRI', 'TENKASI', 'THIRUVENGADAM', 'VEERAKERALAMPUDUR'],
  CHENGALPATTU: ['CHENGALPATTU', 'CHEYYUR', 'MADURANTHAGAM', 'PALLAVARAM', 'TAMBARAM', 'THIRUPORUR', 'TIRUKALUKUNDRAM', 'VANDALUR'],
  THIRUPATHUR: ['AMBUR', 'NATARAMPALLI', 'TIRUPATHUR', 'VANIYAMBADI'],
  RANIPET: ['ARAKKONAM', 'ARCOT', 'KALAVAI', 'NEMILI', 'SHOLINGHUR', 'WALAJAPET'],
  MAYILADUTHURAI: ['KUTHALAM', 'MAYILADUTHURAI', 'SIRKAZHI', 'THARANGAMBADI'],
};

async function seedSystemSettings() {
  await prisma.systemSetting.upsert({
    where: { key: 'membership_enabled' },
    update: {},
    create: { key: 'membership_enabled', value: 'true' },
  });
  console.log('Seeded system_settings: membership_enabled = true');
}

async function main() {
  await seedRoles();
  await seedPlans();
  await seedSystemSettings();
  await seedCounter();
  await seedProfileFors();
  await seedHeights();
  await seedJobSectors();
  await seedKulams();
  await seedRasis();
  await seedNakshatras();
  await seedLagnas();
  const districtMap = await seedDistricts();
  await seedTaluks(districtMap);
  await seedCommunity();
  await seedMandapamPackages();
  await seedMandapamFacilities();
  await seedMandapamAddons();
  await seedMandapamTokens();
  await seedDefaultAdmin();
  await setDevCascade();

  if (process.env.SEED_DATA === 'true') {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  SEED_DATA=true — generating test data');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const { generateTestData } = await import('./seed-data/index.js');
    await generateTestData();
  }
}

async function seedRoles() {
  const roles = await Promise.all([
    prisma.role.upsert({ where: { code: 'USER' }, update: {}, create: { code: 'USER' } }),
    prisma.role.upsert({ where: { code: 'ADMIN' }, update: {}, create: { code: 'ADMIN' } }),
  ]);
  console.log(`Seeded ${roles.length} roles`);
}

async function seedPlans() {
  const plans = await Promise.all([
    prisma.membershipPlan.upsert({
      where: { code: 'BRONZE' },
      update: {},
      create: {
        code: 'BRONZE',
        displayName: 'Bronze',
        displayPrice: 0,
        durationDays: 0,
        openLimit: 10,
        shortlistLimit: 0,
        profileSlotLimit: 1,
        viewDetails: 'BASIC',
        printProfile: false,
        printHoroscope: false,
        searchLevel: 'BASIC',
        status: 'ACTIVE',
      },
    }),
    prisma.membershipPlan.upsert({
      where: { code: 'SILVER' },
      update: {},
      create: {
        code: 'SILVER',
        displayName: 'Silver',
        displayPrice: 999,
        durationDays: 90,
        openLimit: 20,
        shortlistLimit: 3,
        profileSlotLimit: 3,
        viewDetails: 'EXTENDED',
        printProfile: true,
        printHoroscope: false,
        searchLevel: 'EXTENDED',
        status: 'ACTIVE',
      },
    }),
    prisma.membershipPlan.upsert({
      where: { code: 'GOLD' },
      update: {},
      create: {
        code: 'GOLD',
        displayName: 'Gold',
        displayPrice: 1999,
        durationDays: 180,
        openLimit: 30,
        shortlistLimit: 10,
        profileSlotLimit: 5,
        viewDetails: 'ADVANCED',
        printProfile: true,
        printHoroscope: true,
        searchLevel: 'ADVANCED',
        status: 'ACTIVE',
      },
    }),
    prisma.membershipPlan.upsert({
      where: { code: 'PLATINUM' },
      update: {},
      create: {
        code: 'PLATINUM',
        displayName: 'Platinum',
        displayPrice: 3999,
        durationDays: 365,
        openLimit: -1,
        shortlistLimit: -1,
        profileSlotLimit: 10,
        viewDetails: 'FULL',
        printProfile: true,
        printHoroscope: true,
        searchLevel: 'FULL',
        status: 'ACTIVE',
      },
    }),
  ]);
  console.log(`Seeded ${plans.length} membership plans`);
}

async function seedCounter() {
  const prefixes = ['MKM', 'MK'];
  for (const prefix of prefixes) {
    const counter = await prisma.counter.upsert({
      where: { prefix },
      update: {},
      create: { prefix, counter: 0 },
    });
    console.log(`Seeded counter: ${counter.prefix}-${counter.counter}`);
  }
}

async function seedProfileFors() {
  const items = await Promise.all(
    PROFILE_FOR_VALUES.map((code) =>
      prisma.profileFor.upsert({
        where: { code },
        update: {},
        create: { code },
      }),
    ),
  );
  console.log(`Seeded ${items.length} profile-for options`);
}

async function seedHeights() {
  let count = 0;
  for (let cm = 122; cm <= 231; cm++) {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    const label = `${feet}'${inches}" - ${cm} cm`;
    await prisma.height.upsert({
      where: { valueCm: cm },
      update: {},
      create: { valueCm: cm, label },
    });
    count++;
  }
  console.log(`Seeded ${count} height options`);
}

async function seedJobSectors() {
  const items = await Promise.all(
    JOB_SECTOR_VALUES.map((code) =>
      prisma.jobSector.upsert({
        where: { code },
        update: {},
        create: { code },
      }),
    ),
  );
  console.log(`Seeded ${items.length} job sectors`);
}

async function seedKulams() {
  const items = await Promise.all(
    KULAM_VALUES.map((code) =>
      prisma.kulam.upsert({
        where: { code },
        update: {},
        create: { code },
      }),
    ),
  );
  console.log(`Seeded ${items.length} kulams`);
}

async function seedRasis() {
  const items = await Promise.all(
    RASI_VALUES.map((code) =>
      prisma.rasi.upsert({
        where: { code },
        update: {},
        create: { code },
      }),
    ),
  );
  console.log(`Seeded ${items.length} rasis`);
}

async function seedNakshatras() {
  const items = await Promise.all(
    NAKSHATRA_VALUES.map((code) =>
      prisma.nakshatra.upsert({
        where: { code },
        update: {},
        create: { code },
      }),
    ),
  );
  console.log(`Seeded ${items.length} nakshatras`);
}

async function seedLagnas() {
  const items = await Promise.all(
    RASI_VALUES.map((code) =>
      prisma.lagna.upsert({
        where: { code },
        update: {},
        create: { code },
      }),
    ),
  );
  console.log(`Seeded ${items.length} lagnas`);
}

async function seedDistricts(): Promise<Map<string, number>> {
  const districtMap = new Map<string, number>();
  for (const code of DISTRICT_VALUES) {
    const district = await prisma.district.upsert({
      where: { code },
      update: {},
      create: { code },
    });
    districtMap.set(code, district.id);
  }
  console.log(`Seeded ${districtMap.size} districts`);
  return districtMap;
}

async function seedTaluks(districtMap: Map<string, number>) {
  let count = 0;
  for (const [districtCode, talukCodes] of Object.entries(TALUKS_BY_DISTRICT)) {
    const districtId = districtMap.get(districtCode);
    if (!districtId) continue;
    for (const code of talukCodes) {
      await prisma.taluk.upsert({
        where: { districtId_code: { districtId, code } },
        update: {},
        create: { districtId, code },
      });
      count++;
    }
  }
  console.log(`Seeded ${count} taluks`);
}

async function seedCommunity() {
  const community = await prisma.community.upsert({
    where: { code: 'Kongu Vellalar' },
    update: {},
    create: { code: 'Kongu Vellalar' },
  });
  console.log(`Seeded community: ${community.code}`);

  const caste = await prisma.caste.upsert({
    where: { communityId_code: { communityId: community.id, code: 'BC' } },
    update: {},
    create: { communityId: community.id, code: 'BC' },
  });
  console.log(`Seeded caste: ${caste.code}`);
}

async function seedMandapamPackages() {
  const packages = [
    {
      code: 'STANDARD',
      bookingType: 'HOURLY' as const,
      durationType: 'CUSTOM_HOURS' as const,
      pricingType: 'HOURLY' as const,
      pricingAmount: 5000,
      displayNameEn: 'Standard Package',
      displayNameTa: 'நிலையான தொகுப்பு',
      functions: [
        { en: 'Maternity Ceremony (Baby Shower / Bangle Ceremony)', ta: 'மெட்டர்னிட்டி விழா (பேபி ஷவர் / பேங்கிள் விழா)' },
        { en: 'Engagement Ceremony (Nichayathartham)', ta: 'நிச்சயதார்த்தம் (நிச்சயதார்த்தம்)' },
        { en: 'Puberty Ceremony', ta: 'பூப்புனித நீராட்டு விழா' },
        { en: 'Naming Ceremony', ta: 'பெயர் சூட்டு விழா' },
        { en: 'Tonsure Ceremony (Mottai)', ta: 'மொட்டை போடுதல்' },
        { en: 'Ear Piercing Ceremony (Kaathu Kuthu)', ta: 'காது குத்தும் விழா' },
        { en: 'Birthday Celebration', ta: 'பிறந்தநாள் கொண்டாட்டம்' },
        { en: 'Pre-Wedding Functions', ta: 'திருமணத்திற்கு முந்தைய நிகழ்வுகள்' },
        { en: 'Post-Wedding Functions', ta: 'திருமணத்திற்கு பிந்தைய நிகழ்வுகள்' },
        { en: 'Other Small & Medium Family Functions', ta: 'பிற சிறிய மற்றும் நடுத்தர குடும்ப நிகழ்வுகள்' },
      ],
    },
    {
      code: 'ROYAL',
      bookingType: 'ONE_DAY' as const,
      durationType: 'FIXED_DAY' as const,
      durationValue: 1,
      pricingType: 'FIXED' as const,
      pricingAmount: 50000,
      displayNameEn: 'Royal Package',
      displayNameTa: 'அரச தொகுப்பு',
      functions: [
        { en: 'Reception Function Only', ta: 'வரவேற்பு நிகழ்வு மட்டும்' },
      ],
    },
    {
      code: 'GRAND',
      bookingType: 'TWO_DAY' as const,
      durationType: 'FIXED_DAY' as const,
      durationValue: 2,
      pricingType: 'FIXED' as const,
      pricingAmount: 100000,
      displayNameEn: 'Grand Package',
      displayNameTa: 'பெருமை தொகுப்பு',
      functions: [
        { en: 'Marriage Ceremony', ta: 'திருமண விழா' },
        { en: 'Reception Function', ta: 'வரவேற்பு நிகழ்வு' },
      ],
    },
  ];

  for (const pkg of packages) {
    await prisma.$transaction(async (tx) => {
      const existingPackage = await tx.mandapamPackage.findUnique({ where: { code: pkg.code } });
      if (existingPackage) {
        await tx.mandapamPackage.update({ where: { code: pkg.code }, data: { status: true } });
      } else {
        await tx.mandapamPackage.create({
          data: {
            code: pkg.code,
            bookingType: pkg.bookingType,
            durationType: pkg.durationType,
            durationValue: pkg.durationValue ?? null,
            status: true,
          },
        });
      }

      const mandapam = await tx.mandapamPackage.findUniqueOrThrow({ where: { code: pkg.code } });

      await tx.mandapamPackageTranslation.upsert({
        where: { packageId_language: { packageId: mandapam.id, language: 'EN' } },
        update: { displayName: pkg.displayNameEn },
        create: { packageId: mandapam.id, language: 'EN', displayName: pkg.displayNameEn },
      });
      await tx.mandapamPackageTranslation.upsert({
        where: { packageId_language: { packageId: mandapam.id, language: 'TA' } },
        update: { displayName: pkg.displayNameTa },
        create: { packageId: mandapam.id, language: 'TA', displayName: pkg.displayNameTa },
      });

      await tx.mandapamPackageFunction.deleteMany({ where: { packageId: mandapam.id } });

      for (let i = 0; i < pkg.functions.length; i++) {
        const fn = pkg.functions[i];
        const createdFn = await tx.mandapamPackageFunction.create({
          data: { packageId: mandapam.id, status: true },
        });
        await tx.mandapamPackageFunctionTranslation.create({
          data: { functionId: createdFn.id, language: 'EN', name: fn.en },
        });
        await tx.mandapamPackageFunctionTranslation.create({
          data: { functionId: createdFn.id, language: 'TA', name: fn.ta },
        });
      }

      const existingPricing = await tx.mandapamPackagePricing.findFirst({
        where: { packageId: mandapam.id, isActive: true },
      });
      if (!existingPricing) {
        await tx.mandapamPackagePricing.create({
          data: {
            packageId: mandapam.id,
            pricingType: pkg.pricingType,
            amount: pkg.pricingAmount,
            currencyCode: 'INR',
            isActive: true,
          },
        });
      }
    });
  }

  console.log(`Seeded ${packages.length} mandapam packages`);
}

async function seedMandapamFacilities() {
  const facilities = [
    { iconName: 'meeting_room', nameEn: 'Main Hall', nameTa: 'பிரதான மண்டபம்' },
    { iconName: 'restaurant', nameEn: 'Dining Hall', nameTa: 'உணவு மண்டபம்' },
    { iconName: 'buffet', nameEn: 'Buffet Hall', nameTa: 'பூஃபே மண்டபம்' },
    { iconName: 'local_parking', nameEn: 'General Parking Space', nameTa: 'பொது வாகன நிறுத்தம்' },
    { iconName: 'meeting_room', nameEn: 'Bride & Groom Rooms', nameTa: 'மணமகன் மற்றும் மணமகள் அறைகள்' },
    { iconName: 'kitchen', nameEn: 'Kitchen', nameTa: 'சமையலறை' },
    { iconName: 'hotel_class', nameEn: 'Extra Premium Rooms (If Required)', nameTa: 'கூடுதல் பிரீமியம் அறைகள் (தேவைப்பட்டால்)' },
    { iconName: 'local_parking', nameEn: 'Additional Parking Space (If Required)', nameTa: 'கூடுதல் வாகன நிறுத்தம் (தேவைப்பட்டால்)' },
    { iconName: 'ac_unit', nameEn: 'Air Conditioning (AC) Facility', nameTa: 'ஏர் கண்டிஷனிங் (ஏசி) வசதி' },
  ];

  for (const facility of facilities) {
    const existing = await prisma.mandapamFacility.findFirst({
      where: {
        translations: { some: { language: 'EN', name: facility.nameEn } },
      },
    });
    if (!existing) {
      await prisma.$transaction(async (tx) => {
        const created = await tx.mandapamFacility.create({
          data: { iconName: facility.iconName, status: true },
        });
        await tx.mandapamFacilityTranslation.create({
          data: { facilityId: created.id, language: 'EN', name: facility.nameEn },
        });
        await tx.mandapamFacilityTranslation.create({
          data: { facilityId: created.id, language: 'TA', name: facility.nameTa },
        });
      });
    }
  }

  console.log(`Seeded ${facilities.length} mandapam facilities`);
}

async function seedMandapamAddons() {
  const addons = [
    { iconName: 'restaurant_menu', pricingType: 'PER_EVENT' as const, supportsQuantity: false, nameEn: 'Catering Service', nameTa: 'கேட்டரிங் சேவை' },
    { iconName: 'photo_camera', pricingType: 'PER_EVENT' as const, supportsQuantity: false, nameEn: 'Photography', nameTa: 'புகைப்படம்' },
    { iconName: 'music_note', pricingType: 'PER_HOUR' as const, supportsQuantity: false, nameEn: 'DJ Service', nameTa: 'டிஜே சேவை' },
    { iconName: 'videocam', pricingType: 'PER_EVENT' as const, supportsQuantity: false, nameEn: 'Videography', nameTa: 'வீடியோகிராபி' },
    { iconName: 'palette', pricingType: 'PER_EVENT' as const, supportsQuantity: false, nameEn: 'Flower Decoration', nameTa: 'மலர் அலங்காரம்' },
  ];

  for (const addon of addons) {
    const existing = await prisma.mandapamAddonService.findFirst({
      where: { iconName: addon.iconName },
    });
    if (!existing) {
      await prisma.$transaction(async (tx) => {
        const created = await tx.mandapamAddonService.create({
          data: { iconName: addon.iconName, pricingType: addon.pricingType, supportsQuantity: addon.supportsQuantity, status: true },
        });
        await tx.mandapamAddonServiceTranslation.create({
          data: { addonId: created.id, language: 'EN', name: addon.nameEn },
        });
        await tx.mandapamAddonServiceTranslation.create({
          data: { addonId: created.id, language: 'TA', name: addon.nameTa },
        });
      });
    }
  }

  console.log(`Seeded ${addons.length} mandapam addons`);
}

async function seedMandapamTokens() {
  const count = await prisma.mandapamToken.count();
  if (count > 0) {
    console.log(`MandapamTokens already seeded (${count} records). Skipping.`);
    return;
  }

  const statuses: ('NOTUSED' | 'USED')[] = ['NOTUSED', 'NOTUSED', 'NOTUSED', 'NOTUSED', 'USED'];
  const tokens = Array.from({ length: 6000 }, (_, i) => {
    const tokenId = `MK${String(i + 1).padStart(4, '0')}`;
    return { tokenId, status: statuses[Math.floor(Math.random() * statuses.length)] as 'NOTUSED' | 'USED' };
  });

  await prisma.mandapamToken.createMany({ data: tokens });
  console.log(`Seeded ${tokens.length} MandapamTokens (${tokens.filter(t => t.status === 'NOTUSED').length} available, ${tokens.filter(t => t.status === 'USED').length} used)`);
}

async function seedDefaultAdmin() {
  const adminEmail = 'mohanurkongu@gmail.com';
  const existing = await prisma.accountCredential.findUnique({
    where: { email: adminEmail },
    include: { account: { include: { translations: true } } },
  });

  if (existing) {
    console.log('Admin account already exists — skipping');
    return;
  }

  const passwordHash = await argon2.hash('admin123', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
    hashLength: 32,
  });

  const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  if (!adminRole) throw new Error('ADMIN role not found — run seedRoles() first');

  const account = await prisma.account.create({
    data: {
      accountNo: 'ADMIN-01',
      translations: {
        create: [
          { language: 'EN', firstName: 'Admin', lastName: 'System', isDefault: true },
          { language: 'TA', firstName: 'அட்மின்', lastName: 'சிஸ்டம்', isDefault: false },
        ],
      },
      credential: {
        create: {
          email: adminEmail,
          phone: '+91-9080725466',
          passwordHash,
          emailVerified: true,
        },
      },
      roles: {
        create: { roleId: adminRole.id },
      },
      statusHistory: {
        create: { state: 'ACTIVE', reason: 'Admin account created', changedBy: 'system' },
      },
    },
    include: { credential: true, translations: true },
  });

  console.log(`Seeded admin: ${account.accountNo} / ${adminEmail} / admin123`);
}

async function setDevCascade() {
  if (process.env.NODE_ENV === 'production') {
    console.log('Production mode — skipping dev cascade override');
    return;
  }

  const constraints: { table: string; column: string; name: string }[] = [
    { table: 'account_credentials', column: 'accountId', name: 'account_credentials_accountId_fkey' },
    { table: 'account_roles', column: 'accountId', name: 'account_roles_accountId_fkey' },
    { table: 'subscriptions', column: 'accountId', name: 'subscriptions_accountId_fkey' },
    { table: 'account_sessions', column: 'accountId', name: 'account_sessions_accountId_fkey' },
    { table: 'account_status_history', column: 'accountId', name: 'account_status_history_accountId_fkey' },
    { table: 'profiles', column: 'accountId', name: 'profiles_accountId_fkey' },
  ];

  for (const { table, column, name } of constraints) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "${table}"
        DROP CONSTRAINT "${name}",
        ADD CONSTRAINT "${name}"
        FOREIGN KEY ("${column}") REFERENCES accounts(id)
        ON UPDATE CASCADE ON DELETE CASCADE;
    `);
  }

  console.log(`Dev mode — switched ${constraints.length} FK constraints to CASCADE`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
