[CmdletBinding()]
param(
  [string]$ConfigPath = "infra/deploy/deploy.config.local.json",
  [string]$ImageTag
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$resolvedConfigPath = if ([System.IO.Path]::IsPathRooted($ConfigPath)) {
  $ConfigPath
} else {
  Join-Path $repoRoot $ConfigPath
}

if (-not (Test-Path -LiteralPath $resolvedConfigPath)) {
  throw "Deploy config not found at '$resolvedConfigPath'."
}

$config = Get-Content -Raw -LiteralPath $resolvedConfigPath | ConvertFrom-Json
$webImageRepository = [string]$config.images.web

if ([string]::IsNullOrWhiteSpace($webImageRepository)) {
  throw "Config is missing images.web."
}

if (-not $ImageTag) {
  $gitShortSha = $null

  try {
    $null = git -C $repoRoot rev-parse --show-toplevel 2>$null
    if ($LASTEXITCODE -eq 0) {
      $gitShortSha = (git -C $repoRoot rev-parse --short HEAD 2>$null).Trim()
    }
  } catch {
    $gitShortSha = $null
  }

  if ($gitShortSha) {
    $ImageTag = "git-$gitShortSha"
  } else {
    throw "ImageTag was not provided and git metadata is unavailable. Provide -ImageTag explicitly or run inside a git checkout with a resolvable HEAD commit."
  }
}

$webImage = "{0}:{1}" -f $webImageRepository, $ImageTag
$dockerfilePath = Join-Path $repoRoot "apps\web\Dockerfile"
$buildContextPath = $repoRoot

if (-not (Test-Path -LiteralPath $dockerfilePath)) {
  throw "Dockerfile not found at '$dockerfilePath'."
}

docker build --tag $webImage --file $dockerfilePath $buildContextPath
if ($LASTEXITCODE -ne 0) {
  throw "Docker build failed for '$webImage'."
}

docker push $webImage
if ($LASTEXITCODE -ne 0) {
  throw "Docker push failed for '$webImage'."
}

Write-Host "Published $webImage"
