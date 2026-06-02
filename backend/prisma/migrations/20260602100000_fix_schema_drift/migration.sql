-- Add PER_DAY to AddonPricingType enum
ALTER TYPE "AddonPricingType" ADD VALUE 'PER_DAY';

-- Add supportsQuantity column to mandapam_addon_services
ALTER TABLE "mandapam_addon_services" ADD COLUMN "supportsQuantity" BOOLEAN NOT NULL DEFAULT false;

-- Drop amount column from mandapam_addon_services (not in schema)
ALTER TABLE "mandapam_addon_services" DROP COLUMN "amount";

-- Make accountId nullable in account_status_history to match FK ON DELETE SET NULL
ALTER TABLE "account_status_history" ALTER COLUMN "accountId" DROP NOT NULL;
