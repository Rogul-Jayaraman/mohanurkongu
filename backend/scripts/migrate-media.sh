#!/bin/bash
# migrate-media.sh
# One-time migration: moves flat storage files to hierarchical paths.
# Reads object_key from DB, creates parent dirs, moves files.
#
# Usage: STORAGE_DIR=/storage/media DATABASE_URL=postgresql://... bash migrate-media.sh
#
# Expected DB row: object_key = "profiles/2026/05/upl_xxx.webp"
# Expected file:   /storage/media/upl_xxx.webp
# After move:      /storage/media/profiles/2026/05/upl_xxx.webp

set -euo pipefail

STORAGE_DIR="${STORAGE_DIR:-/storage/media}"
BATCH="${BATCH:-500}"
DRY_RUN="${DRY_RUN:-false}"

echo "=== Media Migration ==="
echo "Storage dir: $STORAGE_DIR"
echo "Batch size:  $BATCH"
echo "Dry run:     $DRY_RUN"
echo ""

moved=0
failed=0
offset=0

while true; do
  rows=$(psql -t -A -F'|' \
    -v ON_ERROR_STOP=1 \
    --no-align \
    --tuples-only \
    -c "
      SELECT upload_token, object_key
      FROM uploads
      WHERE status != 'TEMP'
        AND object_key IS NOT NULL
        AND object_key != ''
      ORDER BY created_at
      OFFSET $offset
      LIMIT $BATCH;
    " 2>/dev/null)

  if [ -z "$rows" ]; then
    break
  fi

  count=$(echo "$rows" | wc -l)

  while IFS='|' read -r token objkey; do
    [ -z "$token" ] && continue
    [ -z "$objkey" ] && continue

    src="$STORAGE_DIR/${token}.webp"
    dst="$STORAGE_DIR/$objkey"
    parent=$(dirname "$dst")

    if [ ! -f "$src" ]; then
      # File may have been uploaded after migration started, already at hierarchical
      continue
    fi

    if [ -f "$dst" ]; then
      # Destination already exists — skip (probably duplicate)
      continue
    fi

    if [ "$DRY_RUN" = "true" ]; then
      echo "[DRY RUN] Would move: $token.webp → $objkey"
      ((moved++))
      continue
    fi

    echo "Moving: $token.webp → $objkey"
    mkdir -p "$parent" || { ((failed++)); continue; }
    mv "$src" "$dst" || { ((failed++)); continue; }
    ((moved++))
  done <<< "$rows"

  offset=$((offset + count))

  if [ "$count" -lt "$BATCH" ]; then
    break
  fi
done

echo ""
echo "=== Migration Complete ==="
echo "Files moved: $moved"
echo "Failed:      $failed"
echo ""

if [ "$failed" -gt 0 ]; then
  echo "WARNING: $failed file(s) could not be migrated."
  echo "Check the storage directory and DB for missing rows."
  exit 1
fi

exit 0
