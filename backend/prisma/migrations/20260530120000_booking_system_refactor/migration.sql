-- Create new BookingType enum without altering existing one
ALTER TYPE "BookingType" RENAME TO "BookingType_old";
CREATE TYPE "BookingType" AS ENUM ('HOURLY', 'ONE_DAY', 'TWO_DAY');

-- Update mandapam_packages to use new enum
ALTER TABLE "mandapam_packages" ALTER COLUMN "bookingType" TYPE "BookingType" USING (
  CASE WHEN "bookingType" = 'DAY_BASED' THEN
    CASE WHEN "code" = 'GRAND' THEN 'TWO_DAY'::text ELSE 'ONE_DAY'::text END
  ELSE 'HOURLY'::text
  END::"BookingType"
);
DROP TYPE "BookingType_old";

-- Create EventType enum
CREATE TYPE "EventType" AS ENUM ('MARRIAGE', 'RECEPTION', 'ENGAGEMENT', 'BIRTHDAY', 'BABY_SHOWER', 'EAR_PIERCING', 'PUBERTY_FUNCTION', 'OTHER');

-- Update TokenState enum
ALTER TYPE "TokenState" ADD VALUE 'ISSUED';
ALTER TYPE "TokenState" ADD VALUE 'RESERVED';

-- Add columns to mandapam_bookings
ALTER TABLE "mandapam_bookings" ADD COLUMN "bookingType" "BookingType";
ALTER TABLE "mandapam_bookings" ADD COLUMN "eventType" "EventType" NOT NULL DEFAULT 'OTHER';

-- Backfill bookingType from packageCode
UPDATE "mandapam_bookings" SET "bookingType" = CASE
  WHEN "packageCode" = 'STANDARD' THEN 'HOURLY'::"BookingType"
  WHEN "packageCode" = 'ROYAL' THEN 'ONE_DAY'::"BookingType"
  WHEN "packageCode" = 'GRAND' THEN 'TWO_DAY'::"BookingType"
  ELSE 'ONE_DAY'::"BookingType"
END;

ALTER TABLE "mandapam_bookings" ALTER COLUMN "bookingType" SET NOT NULL;

-- Update mandapam_calendar_entries - drop unique constraint on date, add startTime/endTime
ALTER TABLE "mandapam_calendar_entries" DROP CONSTRAINT IF EXISTS "mandapam_calendar_entries_date_key";
ALTER TABLE "mandapam_calendar_entries" ADD COLUMN IF NOT EXISTS "startTime" TIME;
ALTER TABLE "mandapam_calendar_entries" ADD COLUMN IF NOT EXISTS "endTime" TIME;
CREATE INDEX IF NOT EXISTS "mandapam_calendar_entries_date_status_idx" ON "mandapam_calendar_entries" ("date", "status");

-- Update mandapam_booking_addon_snapshots - make quantity nullable
ALTER TABLE "mandapam_booking_addon_snapshots" ALTER COLUMN "quantity" DROP NOT NULL;
ALTER TABLE "mandapam_booking_addon_snapshots" ALTER COLUMN "quantity" DROP DEFAULT;
