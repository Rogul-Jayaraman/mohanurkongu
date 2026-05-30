-- CreateEnum
CREATE TYPE "LanguageCode" AS ENUM ('EN', 'TA');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "MembershipPlanCode" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SearchLevel" AS ENUM ('BASIC', 'EXTENDED', 'ADVANCED', 'FULL');

-- CreateEnum
CREATE TYPE "ViewDetails" AS ENUM ('BASIC', 'EXTENDED', 'ADVANCED', 'FULL');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'EVENT_IN_PROGRESS', 'EVENT_COMPLETED', 'SETTLEMENT_PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingMethod" AS ENUM ('NORMAL_BOOKING', 'TOKEN_BOOKING');

-- CreateEnum
CREATE TYPE "CalendarEntryStatus" AS ENUM ('AVAILABLE', 'PARTIALLY_BOOKED', 'FULLY_BOOKED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "LedgerSource" AS ENUM ('PACKAGE', 'ADDON', 'SERVICE', 'DISCOUNT', 'DAMAGE', 'PENALTY', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PaymentEntryType" AS ENUM ('ADVANCE', 'INSTALLMENT', 'FINAL_PAYMENT');

-- CreateEnum
CREATE TYPE "RefundType" AS ENUM ('PARTIAL_REFUND', 'FULL_REFUND');

-- CreateEnum
CREATE TYPE "TokenState" AS ENUM ('CONSUMED', 'REVERSED');

-- CreateEnum
CREATE TYPE "SettlementState" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InvoiceState" AS ENUM ('DRAFT', 'GENERATED', 'VOID');

-- CreateEnum
CREATE TYPE "InvoiceLineType" AS ENUM ('PACKAGE', 'ADDON', 'SERVICE', 'DAMAGE', 'PENALTY', 'ADJUSTMENT', 'DISCOUNT');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('EMAIL', 'PHONE');

-- CreateEnum
CREATE TYPE "VerificationPurpose" AS ENUM ('REGISTER', 'RESET_PASSWORD');

-- CreateEnum
CREATE TYPE "VerificationState" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'REJECTED', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('TEMP', 'ATTACHED', 'ACTIVE', 'DELETE_PENDING', 'DELETED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Diet" AS ENUM ('VEGETARIAN', 'NON_VEGETARIAN', 'EGGETARIAN', 'VEGAN');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE');

-- CreateEnum
CREATE TYPE "Complexion" AS ENUM ('FAIR', 'WHEATISH', 'BROWN', 'DARK');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'ANNULED');

-- CreateEnum
CREATE TYPE "ResidenceType" AS ENUM ('OWNED', 'RENTED');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('HOURLY', 'DAY_BASED');

-- CreateEnum
CREATE TYPE "DurationType" AS ENUM ('CUSTOM_HOURS', 'FIXED_DAY');

-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('HOURLY', 'FIXED');

-- CreateEnum
CREATE TYPE "FacilityChargeType" AS ENUM ('GENERAL', 'ADDITIONAL');

