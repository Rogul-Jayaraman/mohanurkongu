/*
  Warnings:

  - You are about to drop the column `city` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `locations` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProfileStatus" ADD VALUE 'PENDING';
ALTER TYPE "ProfileStatus" ADD VALUE 'REJECTED';

-- DropIndex
DROP INDEX "profiles_accountId_key";

-- AlterTable
ALTER TABLE "locations" DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "state";

-- AlterTable
ALTER TABLE "profile_translations" ADD COLUMN     "currentCity" TEXT,
ADD COLUMN     "currentCountry" TEXT,
ADD COLUMN     "currentState" TEXT,
ADD COLUMN     "nativeCity" TEXT,
ADD COLUMN     "nativeCountry" TEXT,
ADD COLUMN     "nativeState" TEXT;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" UUID,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedBy" UUID,
ADD COLUMN     "rejectionReasonEn" TEXT,
ADD COLUMN     "rejectionReasonTa" TEXT;
