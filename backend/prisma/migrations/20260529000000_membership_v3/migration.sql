-- CreateEnum
CREATE TYPE "MembershipPlanCode" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SearchLevel" AS ENUM ('BASIC', 'EXTENDED', 'ADVANCED', 'FULL');

-- AlterEnum
BEGIN;
CREATE TYPE "AccountStatus_new" AS ENUM ('ACTIVE', 'SUSPENDED');
ALTER TABLE "public"."accounts" ALTER COLUMN "currentState" DROP DEFAULT;
ALTER TABLE "accounts" ALTER COLUMN "currentState" TYPE "AccountStatus_new" USING ("currentState"::text::"AccountStatus_new");
ALTER TABLE "account_status_history" ALTER COLUMN "state" TYPE "AccountStatus_new" USING ("state"::text::"AccountStatus_new");
ALTER TYPE "AccountStatus" RENAME TO "AccountStatus_old";
ALTER TYPE "AccountStatus_new" RENAME TO "AccountStatus";
DROP TYPE "public"."AccountStatus_old";
ALTER TABLE "accounts" ALTER COLUMN "currentState" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ProfileStatus_new" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'REJECTED', 'ARCHIVED', 'DELETED');
ALTER TABLE "profiles" ALTER COLUMN "currentStatus" TYPE "ProfileStatus_new" USING ("currentStatus"::text::"ProfileStatus_new");
ALTER TABLE "profile_state_history" ALTER COLUMN "fromStatus" TYPE "ProfileStatus_new" USING ("fromStatus"::text::"ProfileStatus_new");
ALTER TABLE "profile_state_history" ALTER COLUMN "toStatus" TYPE "ProfileStatus_new" USING ("toStatus"::text::"ProfileStatus_new");
ALTER TYPE "ProfileStatus" RENAME TO "ProfileStatus_old";
ALTER TYPE "ProfileStatus_new" RENAME TO "ProfileStatus";
DROP TYPE "public"."ProfileStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "account_memberships" DROP CONSTRAINT "account_memberships_accountId_fkey";

-- DropForeignKey
ALTER TABLE "account_memberships" DROP CONSTRAINT "account_memberships_planId_fkey";

-- AlterTable
ALTER TABLE "membership_plans" DROP COLUMN "active",
DROP COLUMN "currency",
DROP COLUMN "price",
ADD COLUMN     "contactAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "displayPrice" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "durationDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fullHoroscopeAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "openLimit" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "printHoroscope" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "printProfile" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileSlotLimit" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "searchLevel" "SearchLevel" NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "shortlistLimit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "code",
ADD COLUMN     "code" "MembershipPlanCode" NOT NULL;

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "visibility",
ADD COLUMN     "archiveReasonEn" TEXT,
ADD COLUMN     "archiveReasonTa" TEXT;

-- DropTable
DROP TABLE "account_memberships";

-- DropEnum
DROP TYPE "Visibility";

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "accountId" UUID NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "assignedByAdminId" UUID,
    "snapshotPlanCode" "MembershipPlanCode" NOT NULL,
    "snapshotPlanName" VARCHAR(100) NOT NULL,
    "snapshotDisplayPrice" DECIMAL(10,2) NOT NULL,
    "snapshotDurationDays" INTEGER NOT NULL DEFAULT 0,
    "snapshotOpenLimit" INTEGER NOT NULL DEFAULT 10,
    "snapshotShortlistLimit" INTEGER NOT NULL DEFAULT 0,
    "snapshotProfileSlotLimit" INTEGER NOT NULL DEFAULT 1,
    "snapshotContactAccess" BOOLEAN NOT NULL DEFAULT false,
    "snapshotFullHoroscopeAccess" BOOLEAN NOT NULL DEFAULT false,
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
CREATE TABLE "shortlists" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shortlists_pkey" PRIMARY KEY ("id")
);

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
CREATE INDEX "shortlists_accountId_idx" ON "shortlists"("accountId");

-- CreateIndex
CREATE INDEX "shortlists_profileId_idx" ON "shortlists"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "shortlists_profileId_accountId_key" ON "shortlists"("profileId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "membership_plans_code_key" ON "membership_plans"("code");

-- CreateIndex
CREATE INDEX "profile_horoscopes_rasiId_idx" ON "profile_horoscopes"("rasiId");

-- CreateIndex
CREATE INDEX "profile_horoscopes_nakshatraId_idx" ON "profile_horoscopes"("nakshatraId");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "membership_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_usage" ADD CONSTRAINT "membership_usage_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_usage" ADD CONSTRAINT "membership_usage_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_opens" ADD CONSTRAINT "profile_opens_viewerAccountId_fkey" FOREIGN KEY ("viewerAccountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_opens" ADD CONSTRAINT "profile_opens_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_opens" ADD CONSTRAINT "profile_opens_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlists" ADD CONSTRAINT "shortlists_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlists" ADD CONSTRAINT "shortlists_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

