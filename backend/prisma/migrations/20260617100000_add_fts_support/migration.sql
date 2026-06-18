-- Enable pg_trgm extension (no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Level 1: GIN indexes for ILIKE acceleration (automatic, zero code changes needed)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_translations_first_name_trgm
  ON profile_translations USING gin (first_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_translations_last_name_trgm
  ON profile_translations USING gin (last_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_translations_kuladeivam_trgm
  ON profile_translations USING gin (kuladeivam gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accounts_account_no_trgm
  ON accounts USING gin (account_no gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_account_credentials_email_trgm
  ON account_credentials USING gin (email gin_trgm_ops);

-- Level 2: tsvector column for relevance-ranked full-text search
ALTER TABLE profile_translations ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_translations_search_vector
  ON profile_translations USING gin (search_vector);

-- Backfill existing rows
UPDATE profile_translations SET search_vector =
  setweight(to_tsvector('simple', coalesce(first_name, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(last_name, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(kuladeivam, '')), 'C');

-- Trigger to keep search_vector in sync
CREATE OR REPLACE FUNCTION refresh_translations_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.first_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.last_name, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.kuladeivam, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_translations_search_vector ON profile_translations;
CREATE TRIGGER trg_translations_search_vector
  BEFORE INSERT OR UPDATE ON profile_translations
  FOR EACH ROW EXECUTE FUNCTION refresh_translations_search_vector();
