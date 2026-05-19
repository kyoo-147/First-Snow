param()

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$workspaceDirs = @(
  ".",
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

$npmCommand = if ($IsWindows) { "npm.cmd" } else { "npm" }

foreach ($relativePath in $workspaceDirs) {
  $workspacePath = if ($relativePath -eq ".") { $repoRoot } else { Join-Path $repoRoot $relativePath }
  $manifestPath = Join-Path $workspacePath "package.json"

  if (-not (Test-Path -LiteralPath $manifestPath)) {
    continue
  }

  $lockfilePath = Join-Path $workspacePath "package-lock.json"
  $installCommand = if (Test-Path -LiteralPath $lockfilePath) { "ci" } else { "install --no-fund --no-audit" }

  Write-Host "==> $relativePath :: npm $installCommand"
  Push-Location $workspacePath
  try {
    if ($installCommand -eq "ci") {
      & $npmCommand ci
    } else {
      & $npmCommand install --no-fund --no-audit
    }
  }
  finally {
    Pop-Location
  }
}
