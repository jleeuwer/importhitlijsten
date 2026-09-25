# Find any remaining references (most important)
grep -RIn --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
  "fd_file_name|hl_commando|hl_add_info" .

# If you're on macOS and grep doesn't like -RIn, use:
grep -Rin --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
  "fd_file_name\|hl_commando\|hl_add_info" .

grep -Rin --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
  "staging_hitlijsten" .

BASE="http://localhost:3003"

curl -sS "$BASE/api/health" | jq .
curl -sS "$BASE/api/db-health" | jq .
curl -i "$BASE/import"
curl -i "$BASE/edit"
# staging page needs runId:
curl -i "$BASE/staging?runId=REPLACE_WITH_RUNID"
curl -sS "$BASE/api/import-runs" | jq .
curl -sS "$BASE/api/import-runs?hl_hitlijst=Stars%20In%20Heaven&hl_uitzendjaar=2025" | jq .
RUNID="REPLACE_WITH_RUNID"
curl -sS "$BASE/api/staging-by-run?runId=$RUNID" | jq .
curl -sS "$BASE/api/staging?runId=$RUNID" | jq .
CSV="/full/path/to/yourfile.csv"

curl -i -X POST "$BASE/import" \
  -F "hl_hitlijst=Stars In Heaven" \
  -F "hl_uitzendjaar=2025" \
  -F "csvFile=@${CSV};type=text/csv"
curl -i -X POST "$BASE/import/delete-run" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "runId=$RUNID"
curl -sS -X POST "$BASE/api/run-decode-html" \
  -H "Content-Type: application/json" \
  -d "{\"runId\":\"$RUNID\"}" | jq .
curl -sS -X POST "$BASE/api/run-artistspelling" \
  -H "Content-Type: application/json" \
  -d "{\"runId\":\"$RUNID\"}" | jq .
curl -sS -X POST "$BASE/api/run-songspelling" \
  -H "Content-Type: application/json" \
  -d "{\"runId\":\"$RUNID\"}" | jq .
POS=1
curl -sS -X POST "$BASE/api/staging-update" \
  -H "Content-Type: application/json" \
  -d "{\"runId\":\"$RUNID\",\"hl_positie\":$POS,\"patch\":{\"fd_tag_title\":\"My Correct Title\"}}" | jq .
curl -sS -X POST "$BASE/api/staging-update" \
  -H "Content-Type: application/json" \
  -d "{\"runId\":\"$RUNID\",\"hl_positie\":$POS,\"patch\":{\"hl_find_cmd\":\"find ...\",\"hl_discogs_link\":\"https://...\",\"hl_artist_key\":123}}" | jq .
# Smoke test complete
BASE="http://localhost:3003"

echo "== health =="
curl -sS "$BASE/api/health"; echo
curl -sS "$BASE/api/db-health"; echo

echo "== runs =="
curl -sS "$BASE/api/import-runs"; echo

BASE="http://localhost:3003"

curl -sS "$BASE/api/string-patterns"
curl -sS -X POST "$BASE/api/string-patterns" -H "Content-Type: application/json" -d '{"st_string_delete":"(Live)"}'
curl -sS -X POST "$BASE/api/string-patterns" -H "Content-Type: application/json" -d '{"st_string_delete":"(Live)"}'  # should return 409

# Run PatternDelete and SongSpelling
BASE="http://localhost:3003"
RUNID="your-run-id"

# Run PatternDelete
curl -sS -X POST "$BASE/api/run-pattern-delete" \
  -H "Content-Type: application/json" \
  -d "{\"runId\":\"$RUNID\"}" | jq .

# Run SongSpelling (will auto-run PatternDelete first too)
curl -sS -X POST "$BASE/api/run-songspelling" \
  -H "Content-Type: application/json" \
  -d "{\"runId\":\"$RUNID\"}" | jq .

# Dry run PatternDelete with preview
BASE="http://localhost:3003"
RUNID="your-run-id"

# Dry run with preview
curl -sS -X POST "$BASE/api/run-pattern-delete" \
  -H "Content-Type: application/json" \
  -d "{\"runId\":\"$RUNID\",\"dryRun\":true,\"previewLimit\":10}"

# Real run
curl -sS -X POST "$BASE/api/run-pattern-delete" \
  -H "Content-Type: application/json" \
  -d "{\"runId\":\"$RUNID\",\"dryRun\":false}"

# SongSpelling (will always PatternDelete real-run first)
curl -sS -X POST "$BASE/api/run-songspelling" \
  -H "Content-Type: application/json" \
  -d "{\"runId\":\"$RUNID\"}"

# 1) list file_details rows by correct artist (for AltSpelling modal)
curl -s "http://localhost:3003/api/file-details/by-artist?artist=Depeche%20Mode" | jq

# 2) select a row from the modal (writes song_spelling + updates staging row)
curl -s -X POST "http://localhost:3003/api/altspelling/select" \
  -H "Content-Type: application/json" \
  -d '{
    "runId": "PUT-YOUR-RUN-UUID-HERE",
    "hl_positie": 12,
    "selected_fd_tag_title": "Enjoy The Silence"
  }' | jq

curl -s -X POST http://localhost:3003/api/altspelling-apply \
  -H "Content-Type: application/json" \
  -d '{"runId":"<RUN_UUID>","hl_positie":1,"fd_tag_title":"Some Title"}'

echo "== done =="
