-- =============================================================
-- MOHANUR KONGU — SEED DATA VALIDATION QUERIES
-- Run after seeding to verify data integrity
-- =============================================================

-- 1. FK INTEGRITY: Check for orphan records
SELECT 'orphan_account_credentials' AS check_name,
  COUNT(*) AS failures FROM account_credentials ac
  LEFT JOIN accounts a ON a.id = ac."accountId"
  WHERE a.id IS NULL;

SELECT 'orphan_profiles' AS check_name,
  COUNT(*) AS failures FROM profiles p
  LEFT JOIN accounts a ON a.id = p."accountId"
  WHERE a.id IS NULL;

SELECT 'orphan_locations' AS check_name,
  COUNT(*) AS failures FROM locations l
  LEFT JOIN districts d ON d.id = l."districtId"
  WHERE l."districtId" IS NOT NULL AND d.id IS NULL;

SELECT 'orphan_uploads' AS check_name,
  COUNT(*) AS failures FROM uploads u
  LEFT JOIN accounts a ON a.id = u."ownerAccountId"
  WHERE a.id IS NULL;

-- 2. PROFILE LIFECYCLE: State consistency
SELECT 'draft_with_regno' AS check_name,
  COUNT(*) AS failures FROM profiles
  WHERE "currentStatus" = 'DRAFT' AND "regNo" IS NOT NULL;

SELECT 'deleted_with_regno' AS check_name,
  COUNT(*) AS failures FROM profiles
  WHERE "currentStatus" = 'DELETED' AND "regNo" IS NOT NULL;

SELECT 'active_without_approved_at' AS check_name,
  COUNT(*) AS failures FROM profiles
  WHERE "currentStatus" = 'ACTIVE' AND "approvedAt" IS NULL;

SELECT 'rejected_without_rejection_reason' AS check_name,
  COUNT(*) AS failures FROM profiles
  WHERE "currentStatus" = 'REJECTED' AND "rejectionReasonEn" IS NULL;

-- 3. DUPLICATE & UNIQUE CHECKS
SELECT 'duplicate_emails' AS check_name,
  email, COUNT(*) AS cnt FROM account_credentials
  WHERE email IS NOT NULL
  GROUP BY email HAVING COUNT(*) > 1;

SELECT 'duplicate_phones' AS check_name,
  phone, COUNT(*) AS cnt FROM account_credentials
  WHERE phone IS NOT NULL
  GROUP BY phone HAVING COUNT(*) > 1;

-- 4. AGE VALIDATION
SELECT 'impossible_age' AS check_name,
  COUNT(*) AS failures FROM profile_basic pb
  JOIN profiles p ON p.id = pb."profileId"
  WHERE pb.dob > NOW() OR pb.dob < '1940-01-01';

-- 5. GALLERY CONSISTENCY
SELECT 'orphan_gallery_photos' AS check_name,
  COUNT(*) AS failures FROM profile_gallery_photos pgp
  LEFT JOIN profile_photos pp ON pp.id = pgp."profilePhotoId"
  WHERE pp.id IS NULL;

-- 6. SHORTLIST INTEGRITY
SELECT 'self_shortlists' AS check_name,
  COUNT(*) AS failures FROM shortlists s
  JOIN profiles p ON p.id = s."profileId"
  WHERE s."accountId" = p."accountId";

SELECT 'orphan_shortlists' AS check_name,
  COUNT(*) AS failures FROM shortlists s
  LEFT JOIN profiles p ON p.id = s."profileId"
  WHERE p.id IS NULL;

-- 7. MEMBERSHIP CONSISTENCY
SELECT 'membership_without_usage' AS check_name,
  COUNT(*) AS cnt FROM subscriptions s
  LEFT JOIN membership_usage mu ON mu."subscriptionId" = s.id
  WHERE s.status = 'ACTIVE' AND mu.id IS NULL;

SELECT 'expired_still_active_status' AS check_name,
  COUNT(*) AS failures FROM subscriptions
  WHERE status = 'ACTIVE' AND "expiresAt" < NOW();

-- 8. STATE HISTORY INTEGRITY
SELECT 'profile_missing_state_history' AS check_name,
  COUNT(*) AS failures FROM profiles p
  LEFT JOIN profile_state_history psh ON psh."profileId" = p.id
  WHERE psh.id IS NULL;

-- 9. VERIFICATION QUEUE CONSISTENCY
SELECT 'completed_queue_missing_review' AS check_name,
  COUNT(*) AS failures FROM verification_queue vq
  LEFT JOIN profile_reviews pr ON pr."profileId" = vq."profileId"
  WHERE vq."completedAt" IS NOT NULL AND pr.id IS NULL;

-- 10. DATA DISTRIBUTION SUMMARY
SELECT 'profile_status_distribution' AS check_name,
  "currentStatus", COUNT(*) AS "count"
  FROM profiles GROUP BY "currentStatus" ORDER BY "count" DESC;

SELECT 'gender_distribution' AS check_name,
  gender, COUNT(*) AS "count"
  FROM profile_basic GROUP BY gender;

SELECT 'membership_tier_distribution' AS check_name,
  sp."snapshotPlanCode", COUNT(*) AS "count"
  FROM subscriptions sp GROUP BY sp."snapshotPlanCode";

SELECT 'verification_state_distribution' AS check_name,
  state, COUNT(*) AS "count"
  FROM account_verifications GROUP BY state;

-- =============================================================
-- RESET STRATEGY: Truncate all seed data in dependency order
-- =============================================================
-- Run in transaction:
/*
BEGIN;

-- Child tables first (no FK dependencies on other data tables)
TRUNCATE TABLE profile_gallery_photos CASCADE;
TRUNCATE TABLE profile_reviews CASCADE;
TRUNCATE TABLE verification_queue CASCADE;
TRUNCATE TABLE profile_state_history CASCADE;
TRUNCATE TABLE profile_opens CASCADE;
TRUNCATE TABLE shortlists CASCADE;
TRUNCATE TABLE membership_usage CASCADE;
TRUNCATE TABLE admin_audit_events CASCADE;
TRUNCATE TABLE reset_sessions CASCADE;
TRUNCATE TABLE registration_sessions CASCADE;
TRUNCATE TABLE account_verifications CASCADE;
TRUNCATE TABLE account_sessions CASCADE;

-- Profile sub-tables
TRUNCATE TABLE partner_preferences CASCADE;
TRUNCATE TABLE profile_assets CASCADE;
TRUNCATE TABLE profile_horoscopes CASCADE;
TRUNCATE TABLE profile_family CASCADE;
TRUNCATE TABLE profile_professional CASCADE;
TRUNCATE TABLE profile_communities CASCADE;
TRUNCATE TABLE profile_translations CASCADE;
TRUNCATE TABLE profile_photos CASCADE;
TRUNCATE TABLE profile_basic CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- Upload & Account sub-tables
TRUNCATE TABLE uploads CASCADE;
TRUNCATE TABLE subscriptions CASCADE;
TRUNCATE TABLE account_status_history CASCADE;
TRUNCATE TABLE account_roles CASCADE;
TRUNCATE TABLE account_translations CASCADE;
TRUNCATE TABLE account_credentials CASCADE;
TRUNCATE TABLE accounts CASCADE;

-- Reset counters
UPDATE counters SET counter = 0 WHERE prefix IN ('MK', 'MKM');

COMMIT;
*/
