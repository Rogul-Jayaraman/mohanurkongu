-- Add missing values to ReviewAction enum (safe re-run)
DO $$
DECLARE
  v_enumtypid oid;
BEGIN
  SELECT t.oid INTO v_enumtypid FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'ReviewAction' AND n.nspname = 'public';
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'UPDATE' AND enumtypid = v_enumtypid) THEN
    ALTER TYPE "ReviewAction" ADD VALUE 'UPDATE';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ARCHIVE' AND enumtypid = v_enumtypid) THEN
    ALTER TYPE "ReviewAction" ADD VALUE 'ARCHIVE';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'RESTORE' AND enumtypid = v_enumtypid) THEN
    ALTER TYPE "ReviewAction" ADD VALUE 'RESTORE';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'DELETE' AND enumtypid = v_enumtypid) THEN
    ALTER TYPE "ReviewAction" ADD VALUE 'DELETE';
  END IF;
END $$;

-- DropIndex
DROP INDEX IF EXISTS "mandapam_calendar_entries_date_key";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "accounts_createdAt_idx" ON "accounts"("createdAt");
CREATE INDEX IF NOT EXISTS "mandapam_bookings_customerId_idx" ON "mandapam_bookings"("customerId");
CREATE INDEX IF NOT EXISTS "mandapam_bookings_status_createdAt_idx" ON "mandapam_bookings"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "mandapam_financial_ledgers_createdAt_idx" ON "mandapam_financial_ledgers"("createdAt");
CREATE INDEX IF NOT EXISTS "profile_basic_maritalStatus_idx" ON "profile_basic"("maritalStatus");
CREATE INDEX IF NOT EXISTS "profile_reviews_createdAt_idx" ON "profile_reviews"("createdAt");
CREATE INDEX IF NOT EXISTS "profiles_createdAt_idx" ON "profiles"("createdAt");
CREATE INDEX IF NOT EXISTS "subscriptions_expiresAt_status_idx" ON "subscriptions"("expiresAt", "status");
CREATE INDEX IF NOT EXISTS "verification_queue_createdAt_idx" ON "verification_queue"("createdAt");
