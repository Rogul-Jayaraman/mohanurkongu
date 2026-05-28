import { PrismaClient } from '@prisma/client';

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

async function main() {
  await seedRoles();
  await seedPlans();
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
      where: { code: 'BASIC' },
      update: {},
      create: { code: 'BASIC', displayName: 'Basic', price: 0, currency: 'INR', active: true },
    }),
    prisma.membershipPlan.upsert({
      where: { code: 'PREMIUM' },
      update: {},
      create: { code: 'PREMIUM', displayName: 'Premium', price: 500, currency: 'INR', active: true },
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

async function setDevCascade() {
  if (process.env.NODE_ENV === 'production') {
    console.log('Production mode — skipping dev cascade override');
    return;
  }

  const constraints: { table: string; column: string; name: string }[] = [
    { table: 'account_credentials', column: 'accountId', name: 'account_credentials_accountId_fkey' },
    { table: 'account_roles', column: 'accountId', name: 'account_roles_accountId_fkey' },
    { table: 'account_memberships', column: 'accountId', name: 'account_memberships_accountId_fkey' },
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
