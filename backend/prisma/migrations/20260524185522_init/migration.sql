-- CreateEnum
CREATE TYPE "LanguageCode" AS ENUM ('EN', 'TA');

-- CreateEnum
CREATE TYPE "AccountState" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('EMAIL', 'PHONE');

-- CreateEnum
CREATE TYPE "VerificationPurpose" AS ENUM ('REGISTER', 'RESET_PASSWORD');

-- CreateEnum
CREATE TYPE "VerificationState" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('TEMP', 'DRAFT', 'ACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "Diet" AS ENUM ('VEGETARIAN', 'NON_VEGETARIAN', 'EGGETARIAN', 'VEGAN');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE');

-- CreateEnum
CREATE TYPE "Complexion" AS ENUM ('FAIR', 'WHEATISH', 'BROWN', 'DARK');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'ANNULED');

-- CreateEnum
CREATE TYPE "ResidenceType" AS ENUM ('OWNED', 'RENTED', 'PARENTAL', 'LEASED');

-- CreateEnum
CREATE TYPE "HoroscopeMode" AS ENUM ('MANUAL', 'GENERATED', 'UPLOADED');

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "accountNo" VARCHAR(20) NOT NULL,
    "currentState" "AccountState" NOT NULL DEFAULT 'ACTIVE',
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_translations" (
    "id" TEXT NOT NULL,
    "accountId" UUID NOT NULL,
    "language" "LanguageCode" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_credentials" (
    "accountId" UUID NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "passwordHash" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_credentials_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "code" "RoleCode" NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_roles" (
    "accountId" UUID NOT NULL,
    "roleId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_roles_pkey" PRIMARY KEY ("accountId","roleId")
);

