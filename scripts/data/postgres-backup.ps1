param(
  [Parameter(Mandatory = $true)]
  [string]$ComposeDir,

  [string]$OutputDir = ".\backups",
  [string]$Service = "postgres",
  [string]$Database = "agentkid",
  [string]$User = "agentkid_app"
)

$ErrorActionPreference = "Stop"

$resolvedComposeDir = Resolve-Path $ComposeDir
$resolvedOutputDir = if (Test-Path $OutputDir) {
  Resolve-Path $OutputDir
} else {
  New-Item -ItemType Directory -Path $OutputDir | Select-Object -ExpandProperty FullName
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = Join-Path $resolvedOutputDir "agentkid-$timestamp.dump"

Push-Location $resolvedComposeDir
try {
  Write-Host "Creating PostgreSQL backup at $backupPath"
  docker compose exec -T $Service pg_dump `
    -U $User `
    -d $Database `
    --format=custom `
    --no-owner `
    --no-acl `
    > $backupPath

  if ((Get-Item $backupPath).Length -le 0) {
    throw "Backup file was created but is empty: $backupPath"
  }

  Write-Host "Backup created: $backupPath"
}
finally {
  Pop-Location
}
