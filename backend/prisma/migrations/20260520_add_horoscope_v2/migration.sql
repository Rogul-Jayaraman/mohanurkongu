-- AlterTable: Profile - add birth location fields
ALTER TABLE "Profile" ADD COLUMN "birthLocationName" TEXT;
ALTER TABLE "Profile" ADD COLUMN "birthLatitude" DOUBLE PRECISION;
ALTER TABLE "Profile" ADD COLUMN "birthLongitude" DOUBLE PRECISION;

-- AlterTable: Horoscope - add v2 fields for CREATE mode
ALTER TABLE "Horoscope" ADD COLUMN "horoscopeVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Horoscope" ADD COLUMN "birthDate" TIMESTAMP(3);
ALTER TABLE "Horoscope" ADD COLUMN "birthTime" TEXT;
ALTER TABLE "Horoscope" ADD COLUMN "birthLocationName" TEXT;
ALTER TABLE "Horoscope" ADD COLUMN "birthLatitude" DOUBLE PRECISION;
ALTER TABLE "Horoscope" ADD COLUMN "birthLongitude" DOUBLE PRECISION;
ALTER TABLE "Horoscope" ADD COLUMN "timezone" TEXT;
ALTER TABLE "Horoscope" ADD COLUMN "ayanamsa" DOUBLE PRECISION;
ALTER TABLE "Horoscope" ADD COLUMN "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Horoscope" ADD COLUMN "generationHash" TEXT;
ALTER TABLE "Horoscope" ADD COLUMN "horoscopeJson" JSONB;
