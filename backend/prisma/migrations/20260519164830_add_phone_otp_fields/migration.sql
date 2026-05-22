-- Add phone OTP fields to Verification table
-- hashedOtp: SHA-256 hash of the generated OTP (for phone verifications)
-- attempts: counter of failed verification attempts
-- status: tracks PENDING / VERIFIED / BLOCKED states
-- verifiedAt: timestamp when OTP was successfully verified

ALTER TABLE "Verification" ADD COLUMN IF NOT EXISTS "hashedOtp" TEXT;
ALTER TABLE "Verification" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Verification" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Verification" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMPTZ;
