-- Drop indexes referencing unused columns
DROP INDEX IF EXISTS "uploads_status_lastAccessedAt_idx";
DROP INDEX IF EXISTS "uploads_publicId_idx";

-- Drop unique constraint on publicId
DROP INDEX IF EXISTS "uploads_publicId_key";

-- Drop unused columns from uploads table
ALTER TABLE "uploads" DROP COLUMN IF EXISTS "publicId";
ALTER TABLE "uploads" DROP COLUMN IF EXISTS "extension";
ALTER TABLE "uploads" DROP COLUMN IF EXISTS "lastAccessedAt";
