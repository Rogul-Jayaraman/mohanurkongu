-- CreateEnum
CREATE TYPE "AddonPricingType" AS ENUM ('ITEM', 'PER_EVENT', 'PER_HOUR');

-- AlterTable
ALTER TABLE "mandapam_addon_services" ADD COLUMN     "pricingType" "AddonPricingType" NOT NULL DEFAULT 'PER_EVENT';

-- AlterTable
ALTER TABLE "mandapam_booking_addon_snapshots" ADD COLUMN     "pricingType" "AddonPricingType" NOT NULL DEFAULT 'PER_EVENT';
