-- AlterEnum: remove MANUAL from HoroscopeMode
CREATE TYPE "HoroscopeMode_new" AS ENUM ('GENERATED', 'UPLOADED');
ALTER TABLE "profile_horoscopes" ALTER COLUMN "mode" TYPE "HoroscopeMode_new" USING ("mode"::text::"HoroscopeMode_new");
DROP TYPE "HoroscopeMode";
ALTER TYPE "HoroscopeMode_new" RENAME TO "HoroscopeMode";

-- DropIndex
DROP INDEX IF EXISTS "profile_horoscopes_rasiId_idx";

-- DropIndex
DROP INDEX IF EXISTS "profile_horoscopes_nakshatraId_idx";

-- AlterTable
ALTER TABLE "profile_horoscopes" DROP COLUMN "birthTime",
                                  DROP COLUMN "birthPlace",
                                  DROP COLUMN "birthLat",
                                  DROP COLUMN "birthLong",
                                  DROP COLUMN "timezone",
                                  DROP COLUMN "ayanamsa";
