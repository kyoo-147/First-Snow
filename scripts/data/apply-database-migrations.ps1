param(
  [string]$PackageDir = "packages/database",
  [switch]$RequireDirectUrl
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$databaseDir = Resolve-Path (Join-Path $repoRoot $PackageDir)

if ($RequireDirectUrl -and [string]::IsNullOrWhiteSpace($env:DATABASE_DIRECT_URL)) {
  throw "DATABASE_DIRECT_URL is required. Open the SSH tunnel first; see infra/postgres/remote-dev-access.md."
}

if ([string]::IsNullOrWhiteSpace($env:DATABASE_DIRECT_URL) -and [string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
  throw "DATABASE_DIRECT_URL or DATABASE_URL must be set before running migrations."
}

Push-Location $databaseDir
try {
  Write-Host "Checking Drizzle migration state..."
  npm.cmd run db:check

  Write-Host "Applying Drizzle migrations..."
  npm.cmd run db:migrate

  Write-Host "Database migrations completed."
}
finally {
  Pop-Location
}