-- CreateEnum
CREATE TYPE "HoroscopeMode" AS ENUM ('GENERATED', 'UPLOADED');

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "accountNo" VARCHAR(20) NOT NULL,
    "currentState" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
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
    "id" UUID NOT NULL,
    "code" "MembershipPlanCode" NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "displayPrice" DECIMAL(10,2) NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 0,
    "openLimit" INTEGER NOT NULL DEFAULT 10,
    "shortlistLimit" INTEGER NOT NULL DEFAULT 0,
    "profileSlotLimit" INTEGER NOT NULL DEFAULT 1,
    "viewDetails" "ViewDetails" NOT NULL DEFAULT 'BASIC',
    "printProfile" BOOLEAN NOT NULL DEFAULT false,
    "printHoroscope" BOOLEAN NOT NULL DEFAULT false,
    "searchLevel" "SearchLevel" NOT NULL DEFAULT 'BASIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "accountId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "assignedByAdminId" UUID,
    "paymentMethod" "PaymentMethod",
    "snapshotPlanCode" "MembershipPlanCode" NOT NULL,
    "snapshotPlanName" VARCHAR(100) NOT NULL,
    "snapshotDisplayPrice" DECIMAL(10,2) NOT NULL,
    "snapshotDurationDays" INTEGER NOT NULL DEFAULT 0,
    "snapshotOpenLimit" INTEGER NOT NULL DEFAULT 10,
    "snapshotShortlistLimit" INTEGER NOT NULL DEFAULT 0,
    "snapshotProfileSlotLimit" INTEGER NOT NULL DEFAULT 1,
    "snapshotViewDetails" "ViewDetails" NOT NULL DEFAULT 'BASIC',
    "snapshotPrintProfile" BOOLEAN NOT NULL DEFAULT false,
    "snapshotPrintHoroscope" BOOLEAN NOT NULL DEFAULT false,
    "snapshotSearchLevel" "SearchLevel" NOT NULL DEFAULT 'BASIC',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByAdminId" UUID,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "membership_usage" (
    "id" TEXT NOT NULL,
    "accountId" UUID NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "openUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_opens" (
    "id" TEXT NOT NULL,
    "viewerAccountId" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionId" TEXT NOT NULL,

    CONSTRAINT "profile_opens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_status_history" (
    "id" TEXT NOT NULL,
    "accountId" UUID NOT NULL,
    "state" "AccountStatus" NOT NULL,
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
    "publicId" VARCHAR(16) NOT NULL,
    "uploadToken" VARCHAR(32),
    "ownerAccountId" UUID NOT NULL,
    "objectKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'TEMP',
    "lastAccessedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "width" INTEGER,
    "height" INTEGER,
    "cleanupAttempts" INTEGER NOT NULL DEFAULT 0,
    "cleanupLastError" TEXT,
    "cleanupAbandonedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "attachedEntityType" VARCHAR(30),
    "attachedEntityId" UUID,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedBy" UUID,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" UUID,
    "rejectionReasonEn" TEXT,
    "rejectionReasonTa" TEXT,
    "archiveReasonEn" TEXT,
    "archiveReasonTa" TEXT,

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
    "horoscopeJson" JSONB,
    "generatedAt" TIMESTAMP(3),
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
    "currentCity" TEXT,
    "currentState" TEXT,
    "currentCountry" TEXT,
    "nativeCity" TEXT,
    "nativeState" TEXT,
    "nativeCountry" TEXT,
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

-- CreateTable
CREATE TABLE "verification_queue" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "assignedTo" UUID,
    "claimedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "lockedBy" UUID,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_reviews" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "action" "ReviewAction" NOT NULL,
    "reasonEn" VARCHAR(500),
    "reasonTa" VARCHAR(500),
    "reviewData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shortlists" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shortlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_events" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "profileId" UUID,
    "action" VARCHAR(30) NOT NULL,
    "metadata" JSONB,
    "ipAddress" VARCHAR(45),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_bookings" (
    "id" UUID NOT NULL,
    "bookingNo" VARCHAR(20) NOT NULL,
    "customerId" UUID NOT NULL,
    "customerName" JSONB NOT NULL,
    "customerPhone" VARCHAR(20) NOT NULL,
    "customerEmail" VARCHAR(255),
    "eventTitle" JSONB NOT NULL,
    "eventAddress" JSONB,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "bookingMethod" "BookingMethod" NOT NULL DEFAULT 'NORMAL_BOOKING',
    "packageCode" VARCHAR(50) NOT NULL,
    "bookingConfig" JSONB NOT NULL,
    "notes" TEXT,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandapam_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_booking_package_snapshots" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "packageId" UUID NOT NULL,
    "packageCode" VARCHAR(50) NOT NULL,
    "packageName" JSONB NOT NULL,
    "packagePrice" DECIMAL(12,2) NOT NULL,
    "packageVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mandapam_booking_package_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_booking_addon_snapshots" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "addonId" UUID NOT NULL,
    "addonName" JSONB NOT NULL,
    "pricingType" "PricingType" NOT NULL DEFAULT 'FIXED',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mandapam_booking_addon_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_calendar_entries" (
    "id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "CalendarEntryStatus" NOT NULL DEFAULT 'AVAILABLE',
    "reasonEn" VARCHAR(500),
    "reasonTa" VARCHAR(500),
    "bookingId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandapam_calendar_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_financial_ledgers" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "source" "LedgerSource" NOT NULL,
    "description" JSONB,
    "amount" DECIMAL(12,2) NOT NULL,
    "currencyCode" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mandapam_financial_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_payment_ledgers" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "paymentType" "PaymentEntryType" NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "referenceNo" VARCHAR(100),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mandapam_payment_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_refund_ledgers" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "refundType" "RefundType" NOT NULL,
    "refundMethod" "PaymentMethod",
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mandapam_refund_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_token_consumptions" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "tokens" INTEGER NOT NULL,
    "state" "TokenState" NOT NULL DEFAULT 'CONSUMED',
    "consumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversedAt" TIMESTAMP(3),

    CONSTRAINT "mandapam_token_consumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_settlements" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "state" "SettlementState" NOT NULL DEFAULT 'PENDING',
    "damageCharges" JSONB,
    "penaltyCharges" JSONB,
    "extraCharges" JSONB,
    "finalAmount" DECIMAL(12,2),
    "settledAt" TIMESTAMP(3),
    "settledBy" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandapam_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_invoices" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "invoiceNo" VARCHAR(20) NOT NULL,
    "state" "InvoiceState" NOT NULL DEFAULT 'DRAFT',
    "issuedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "voidReason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandapam_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_invoice_lines" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "lineType" "InvoiceLineType" NOT NULL,
    "description" JSONB,
    "amount" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mandapam_invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_booking_timelines" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "event" VARCHAR(50) NOT NULL,
    "metadata" JSONB,
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mandapam_booking_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_audit_logs" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "performedBy" UUID NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mandapam_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_packages" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "bookingType" "BookingType" NOT NULL,
    "durationType" "DurationType" NOT NULL,
    "durationValue" INTEGER,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandapam_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_package_translations" (
    "id" UUID NOT NULL,
    "packageId" UUID NOT NULL,
    "language" "LanguageCode" NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandapam_package_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_package_functions" (
    "id" UUID NOT NULL,
    "packageId" UUID NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandapam_package_functions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_package_function_translations" (
    "id" UUID NOT NULL,
    "functionId" UUID NOT NULL,
    "language" "LanguageCode" NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandapam_package_function_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_package_pricings" (
    "id" UUID NOT NULL,
    "packageId" UUID NOT NULL,
    "pricingType" "PricingType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currencyCode" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandapam_package_pricings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_facilities" (
    "id" UUID NOT NULL,
    "iconName" VARCHAR(100) NOT NULL,
    "chargeType" "FacilityChargeType" NOT NULL DEFAULT 'GENERAL',
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandapam_facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_facility_translations" (
    "id" UUID NOT NULL,
    "facilityId" UUID NOT NULL,
    "language" "LanguageCode" NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandapam_facility_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_addon_services" (
    "id" UUID NOT NULL,
    "iconName" VARCHAR(100) NOT NULL,
    "pricingType" "PricingType" NOT NULL DEFAULT 'FIXED',
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandapam_addon_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandapam_addon_service_translations" (
    "id" UUID NOT NULL,
    "addonId" UUID NOT NULL,
    "language" "LanguageCode" NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandapam_addon_service_translations_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "subscriptions_accountId_idx" ON "subscriptions"("accountId");

-- CreateIndex
CREATE INDEX "subscriptions_planId_idx" ON "subscriptions"("planId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_expiresAt_idx" ON "subscriptions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "membership_usage_accountId_key" ON "membership_usage"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "membership_usage_subscriptionId_key" ON "membership_usage"("subscriptionId");

-- CreateIndex
CREATE INDEX "profile_opens_viewerAccountId_idx" ON "profile_opens"("viewerAccountId");

-- CreateIndex
CREATE INDEX "profile_opens_profileId_idx" ON "profile_opens"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_opens_viewerAccountId_profileId_key" ON "profile_opens"("viewerAccountId", "profileId");

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
CREATE UNIQUE INDEX "uploads_publicId_key" ON "uploads"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "uploads_uploadToken_key" ON "uploads"("uploadToken");

-- CreateIndex
CREATE INDEX "uploads_ownerAccountId_idx" ON "uploads"("ownerAccountId");

-- CreateIndex
CREATE INDEX "uploads_status_idx" ON "uploads"("status");

-- CreateIndex
CREATE INDEX "uploads_publicId_idx" ON "uploads"("publicId");

-- CreateIndex
CREATE INDEX "uploads_status_updatedAt_idx" ON "uploads"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "uploads_status_createdAt_idx" ON "uploads"("status", "createdAt");

-- CreateIndex
CREATE INDEX "uploads_status_lastAccessedAt_idx" ON "uploads"("status", "lastAccessedAt");

-- CreateIndex
CREATE INDEX "uploads_attachedEntityId_status_idx" ON "uploads"("attachedEntityId", "status");

-- CreateIndex
CREATE INDEX "uploads_status_cleanupAttempts_idx" ON "uploads"("status", "cleanupAttempts");

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

-- CreateIndex
CREATE UNIQUE INDEX "verification_queue_profileId_key" ON "verification_queue"("profileId");

-- CreateIndex
CREATE INDEX "verification_queue_assignedTo_idx" ON "verification_queue"("assignedTo");

-- CreateIndex
CREATE INDEX "verification_queue_completedAt_idx" ON "verification_queue"("completedAt");

-- CreateIndex
CREATE INDEX "profile_reviews_profileId_createdAt_idx" ON "profile_reviews"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "shortlists_accountId_idx" ON "shortlists"("accountId");

-- CreateIndex
CREATE INDEX "shortlists_profileId_idx" ON "shortlists"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "shortlists_profileId_accountId_key" ON "shortlists"("profileId", "accountId");

-- CreateIndex
CREATE INDEX "admin_audit_events_actorId_createdAt_idx" ON "admin_audit_events"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "admin_audit_events_profileId_createdAt_idx" ON "admin_audit_events"("profileId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "mandapam_bookings_bookingNo_key" ON "mandapam_bookings"("bookingNo");

-- CreateIndex
CREATE INDEX "mandapam_bookings_status_idx" ON "mandapam_bookings"("status");

-- CreateIndex
CREATE INDEX "mandapam_bookings_packageCode_idx" ON "mandapam_bookings"("packageCode");

-- CreateIndex
CREATE INDEX "mandapam_bookings_createdAt_idx" ON "mandapam_bookings"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "mandapam_booking_package_snapshots_bookingId_key" ON "mandapam_booking_package_snapshots"("bookingId");

-- CreateIndex
CREATE INDEX "mandapam_booking_addon_snapshots_bookingId_idx" ON "mandapam_booking_addon_snapshots"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "mandapam_calendar_entries_date_key" ON "mandapam_calendar_entries"("date");

-- CreateIndex
CREATE INDEX "mandapam_calendar_entries_date_idx" ON "mandapam_calendar_entries"("date");

-- CreateIndex
CREATE INDEX "mandapam_calendar_entries_status_idx" ON "mandapam_calendar_entries"("status");

-- CreateIndex
CREATE INDEX "mandapam_financial_ledgers_bookingId_idx" ON "mandapam_financial_ledgers"("bookingId");

-- CreateIndex
CREATE INDEX "mandapam_financial_ledgers_source_idx" ON "mandapam_financial_ledgers"("source");

-- CreateIndex
CREATE INDEX "mandapam_payment_ledgers_bookingId_idx" ON "mandapam_payment_ledgers"("bookingId");

-- CreateIndex
CREATE INDEX "mandapam_payment_ledgers_paymentType_idx" ON "mandapam_payment_ledgers"("paymentType");

-- CreateIndex
CREATE INDEX "mandapam_refund_ledgers_bookingId_idx" ON "mandapam_refund_ledgers"("bookingId");

-- CreateIndex
CREATE INDEX "mandapam_token_consumptions_bookingId_idx" ON "mandapam_token_consumptions"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "mandapam_settlements_bookingId_key" ON "mandapam_settlements"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "mandapam_invoices_bookingId_key" ON "mandapam_invoices"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "mandapam_invoices_invoiceNo_key" ON "mandapam_invoices"("invoiceNo");

-- CreateIndex
CREATE INDEX "mandapam_invoices_invoiceNo_idx" ON "mandapam_invoices"("invoiceNo");

-- CreateIndex
CREATE INDEX "mandapam_invoice_lines_invoiceId_idx" ON "mandapam_invoice_lines"("invoiceId");

-- CreateIndex
CREATE INDEX "mandapam_booking_timelines_bookingId_createdAt_idx" ON "mandapam_booking_timelines"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "mandapam_audit_logs_bookingId_createdAt_idx" ON "mandapam_audit_logs"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "mandapam_audit_logs_performedBy_idx" ON "mandapam_audit_logs"("performedBy");

-- CreateIndex
CREATE UNIQUE INDEX "mandapam_packages_code_key" ON "mandapam_packages"("code");

-- CreateIndex
CREATE INDEX "mandapam_packages_code_idx" ON "mandapam_packages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "mandapam_package_translations_packageId_language_key" ON "mandapam_package_translations"("packageId", "language");

-- CreateIndex
CREATE INDEX "mandapam_package_functions_packageId_idx" ON "mandapam_package_functions"("packageId");

-- CreateIndex
CREATE UNIQUE INDEX "mandapam_package_function_translations_functionId_language_key" ON "mandapam_package_function_translations"("functionId", "language");

-- CreateIndex
CREATE INDEX "mandapam_package_pricings_packageId_idx" ON "mandapam_package_pricings"("packageId");

-- CreateIndex
CREATE INDEX "mandapam_package_pricings_packageId_isActive_idx" ON "mandapam_package_pricings"("packageId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "mandapam_facility_translations_facilityId_language_key" ON "mandapam_facility_translations"("facilityId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "mandapam_addon_service_translations_addonId_language_key" ON "mandapam_addon_service_translations"("addonId", "language");

-- AddForeignKey
ALTER TABLE "account_translations" ADD CONSTRAINT "account_translations_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_credentials" ADD CONSTRAINT "account_credentials_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_roles" ADD CONSTRAINT "account_roles_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_roles" ADD CONSTRAINT "account_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "membership_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_usage" ADD CONSTRAINT "membership_usage_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_usage" ADD CONSTRAINT "membership_usage_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_opens" ADD CONSTRAINT "profile_opens_viewerAccountId_fkey" FOREIGN KEY ("viewerAccountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_opens" ADD CONSTRAINT "profile_opens_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_opens" ADD CONSTRAINT "profile_opens_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_status_history" ADD CONSTRAINT "account_status_history_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "verification_queue" ADD CONSTRAINT "verification_queue_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_queue" ADD CONSTRAINT "verification_queue_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_reviews" ADD CONSTRAINT "profile_reviews_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_reviews" ADD CONSTRAINT "profile_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlists" ADD CONSTRAINT "shortlists_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlists" ADD CONSTRAINT "shortlists_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_events" ADD CONSTRAINT "admin_audit_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandapam_booking_package_snapshots" ADD CONSTRAINT "mandapam_booking_package_snapshots_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "mandapam_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandapam_booking_addon_snapshots" ADD CONSTRAINT "mandapam_booking_addon_snapshots_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "mandapam_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandapam_calendar_entries" ADD CONSTRAINT "mandapam_calendar_entries_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "mandapam_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandapam_financial_ledgers" ADD CONSTRAINT "mandapam_financial_ledgers_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "mandapam_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandapam_payment_ledgers" ADD CONSTRAINT "mandapam_payment_ledgers_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "mandapam_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandapam_refund_ledgers" ADD CONSTRAINT "mandapam_refund_ledgers_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "mandapam_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandapam_token_consumptions" ADD CONSTRAINT "mandapam_token_consumptions_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "mandapam_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandapam_settlements" ADD CONSTRAINT "mandapam_settlements_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "mandapam_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandapam_invoices" ADD CONSTRAINT "mandapam_invoices_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "mandapam_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandapam_invoice_lines" ADD CONSTRAINT "mandapam_invoice_lines_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "mandapam_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandapam_booking_timelines" ADD CONSTRAINT "mandapam_booking_timelines_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "mandapam_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandapam_audit_logs" ADD CONSTRAINT "mandapam_audit_logs_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "mandapam_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandapam_package_translations" ADD CONSTRAINT "mandapam_package_translations_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "mandapam_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandapam_package_functions" ADD CONSTRAINT "mandapam_package_functions_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "mandapam_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandapam_package_function_translations" ADD CONSTRAINT "mandapam_package_function_translations_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "mandapam_package_functions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandapam_package_pricings" ADD CONSTRAINT "mandapam_package_pricings_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "mandapam_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandapam_facility_translations" ADD CONSTRAINT "mandapam_facility_translations_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "mandapam_facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandapam_addon_service_translations" ADD CONSTRAINT "mandapam_addon_service_translations_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "mandapam_addon_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
