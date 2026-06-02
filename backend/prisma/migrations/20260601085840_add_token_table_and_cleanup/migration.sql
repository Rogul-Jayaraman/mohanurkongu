/*
  Warnings:

  - You are about to drop the column `pricingType` on the `mandapam_addon_services` table. All the data in the column will be lost.
  - You are about to drop the column `pricingType` on the `mandapam_booking_addon_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `chargeType` on the `mandapam_facilities` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TokenStatus" AS ENUM ('NOTUSED', 'RESERVED', 'USED');

-- AlterTable
ALTER TABLE "mandapam_addon_services" DROP COLUMN "pricingType";

-- AlterTable
ALTER TABLE "mandapam_booking_addon_snapshots" DROP COLUMN "pricingType";

-- AlterTable
ALTER TABLE "mandapam_facilities" DROP COLUMN "chargeType";

-- AlterTable
ALTER TABLE "mandapam_packages" ADD COLUMN     "tokenCount" INTEGER NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "FacilityChargeType";

-- CreateTable
CREATE TABLE "mandapam_tokens" (
    "id" UUID NOT NULL,
    "tokenId" VARCHAR(20) NOT NULL,
    "status" "TokenStatus" NOT NULL DEFAULT 'NOTUSED',
    "bookingId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandapam_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mandapam_tokens_tokenId_key" ON "mandapam_tokens"("tokenId");

-- CreateIndex
CREATE INDEX "mandapam_tokens_bookingId_idx" ON "mandapam_tokens"("bookingId");

-- CreateIndex
CREATE INDEX "mandapam_tokens_status_idx" ON "mandapam_tokens"("status");

-- AddForeignKey
ALTER TABLE "mandapam_tokens" ADD CONSTRAINT "mandapam_tokens_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "mandapam_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
