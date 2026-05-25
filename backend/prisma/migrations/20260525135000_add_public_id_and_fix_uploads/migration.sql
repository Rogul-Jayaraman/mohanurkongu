-- Add publicId column as nullable first to avoid NOT NULL conflict with existing rows
ALTER TABLE "uploads" ADD COLUMN "publicId" VARCHAR(16);

-- Backfill existing rows with unique public IDs derived from their UUID
UPDATE "uploads" SET "publicId" = 'upl_' || substr(md5(id::text), 1, 6) WHERE "publicId" IS NULL;

-- Now make it NOT NULL and add unique constraint
ALTER TABLE "uploads" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "uploads_publicId_key" ON "uploads"("publicId");
CREATE INDEX "uploads_publicId_idx" ON "uploads"("publicId");

-- Backfill null checksums before setting NOT NULL
UPDATE "uploads" SET "checksum" = '' WHERE "checksum" IS NULL;
ALTER TABLE "uploads" ALTER COLUMN "checksum" SET NOT NULL;

-- Drop default on lastAccessedAt to match schema
ALTER TABLE "uploads" ALTER COLUMN "lastAccessedAt" DROP DEFAULT;

-- Add missing composite indexes
CREATE INDEX "uploads_status_updatedAt_idx" ON "uploads"("status", "updatedAt");
CREATE INDEX "uploads_status_createdAt_idx" ON "uploads"("status", "createdAt");
CREATE INDEX "uploads_status_lastAccessedAt_idx" ON "uploads"("status", "lastAccessedAt");
