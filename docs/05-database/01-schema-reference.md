# Database Schema Reference

## Complete Model Reference

### User Model
```prisma
model User {
    id                String          @id @default(uuid())
    serialInt         Int             @default(autoincrement())
    customId          String          @unique  // e.g., "USR-0001"
    fullnameEn        String
    fullnameTa        String
    email             String          @unique
    phone             String          @unique
    password          String          // bcrypt hash
    role              AccountRole     @default(USER)
    plan              AccountPlan     @default(BASIC)
    planExpiry        DateTime?
    accountStatus     AccountStatus   @default(ACTIVE)
    suspensionReasonEn String?
    suspensionReasonTa String?
    suspendedAt       DateTime?
    otp               String?         // hashed OTP
    otpExpiry         DateTime?
    createdAt         DateTime        @default(now())
    updatedAt         DateTime        @updatedAt
    
    profiles          Profile[]
    planTransactions  PlanTransaction[]
}
```

### Profile Model
```prisma
model Profile {
    id              String              @id @default(uuid())
    userId          String
    regNo           String              @unique  // "CBE-2024-0001"
    profileFor      ProfileFor
    gender          Gender
    fullnameEn      String
    fullnameTa      String
    dateOfBirth     String              // "YYYY-MM-DD"
    age             Int
    height          Int                 // cm
    weight          Int?
    maritalStatus   MaritalStatus
    diet            Diet?
    complexion      Complexion?
    bloodGroup      String?
    physicalStatus  String?
    highestEducation String?
    educationDetails String?
    jobSector       JobSector?
    jobDetails      String?
    salaryMonthly   Int?
    currency        String?
    currentCountry  String?
    currentDistrict String?
    currentCity     String?
    nativeCountry   String?
    nativeDistrict  String?
    nativeCity      String?
    residence       Residence?
    kulam           String?
    rasi            String?
    star            String?
    dosham          Dosham?
    fatherName      String?
    motherName      String?
    siblings        Int?
    brotherInfo     String?
    sisterInfo      String?
    familyStatus    String?
    familyType      String?
    familyOrigin    String?
    aboutEn         String?
    aboutTa         String?
    partnerAgeMin   Int?
    partnerAgeMax   Int?
    partnerHeightMin Int?
    partnerHeightMax Int?
    partnerEducation String?
    partnerJob      String?
    partnerSalary   String?
    partnerKulam    String?
    partnerDosham   String?
    expectationsEn  String?
    expectationsTa  String?
    profilePhoto    String?             // Cloudinary URL
    gallery         String[]            // Cloudinary URLs
    status          ProfileVisibility   @default(DRAFT)
    adminVerified   VerificationStatus  @default(PENDING)
    verifiedBy      String?
    verifiedAt      DateTime?
    rejectionReason String?
    statusReason    String?
    createdAt       DateTime            @default(now())
    updatedAt       DateTime            @updatedAt
    
    user            User                @relation(fields: [userId], references: [id], onDelete: Cascade)
    horoscope       Horoscope?
    shortlistedBy   Shortlist[]
    
    @@index([gender, status, adminVerified])
    @@index([currentDistrict])
    @@index([kulam])
    @@index([age])
    @@index([salaryMonthly])
    @@index([height])
    @@index([dosham])
    @@index([rasi])
    @@index([maritalStatus])
    @@index([star])
    @@index([diet])
    @@index([userId])
}
```

### Horoscope Model
```prisma
model Horoscope {
    id          String        @id @default(uuid())
    profileId   String        @unique
    mode        HoroscopeMode // CREATE or UPLOAD
    rasi        String        // JSON — Rasi chart data
    navamsa     String        // JSON — Navamsa chart data
    updatedAt   DateTime      @updatedAt
    
    profile     Profile       @relation(fields: [profileId], references: [id], onDelete: Cascade)
}
```

### Shortlist Model
```prisma
model Shortlist {
    id          String   @id @default(uuid())
    profileId   String
    userId      String
    createdAt   DateTime @default(now())
    
    profile     Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
    
    @@unique([profileId, userId])
    @@index([userId])
}
```

