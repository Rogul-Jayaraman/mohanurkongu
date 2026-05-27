-- Add DELETE_PENDING to UploadStatus enum
ALTER TYPE "UploadStatus" ADD VALUE 'DELETE_PENDING';

-- Drop drift index (added manually outside Prisma)
DROP INDEX IF EXISTS "profiles_currentStatus_visibility_createdAt_idx";

-- Add v9.0 columns to uploads
ALTER TABLE "uploads" ADD COLUMN IF NOT EXISTS "uploadToken" VARCHAR(32);
ALTER TABLE "uploads" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "uploads" ADD COLUMN IF NOT EXISTS "width" INTEGER;
ALTER TABLE "uploads" ADD COLUMN IF NOT EXISTS "height" INTEGER;
ALTER TABLE "uploads" ADD COLUMN IF NOT EXISTS "cleanupAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "uploads" ADD COLUMN IF NOT EXISTS "cleanupLastError" TEXT;
ALTER TABLE "uploads" ADD COLUMN IF NOT EXISTS "cleanupAbandonedAt" TIMESTAMP(3);
ALTER TABLE "uploads" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "uploads" ADD COLUMN IF NOT EXISTS "attachedEntityType" VARCHAR(30);
ALTER TABLE "uploads" ADD COLUMN IF NOT EXISTS "attachedEntityId" UUID;

-- CHECK constraints (IF NOT EXISTS not supported for constraints in PG16)
ALTER TABLE "uploads" ADD CONSTRAINT "chk_upload_width" CHECK ("width" IS NULL OR "width" > 0);
ALTER TABLE "uploads" ADD CONSTRAINT "chk_upload_height" CHECK ("height" IS NULL OR "height" > 0);
ALTER TABLE "uploads" ADD CONSTRAINT "chk_upload_size" CHECK ("size" > 0);
ALTER TABLE "uploads" ADD CONSTRAINT "chk_upload_cleanup_attempts" CHECK ("cleanupAttempts" <= 5);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "uploads_uploadToken_key" ON "uploads"("uploadToken");
CREATE INDEX IF NOT EXISTS "uploads_attachedEntityId_status_idx" ON "uploads"("attachedEntityId", "status");
CREATE INDEX IF NOT EXISTS "uploads_status_cleanupAttempts_idx" ON "uploads"("status", "cleanupAttempts");
