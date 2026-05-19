param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("build", "lint", "test", "typecheck")]
  [string]$ScriptName
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$workspaceDirs = @(
  "packages/domain",
  "packages/config",
  "packages/database",
  "packages/observability",
  "packages/integrations",
  "packages/prompts",
  "packages/testing",
  "packages/ui",
  "apps/web",
  "apps/worker"
)

foreach ($relativePath in $workspaceDirs) {
  $workspacePath = Join-Path $repoRoot $relativePath
  $manifestPath = Join-Path $workspacePath "package.json"

  if (-not (Test-Path $manifestPath)) {
    continue
  }

  Write-Host "==> $relativePath :: npm run $ScriptName"
  Push-Location $workspacePath
  try {
    $npmCommand = if ($IsWindows) { "npm.cmd" } else { "npm" }
    & $npmCommand run $ScriptName
    if ($LASTEXITCODE -ne 0) {
      throw "Workspace script failed: $relativePath :: $ScriptName exited with $LASTEXITCODE"
    }
  }
  finally {
    Pop-Location
  }
}
