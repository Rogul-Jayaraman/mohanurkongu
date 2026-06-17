-- remove default before altering type
ALTER TABLE "mandapam_bookings" ALTER COLUMN "status" DROP DEFAULT;

-- create new enum type without EVENT_COMPLETED
CREATE TYPE "BookingStatus_new" AS ENUM ('CONFIRMED', 'EVENT_IN_PROGRESS', 'SETTLEMENT_PENDING', 'COMPLETED', 'CANCELLED');

-- alter column to use new type
ALTER TABLE "mandapam_bookings" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");

-- re-add default
ALTER TABLE "mandapam_bookings" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED'::"BookingStatus_new";

-- drop old type and rename new
DROP TYPE "BookingStatus";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
