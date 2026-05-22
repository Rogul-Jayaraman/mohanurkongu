-- Alter Verification table: add identifier and type columns, backfill, then add constraints

-- Step 1: Add columns as nullable initially
ALTER TABLE "Verification" ADD COLUMN IF NOT EXISTS "identifier" TEXT;
ALTER TABLE "Verification" ADD COLUMN IF NOT EXISTS "type" TEXT;

-- Step 2: Backfill existing rows (all existing verifications were email-based)
UPDATE "Verification" SET "identifier" = "email", "type" = 'EMAIL' WHERE "identifier" IS NULL;

-- Step 3: Make columns NOT NULL
ALTER TABLE "Verification" ALTER COLUMN "identifier" SET NOT NULL;
ALTER TABLE "Verification" ALTER COLUMN "type" SET NOT NULL;

-- Step 4: Drop old unique constraint on email
ALTER TABLE "Verification" DROP CONSTRAINT IF EXISTS "Verification_email_key";
DROP INDEX IF EXISTS "Verification_email_key";

-- Step 5: Drop the email column
ALTER TABLE "Verification" DROP COLUMN IF EXISTS "email";

-- Step 6: Add new composite unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "Verification_identifier_type_key" ON "Verification"("identifier", "type");
