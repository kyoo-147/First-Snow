$required = @(
  "README.md",
  "PROJECT_OVERVIEW.md",
  "ARCHITECTURE.md",
  "API_SPEC.md",
  "DEVELOPMENT_GUIDE.md",
  "DEPLOYMENT_GUIDE.md",
  "AI_AGENT_GUIDE.md",
  "CODING_STANDARDS.md",
  "FEATURE_ROADMAP.md",
  "TASK_BREAKDOWN.md"
)

$missing = @()
foreach ($path in $required) {
  if (-not (Test-Path (Join-Path $PSScriptRoot "..\\..\\$path"))) {
    $missing += $path
  }
}

if ($missing.Count -gt 0) {
  Write-Error ("Missing canonical docs: " + ($missing -join ", "))
  exit 1
}

Write-Output "Canonical doc structure check passed."