### MandapamPackage Model
```prisma
model MandapamPackage {
    id          String   @id @default(uuid())
    nameEn      String
    nameTa      String
    price       Float
    featuresEn  String[]
    featuresTa  String[]
    isActive    Boolean  @default(true)
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    
    bookings    MandapamBooking[]
}
```

### MandapamBooking Model
```prisma
model MandapamBooking {
    id                  String                @id @default(uuid())
    serialInt           Int                   @default(autoincrement())
    eventId             String                @unique
    date                DateTime              // date only
    session             MandapamSession
    eventTitleEn        String
    eventTitleTa        String
    contactNameEn       String
    contactNameTa       String
    phone               String
    email               String
    addressEn           String?
    addressTa           String?
    packageId           String?
    packageNameEn       String?               // Snapshot
    packageNameTa       String?               // Snapshot
    packageSnapshotPrice Float?               // Snapshot
    status              MandapamBookingStatus @default(UPCOMING)
    paymentMode         MandapamPaymentMode   @default(NONE)
    paymentStatus       MandapamPaymentStatus @default(NOT_PAID)
    totalAmount         Float
    paidAmount          Float                 @default(0)
    balance             Float                 @default(0)
    createdBy           String                // Admin ID
    createdAt           DateTime              @default(now())
    updatedAt           DateTime              @updatedAt
    
    package             MandapamPackage?      @relation(fields: [packageId], references: [id])
    admin               Admin                 @relation(fields: [createdBy], references: [id])
    
    @@unique([date, session])
    @@index([date])
    @@index([paymentStatus])
    @@index([createdBy])
}
```

### PlanTransaction Model
```prisma
model PlanTransaction {
    id          String      @id @default(uuid())
    userId      String
    plan        AccountPlan
    months      Int
    amount      Float
    paymentMode String?
    startDate   DateTime
    endDate     DateTime
    note        String?
    createdAt   DateTime    @default(now())
    
    user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Supporting Models
```prisma
model Admin {
    id          String   @id @default(uuid())
    fullnameEn  String
    fullnameTa  String
    email       String   @unique
    phone       String   @unique
    password    String   // bcrypt hash
    otp         String?
    otpExpiry   DateTime?
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    
    bookings    MandapamBooking[] @relation("AdminBookings")
}

model Verification {
    id        String   @id @default(uuid())
    email     String   @unique
    otp       String   // hashed
    expiresAt DateTime
    createdAt DateTime @default(now())
}

model BlockedDate {
    id        String   @id @default(uuid())
    date      DateTime @unique
    reasonEn  String
    reasonTa  String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
}

model RegistrationCounter {
    districtCode String @id
    count        Int    @default(0)
}

model AppSettings {
    key       String   @id
    value     String
    updatedAt DateTime @updatedAt
}
```

## Enum Reference

See [Database Architecture / Enum Design](../02-system-architecture/03-database-architecture.md) for full enum listing.

## Snapshot Pattern (Booking Denormalization)

The `MandapamBooking` model stores snapshots of package data:
```
packageNameEn, packageNameTa, packageSnapshotPrice
```

**Why**: If a package is updated or deleted after a booking is made, the booking still references the correct historical price and name. Without snapshots, changing a package price would retroactively affect all past bookings.

## Soft Delete Strategy

**Current**: No soft delete. Records are:
- **Profiles**: `status = 'INACTIVE'` or `status = 'DRAFT'` instead of delete
- **Users**: `accountStatus = 'SUSPENDED'` instead of delete
- **Bookings**: `status = 'CANCELLED'` instead of delete
- **Packages**: `isActive = false` instead of delete

Only truly deletable: `Shortlist` entries, `Verification` records (after OTP expiry), `BlockedDate` entries.

## What NOT To Do

- ❌ Do NOT remove snapshot fields from Booking — historical integrity depends on them
- ❌ Do NOT add FK constraints on `Shortlist.userId` — it references User but flexibly
- ❌ Do NOT add composite keys when UUID `id` works — Prisma optimizes for UUID
- ❌ Do NOT cascade delete from User to Profile without warning
- ❌ Do NOT convert JSON fields (Horoscope.rasi) to separate tables unless querying sub-fields
