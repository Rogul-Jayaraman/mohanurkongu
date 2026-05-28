-- Align AccountState → AccountStatus (remove DELETED)
ALTER TYPE "AccountState" RENAME TO "AccountStatus";
ALTER TABLE "accounts" ALTER COLUMN "currentState" TYPE "AccountStatus" USING "currentState"::text::"AccountStatus";
ALTER TABLE "account_status_history" ALTER COLUMN "state" TYPE "AccountStatus" USING "state"::text::"AccountStatus";

-- Add ARCHIVED to ProfileStatus (INACTIVE remains unused in PG, removed from app)
ALTER TYPE "ProfileStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

-- Rename UploadStatus DRAFT → ATTACHED
ALTER TYPE "UploadStatus" RENAME VALUE 'DRAFT' TO 'ATTACHED';

-- Create ReviewAction enum
CREATE TYPE "ReviewAction" AS ENUM('APPROVED', 'REJECTED');

-- Create verification_queue
CREATE TABLE "verification_queue" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "assignedTo" UUID,
    "claimedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "lockedBy" UUID,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_queue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "verification_queue_profileId_key" ON "verification_queue"("profileId");
CREATE INDEX "verification_queue_assignedTo_idx" ON "verification_queue"("assignedTo");
CREATE INDEX "verification_queue_completedAt_idx" ON "verification_queue"("completedAt");

ALTER TABLE "verification_queue" ADD CONSTRAINT "verification_queue_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "verification_queue" ADD CONSTRAINT "verification_queue_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create profile_reviews
CREATE TABLE "profile_reviews" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "action" "ReviewAction" NOT NULL,
    "reasonEn" VARCHAR(500),
    "reasonTa" VARCHAR(500),
    "reviewData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_reviews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "profile_reviews_profileId_createdAt_idx" ON "profile_reviews"("profileId", "createdAt");

ALTER TABLE "profile_reviews" ADD CONSTRAINT "profile_reviews_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "profile_reviews" ADD CONSTRAINT "profile_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create admin_audit_events
CREATE TABLE "admin_audit_events" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "profileId" UUID,
    "action" VARCHAR(30) NOT NULL,
    "metadata" JSONB,
    "ipAddress" VARCHAR(45),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_audit_events_actorId_createdAt_idx" ON "admin_audit_events"("actorId", "createdAt");
CREATE INDEX "admin_audit_events_profileId_createdAt_idx" ON "admin_audit_events"("profileId", "createdAt");

ALTER TABLE "admin_audit_events" ADD CONSTRAINT "admin_audit_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