-- CreateTable
CREATE TABLE "membership_plans" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "membership_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_memberships" (
    "id" TEXT NOT NULL,
    "accountId" UUID NOT NULL,
    "planId" TEXT NOT NULL,
    "planCode" VARCHAR(50) NOT NULL,
    "planName" VARCHAR(100) NOT NULL,
    "planPrice" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "account_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_status_history" (
    "id" TEXT NOT NULL,
    "accountId" UUID NOT NULL,
    "state" "AccountState" NOT NULL,
    "reason" TEXT,
    "changedBy" VARCHAR(50),
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_verifications" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "type" "VerificationType" NOT NULL,
    "purpose" "VerificationPurpose" NOT NULL,
    "target" VARCHAR(255) NOT NULL,
    "otpHash" TEXT NOT NULL,
    "state" "VerificationState" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_sessions" (
    "id" TEXT NOT NULL,
    "accountId" UUID NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "tokenFamily" VARCHAR(36) NOT NULL,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "userAgentHash" TEXT,
    "ipHash" TEXT,
    "deviceFingerprint" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_sessions" (
    "id" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "snapshotTarget" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reset_sessions" (
    "id" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "snapshotTarget" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reset_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counters" (
    "id" SERIAL NOT NULL,
    "prefix" VARCHAR(10) NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploads" (
    "id" UUID NOT NULL,
    "ownerAccountId" UUID NOT NULL,
    "objectKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "checksum" TEXT,
    "status" "UploadStatus" NOT NULL DEFAULT 'TEMP',
    "lastAccessedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publish_logs" (
    "id" UUID NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "profileId" UUID NOT NULL,
    "regNo" TEXT NOT NULL,
    "accountId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publish_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_fors" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,

    CONSTRAINT "profile_fors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communities" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "castes" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "communityId" INTEGER NOT NULL,

    CONSTRAINT "castes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heights" (
    "id" SERIAL NOT NULL,
    "valueCm" INTEGER NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "heights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_sectors" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "job_sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taluks" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "districtId" INTEGER NOT NULL,

    CONSTRAINT "taluks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kulams" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "kulams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risis" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "risis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nakshatras" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "nakshatras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lagnas" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "lagnas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "isOther" BOOLEAN NOT NULL DEFAULT false,
    "districtId" INTEGER,
    "talukId" INTEGER,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "regNo" TEXT,
    "currentStatus" "ProfileStatus" NOT NULL,
    "visibility" "Visibility" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_basic" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "profileForId" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "diet" "Diet" NOT NULL,
    "bloodGroup" "BloodGroup",
    "heightId" INTEGER NOT NULL,
    "weight" INTEGER,
    "complexion" "Complexion",
    "maritalStatus" "MaritalStatus",
    "currentLocationId" UUID,
    "nativeLocationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_basic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_communities" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "communityId" INTEGER NOT NULL,
    "casteId" INTEGER NOT NULL,
    "kulamId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_professional" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "education" TEXT,
    "jobSectorId" INTEGER,
    "jobDetail" TEXT,
    "jobLocation" TEXT,
    "monthlySalary" DECIMAL(12,2),
    "salaryCurrency" TEXT DEFAULT 'INR',
    "companyName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_family" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "fatherAlive" BOOLEAN NOT NULL,
    "fatherName" TEXT,
    "fatherJob" TEXT,
    "fatherSalary" INTEGER,
    "motherAlive" BOOLEAN NOT NULL,
    "motherName" TEXT,
    "motherJob" TEXT,
    "motherSalary" INTEGER,
    "noOfBrother" INTEGER,
    "noOfSister" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_horoscopes" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "mode" "HoroscopeMode" NOT NULL,
    "birthTime" TIMESTAMP(3),
    "birthPlace" TEXT,
    "birthLat" DECIMAL(10,7),
    "birthLong" DECIMAL(10,7),
    "timezone" TEXT,
    "ayanamsa" TEXT,
    "generatedAt" TIMESTAMP(3),
    "horoscopeJson" JSONB,
    "rasiId" INTEGER,
    "nakshatraId" INTEGER,
    "lagnaId" INTEGER,
    "rasiChartUploadId" UUID,
    "navamsaChartUploadId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_horoscopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_photos" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "primaryUploadId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_gallery_photos" (
    "id" UUID NOT NULL,
    "profilePhotoId" UUID NOT NULL,
    "uploadId" UUID NOT NULL,

    CONSTRAINT "profile_gallery_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_assets" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "land" TEXT,
    "residenceType" "ResidenceType",
    "otherAssets" TEXT,
    "vehicle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_preferences" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "heightMinId" INTEGER,
    "heightMaxId" INTEGER,
    "monthlySalary" DECIMAL(12,2),
    "salaryCurrency" TEXT DEFAULT 'INR',
    "expectationNote" TEXT,
    "preferredLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_translations" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "language" "LanguageCode" NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "kuladeivam" TEXT,
    "fatherName" TEXT,
    "motherName" TEXT,
    "jobLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_state_history" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "changedByAccountId" UUID,
    "fromStatus" "ProfileStatus",
    "toStatus" "ProfileStatus" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_state_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_accountNo_key" ON "accounts"("accountNo");

-- CreateIndex
CREATE INDEX "accounts_accountNo_idx" ON "accounts"("accountNo");

-- CreateIndex
CREATE INDEX "accounts_currentState_idx" ON "accounts"("currentState");

-- CreateIndex
CREATE INDEX "account_translations_accountId_idx" ON "account_translations"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "account_translations_accountId_language_key" ON "account_translations"("accountId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "account_credentials_email_key" ON "account_credentials"("email");

-- CreateIndex
CREATE UNIQUE INDEX "account_credentials_phone_key" ON "account_credentials"("phone");

-- CreateIndex
CREATE INDEX "account_credentials_email_idx" ON "account_credentials"("email");

-- CreateIndex
CREATE INDEX "account_credentials_phone_idx" ON "account_credentials"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "membership_plans_code_key" ON "membership_plans"("code");

-- CreateIndex
CREATE INDEX "account_memberships_accountId_idx" ON "account_memberships"("accountId");

-- CreateIndex
CREATE INDEX "account_memberships_planId_idx" ON "account_memberships"("planId");

-- CreateIndex
CREATE INDEX "account_status_history_accountId_changedAt_idx" ON "account_status_history"("accountId", "changedAt");

-- CreateIndex
CREATE INDEX "account_verifications_target_idx" ON "account_verifications"("target");

-- CreateIndex
CREATE INDEX "account_verifications_state_idx" ON "account_verifications"("state");

-- CreateIndex
CREATE INDEX "account_verifications_expiresAt_idx" ON "account_verifications"("expiresAt");

-- CreateIndex
CREATE INDEX "account_verifications_target_purpose_idx" ON "account_verifications"("target", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "account_sessions_refreshTokenHash_key" ON "account_sessions"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "account_sessions_accountId_idx" ON "account_sessions"("accountId");

-- CreateIndex
CREATE INDEX "account_sessions_tokenFamily_idx" ON "account_sessions"("tokenFamily");

-- CreateIndex
CREATE INDEX "account_sessions_expiresAt_idx" ON "account_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "registration_sessions_verificationId_idx" ON "registration_sessions"("verificationId");

-- CreateIndex
CREATE INDEX "registration_sessions_expiresAt_idx" ON "registration_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "reset_sessions_verificationId_idx" ON "reset_sessions"("verificationId");

-- CreateIndex
CREATE INDEX "reset_sessions_expiresAt_idx" ON "reset_sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "counters_prefix_key" ON "counters"("prefix");

-- CreateIndex
CREATE INDEX "uploads_ownerAccountId_idx" ON "uploads"("ownerAccountId");

-- CreateIndex
CREATE INDEX "uploads_status_idx" ON "uploads"("status");

-- CreateIndex
CREATE UNIQUE INDEX "publish_logs_idempotencyKey_key" ON "publish_logs"("idempotencyKey");

-- CreateIndex
CREATE INDEX "publish_logs_accountId_idx" ON "publish_logs"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_fors_code_key" ON "profile_fors"("code");

-- CreateIndex
CREATE UNIQUE INDEX "communities_code_key" ON "communities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "castes_communityId_code_key" ON "castes"("communityId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "heights_valueCm_key" ON "heights"("valueCm");

-- CreateIndex
CREATE UNIQUE INDEX "job_sectors_code_key" ON "job_sectors"("code");

-- CreateIndex
CREATE UNIQUE INDEX "districts_code_key" ON "districts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "taluks_districtId_code_key" ON "taluks"("districtId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "kulams_code_key" ON "kulams"("code");

-- CreateIndex
CREATE UNIQUE INDEX "risis_code_key" ON "risis"("code");

-- CreateIndex
CREATE UNIQUE INDEX "nakshatras_code_key" ON "nakshatras"("code");

-- CreateIndex
CREATE UNIQUE INDEX "lagnas_code_key" ON "lagnas"("code");

-- CreateIndex
CREATE INDEX "locations_districtId_idx" ON "locations"("districtId");

-- CreateIndex
CREATE INDEX "locations_talukId_idx" ON "locations"("talukId");

-- CreateIndex
CREATE INDEX "locations_isOther_idx" ON "locations"("isOther");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_accountId_key" ON "profiles"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_regNo_key" ON "profiles"("regNo");

-- CreateIndex
CREATE INDEX "profiles_accountId_idx" ON "profiles"("accountId");

-- CreateIndex
CREATE INDEX "profiles_currentStatus_idx" ON "profiles"("currentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "profile_basic_profileId_key" ON "profile_basic"("profileId");

-- CreateIndex
CREATE INDEX "profile_basic_gender_idx" ON "profile_basic"("gender");

-- CreateIndex
CREATE INDEX "profile_basic_dob_idx" ON "profile_basic"("dob");

-- CreateIndex
CREATE INDEX "profile_basic_gender_dob_idx" ON "profile_basic"("gender", "dob");

-- CreateIndex
CREATE INDEX "profile_basic_heightId_idx" ON "profile_basic"("heightId");

-- CreateIndex
CREATE INDEX "profile_basic_currentLocationId_idx" ON "profile_basic"("currentLocationId");

-- CreateIndex
CREATE INDEX "profile_basic_nativeLocationId_idx" ON "profile_basic"("nativeLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_communities_profileId_key" ON "profile_communities"("profileId");

-- CreateIndex
CREATE INDEX "profile_communities_communityId_casteId_idx" ON "profile_communities"("communityId", "casteId");

-- CreateIndex
CREATE INDEX "profile_communities_kulamId_idx" ON "profile_communities"("kulamId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_professional_profileId_key" ON "profile_professional"("profileId");

-- CreateIndex
CREATE INDEX "profile_professional_jobSectorId_idx" ON "profile_professional"("jobSectorId");

-- CreateIndex
CREATE INDEX "profile_professional_monthlySalary_idx" ON "profile_professional"("monthlySalary");

-- CreateIndex
CREATE INDEX "profile_professional_jobLocation_idx" ON "profile_professional"("jobLocation");

-- CreateIndex
CREATE UNIQUE INDEX "profile_family_profileId_key" ON "profile_family"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_horoscopes_profileId_key" ON "profile_horoscopes"("profileId");

-- CreateIndex
CREATE INDEX "profile_horoscopes_rasiId_idx" ON "profile_horoscopes"("rasiId");

-- CreateIndex
CREATE INDEX "profile_horoscopes_nakshatraId_idx" ON "profile_horoscopes"("nakshatraId");

-- CreateIndex
CREATE INDEX "profile_horoscopes_lagnaId_idx" ON "profile_horoscopes"("lagnaId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_photos_profileId_key" ON "profile_photos"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_photos_primaryUploadId_key" ON "profile_photos"("primaryUploadId");

-- CreateIndex
CREATE INDEX "profile_gallery_photos_uploadId_idx" ON "profile_gallery_photos"("uploadId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_gallery_photos_profilePhotoId_uploadId_key" ON "profile_gallery_photos"("profilePhotoId", "uploadId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_assets_profileId_key" ON "profile_assets"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_preferences_profileId_key" ON "partner_preferences"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_translations_profileId_language_key" ON "profile_translations"("profileId", "language");

-- CreateIndex
CREATE INDEX "profile_state_history_profileId_createdAt_idx" ON "profile_state_history"("profileId", "createdAt");

-- AddForeignKey
ALTER TABLE "account_translations" ADD CONSTRAINT "account_translations_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_credentials" ADD CONSTRAINT "account_credentials_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_roles" ADD CONSTRAINT "account_roles_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_roles" ADD CONSTRAINT "account_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_memberships" ADD CONSTRAINT "account_memberships_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_memberships" ADD CONSTRAINT "account_memberships_planId_fkey" FOREIGN KEY ("planId") REFERENCES "membership_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_status_history" ADD CONSTRAINT "account_status_history_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_sessions" ADD CONSTRAINT "account_sessions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_ownerAccountId_fkey" FOREIGN KEY ("ownerAccountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "castes" ADD CONSTRAINT "castes_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taluks" ADD CONSTRAINT "taluks_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_talukId_fkey" FOREIGN KEY ("talukId") REFERENCES "taluks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_basic" ADD CONSTRAINT "profile_basic_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_basic" ADD CONSTRAINT "profile_basic_profileForId_fkey" FOREIGN KEY ("profileForId") REFERENCES "profile_fors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_basic" ADD CONSTRAINT "profile_basic_heightId_fkey" FOREIGN KEY ("heightId") REFERENCES "heights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_basic" ADD CONSTRAINT "profile_basic_currentLocationId_fkey" FOREIGN KEY ("currentLocationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_basic" ADD CONSTRAINT "profile_basic_nativeLocationId_fkey" FOREIGN KEY ("nativeLocationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_communities" ADD CONSTRAINT "profile_communities_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_communities" ADD CONSTRAINT "profile_communities_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_communities" ADD CONSTRAINT "profile_communities_casteId_fkey" FOREIGN KEY ("casteId") REFERENCES "castes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_communities" ADD CONSTRAINT "profile_communities_kulamId_fkey" FOREIGN KEY ("kulamId") REFERENCES "kulams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_professional" ADD CONSTRAINT "profile_professional_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_professional" ADD CONSTRAINT "profile_professional_jobSectorId_fkey" FOREIGN KEY ("jobSectorId") REFERENCES "job_sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_family" ADD CONSTRAINT "profile_family_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_horoscopes" ADD CONSTRAINT "profile_horoscopes_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_horoscopes" ADD CONSTRAINT "profile_horoscopes_rasiId_fkey" FOREIGN KEY ("rasiId") REFERENCES "risis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_horoscopes" ADD CONSTRAINT "profile_horoscopes_nakshatraId_fkey" FOREIGN KEY ("nakshatraId") REFERENCES "nakshatras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_horoscopes" ADD CONSTRAINT "profile_horoscopes_lagnaId_fkey" FOREIGN KEY ("lagnaId") REFERENCES "lagnas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_horoscopes" ADD CONSTRAINT "profile_horoscopes_rasiChartUploadId_fkey" FOREIGN KEY ("rasiChartUploadId") REFERENCES "uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_horoscopes" ADD CONSTRAINT "profile_horoscopes_navamsaChartUploadId_fkey" FOREIGN KEY ("navamsaChartUploadId") REFERENCES "uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_photos" ADD CONSTRAINT "profile_photos_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_photos" ADD CONSTRAINT "profile_photos_primaryUploadId_fkey" FOREIGN KEY ("primaryUploadId") REFERENCES "uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_gallery_photos" ADD CONSTRAINT "profile_gallery_photos_profilePhotoId_fkey" FOREIGN KEY ("profilePhotoId") REFERENCES "profile_photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_gallery_photos" ADD CONSTRAINT "profile_gallery_photos_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "uploads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_assets" ADD CONSTRAINT "profile_assets_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_preferences" ADD CONSTRAINT "partner_preferences_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_preferences" ADD CONSTRAINT "partner_preferences_heightMinId_fkey" FOREIGN KEY ("heightMinId") REFERENCES "heights"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_preferences" ADD CONSTRAINT "partner_preferences_heightMaxId_fkey" FOREIGN KEY ("heightMaxId") REFERENCES "heights"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_translations" ADD CONSTRAINT "profile_translations_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_state_history" ADD CONSTRAINT "profile_state_history_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
