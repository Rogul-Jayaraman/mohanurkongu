-- Create tables that may be missing in production if the init migration was partially applied.

-- reset_sessions
CREATE TABLE IF NOT EXISTS "reset_sessions" (
    "id" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "snapshotTarget" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reset_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "reset_sessions_verificationId_idx" ON "reset_sessions"("verificationId");
CREATE INDEX IF NOT EXISTS "reset_sessions_expiresAt_idx" ON "reset_sessions"("expiresAt");

-- partner_preferences
CREATE TABLE IF NOT EXISTS "partner_preferences" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "heightMinId" INTEGER,
    "heightMaxId" INTEGER,
    "monthlySalary" DECIMAL(12,2),
    "salaryCurrency" TEXT DEFAULT 'INR',
    "expectationNote" TEXT,
    "preferredLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "partner_preferences_profileId_key" ON "partner_preferences"("profileId");
