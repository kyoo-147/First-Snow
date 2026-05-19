$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$migration = Get-ChildItem (Join-Path $repoRoot "packages/database/migrations") -Filter "*.sql" |
  Sort-Object Name |
  Select-Object -First 1

if (-not $migration) {
  throw "No SQL migration found under packages/database/migrations."
}

$sql = Get-Content -Raw $migration.FullName

$requiredTables = @(
  "users",
  "children",
  "sessions",
  "messages",
  "emotion_events",
  "lessons",
  "memories",
  "alerts"
)

foreach ($table in $requiredTables) {
  if ($sql -notmatch "CREATE TABLE `"$table`"") {
    throw "Missing required table in migration: $table"
  }
}

$requiredSnippets = @(
  'CREATE EXTENSION IF NOT EXISTS "pgcrypto"',
  'CREATE EXTENSION IF NOT EXISTS "vector"',
  'CREATE TYPE "public"."session_status"',
  'CREATE TYPE "public"."alert_severity"',
  'auth_subject_id',
  'source_session_id'
)

foreach ($snippet in $requiredSnippets) {
  if (-not $sql.Contains($snippet)) {
    throw "Missing required migration snippet: $snippet"
  }
}

$forbidden = @(
  "raw_audio",
  "raw_video",
  "audio_blob",
  "video_blob",
  "audio_url",
  "video_url"
)

foreach ($term in $forbidden) {
  if ($sql -match $term) {
    throw "Forbidden raw media storage term found in migration: $term"
  }
}

Write-Host "Database schema static check passed for $($migration.Name)."
