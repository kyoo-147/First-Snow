[CmdletBinding()]
param(
  [string]$ConfigPath = "infra/deploy/deploy.config.local.json",
  [string]$ImageTag
)

$ErrorActionPreference = "Stop"

function Get-RequiredConfigValue {
  param(
    [Parameter(Mandatory = $true)]
    $Value,
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  if ($null -eq $Value) {
    throw "Config is missing $Path."
  }

  $stringValue = [string]$Value
  if ([string]::IsNullOrWhiteSpace($stringValue)) {
    throw "Config is missing $Path."
  }

  return $stringValue
}

function Resolve-RepoPath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  if ([System.IO.Path]::IsPathRooted($Path)) {
    return $Path
  }

  return (Join-Path $script:RepoRoot $Path)
}

function Invoke-RemoteCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Server,
    [Parameter(Mandatory = $true)]
    [string]$Script
  )

  $normalizedScript = $Script -replace "`r`n?", "`n"
  $localTempScriptPath = [System.IO.Path]::GetTempFileName()
  $localTempStderrPath = [System.IO.Path]::GetTempFileName()
  $remoteTempScriptPath = "/tmp/agentkid-remote-{0}.sh" -f ([guid]::NewGuid().ToString("N"))
  $previousNativeCommandPreference = $PSNativeCommandUseErrorActionPreference

  try {
    $PSNativeCommandUseErrorActionPreference = $false
    [System.IO.File]::WriteAllText($localTempScriptPath, $normalizedScript, [System.Text.UTF8Encoding]::new($false))
    & scp $localTempScriptPath "${Server}:$remoteTempScriptPath" | Out-Null

    if ($LASTEXITCODE -ne 0) {
      throw ("Failed to copy remote script to {0}:{1}." -f $Server, $remoteTempScriptPath)
    }

    $output = & ssh $Server "bash $remoteTempScriptPath; rm -f $remoteTempScriptPath" 2> $localTempStderrPath
    $stderrOutput = if (Test-Path -LiteralPath $localTempStderrPath) {
      $stderrText = Get-Content -Raw -LiteralPath $localTempStderrPath
      if ($null -eq $stderrText) { "" } else { $stderrText.Trim() }
    } else {
      ""
    }
  } finally {
    $PSNativeCommandUseErrorActionPreference = $previousNativeCommandPreference
    if (Test-Path -LiteralPath $localTempScriptPath) {
      Remove-Item -LiteralPath $localTempScriptPath -Force
    }
    if (Test-Path -LiteralPath $localTempStderrPath) {
      Remove-Item -LiteralPath $localTempStderrPath -Force
    }
  }

  if ($LASTEXITCODE -ne 0) {
    $message = ((@($output) + $stderrOutput) | Out-String).Trim()
    if ([string]::IsNullOrWhiteSpace($message)) {
      $message = "remote command failed without output"
    }

    throw "Remote command failed on ${Server}: $message"
  }

  if (-not [string]::IsNullOrWhiteSpace($stderrOutput)) {
    return @($output) + $stderrOutput
  }

  return $output
}

function ConvertTo-BashSingleQuoted {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Value
  )

  return "'" + $Value.Replace("'", "'""'""'") + "'"
}

function Resolve-ImageTag {
  param(
    [string]$RequestedTag
  )

  if (-not [string]::IsNullOrWhiteSpace($RequestedTag)) {
    return $RequestedTag
  }

  $gitShortSha = $null

  try {
    $null = git -C $script:RepoRoot rev-parse --show-toplevel 2>$null
    if ($LASTEXITCODE -eq 0) {
      $gitShortSha = (git -C $script:RepoRoot rev-parse --short HEAD 2>$null).Trim()
    }
  } catch {
    $gitShortSha = $null
  }

  if ($gitShortSha) {
    return "git-$gitShortSha"
  }

  throw "ImageTag was not provided and git metadata is unavailable. Provide -ImageTag explicitly or run inside a git checkout with a resolvable HEAD commit."
}

function Assert-SafeImageTag {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Tag
  )

  if ([string]::IsNullOrWhiteSpace($Tag)) {
    throw "ImageTag cannot be empty."
  }

  if ($Tag -eq "latest") {
    throw "Refusing to deploy the mutable 'latest' tag. Provide an immutable image tag."
  }
}

function Get-RemoteFileSha256 {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Server,
    [Parameter(Mandatory = $true)]
    [string]$RemotePath
  )

  $quotedRemotePath = ConvertTo-BashSingleQuoted -Value $RemotePath
  $shaOutput = Invoke-RemoteCommand -Server $Server -Script @"
set -e
REMOTE_PATH=$quotedRemotePath
if [ -f "`$REMOTE_PATH" ]; then
  sha256sum "`$REMOTE_PATH" | awk '{print `$1}'
fi
"@

  return ($shaOutput | Out-String).Trim()
}

function Copy-RemoteFile {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Server,
    [Parameter(Mandatory = $true)]
    [string]$LocalPath,
    [Parameter(Mandatory = $true)]
    [string]$RemotePath,
    [Parameter(Mandatory = $true)]
    [string]$Description
  )

  $remoteTempPath = "/tmp/agentkid-{0}-{1}.tmp" -f ([System.IO.Path]::GetFileName($RemotePath)), ([guid]::NewGuid().ToString("N"))
  & scp $LocalPath "${Server}:$remoteTempPath" | Out-Null

  if ($LASTEXITCODE -ne 0) {
    throw ("Failed to copy {0} to {1}:{2}." -f $Description, $Server, $RemotePath)
  }

  $quotedRemotePath = ConvertTo-BashSingleQuoted -Value $RemotePath
  $quotedRemoteTempPath = ConvertTo-BashSingleQuoted -Value $remoteTempPath

  Invoke-RemoteCommand -Server $Server -Script @"
set -e
REMOTE_PATH=$quotedRemotePath
REMOTE_TEMP_PATH=$quotedRemoteTempPath
mkdir -p "`$(dirname "`$REMOTE_PATH")"
mv "`$REMOTE_TEMP_PATH" "`$REMOTE_PATH"
chmod 0644 "`$REMOTE_PATH"
"@ | Out-Null
}

function Sync-RemoteFileIfChanged {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Server,
    [Parameter(Mandatory = $true)]
    [string]$LocalPath,
    [Parameter(Mandatory = $true)]
    [string]$RemotePath,
    [Parameter(Mandatory = $true)]
    [string]$Description
  )

  if (-not (Test-Path -LiteralPath $LocalPath)) {
    throw "Required local asset '$LocalPath' for $Description was not found."
  }

  $localHash = (Get-FileHash -LiteralPath $LocalPath -Algorithm SHA256).Hash.ToLowerInvariant()
  $remoteHash = Get-RemoteFileSha256 -Server $Server -RemotePath $RemotePath

  if ($localHash -ne $remoteHash) {
    Copy-RemoteFile -Server $Server -LocalPath $LocalPath -RemotePath $RemotePath -Description $Description
    Write-Host "Updated $Description at $RemotePath on $Server"
  } else {
    Write-Host "$Description already up to date at $RemotePath on $Server"
  }
}

function Ensure-RemoteFileFromTemplateIfMissing {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Server,
    [Parameter(Mandatory = $true)]
    [string]$LocalTemplatePath,
    [Parameter(Mandatory = $true)]
    [string]$RemotePath,
    [Parameter(Mandatory = $true)]
    [string]$Description
  )

  if (-not (Test-Path -LiteralPath $LocalTemplatePath)) {
    throw "Required local template '$LocalTemplatePath' for $Description was not found."
  }

  $quotedRemotePath = ConvertTo-BashSingleQuoted -Value $RemotePath
  $existsOutput = Invoke-RemoteCommand -Server $Server -Script @"
set -e
REMOTE_PATH=$quotedRemotePath
if [ -f "`$REMOTE_PATH" ]; then
  printf 'present'
fi
"@

  if ((($existsOutput | Out-String).Trim()) -ne "present") {
    Copy-RemoteFile -Server $Server -LocalPath $LocalTemplatePath -RemotePath $RemotePath -Description $Description
    Write-Host "Created $Description at $RemotePath on $Server from the repo template"
  } else {
    Write-Host "$Description already exists at $RemotePath on $Server"
  }
}

function Write-LocalRollbackCache {
  param(
    [Parameter(Mandatory = $true)]
    [string]$CachePath,
    [Parameter(Mandatory = $true)]
    [string]$Json
  )

  $cacheDirectory = Split-Path -Parent $CachePath
  if (-not [string]::IsNullOrWhiteSpace($cacheDirectory)) {
    New-Item -ItemType Directory -Path $cacheDirectory -Force | Out-Null
  }

  [System.IO.File]::WriteAllText($CachePath, $Json, [System.Text.UTF8Encoding]::new($false))
}

$script:RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$resolvedConfigPath = Resolve-RepoPath -Path $ConfigPath

if (-not (Test-Path -LiteralPath $resolvedConfigPath)) {
  throw "Deploy config not found at '$resolvedConfigPath'."
}

$config = Get-Content -Raw -LiteralPath $resolvedConfigPath | ConvertFrom-Json
$sshUser = Get-RequiredConfigValue -Value $config.server.sshUser -Path "server.sshUser"
$sshHost = Get-RequiredConfigValue -Value $config.server.sshHost -Path "server.sshHost"
$appDir = Get-RequiredConfigValue -Value $config.server.appDir -Path "server.appDir"
$composeProjectName = Get-RequiredConfigValue -Value $config.server.composeProjectName -Path "server.composeProjectName"
$webImageRepository = Get-RequiredConfigValue -Value $config.images.web -Path "images.web"
$publicMarketingUrl = Get-RequiredConfigValue -Value $config.project.publicMarketingUrl -Path "project.publicMarketingUrl"
$publicAppUrl = Get-RequiredConfigValue -Value $config.project.publicAppUrl -Path "project.publicAppUrl"
$serverRollbackStateFile = [string]$config.deploy.serverRollbackStateFile
$localRollbackCacheFile = [string]$config.deploy.localRollbackCacheFile

if ([string]::IsNullOrWhiteSpace($serverRollbackStateFile)) {
  $serverRollbackStateFile = "$appDir/.state/last-known-good.json"
}

$resolvedLocalRollbackCachePath = $null
if (-not [string]::IsNullOrWhiteSpace($localRollbackCacheFile)) {
  $resolvedLocalRollbackCachePath = Resolve-RepoPath -Path $localRollbackCacheFile
}

$server = "{0}@{1}" -f $sshUser, $sshHost
$resolvedImageTag = Resolve-ImageTag -RequestedTag $ImageTag
Assert-SafeImageTag -Tag $resolvedImageTag
$webImage = "{0}:{1}" -f $webImageRepository, $resolvedImageTag

$serverAssetsDir = Join-Path $PSScriptRoot "server"
$localComposePath = Join-Path $serverAssetsDir "compose.yaml"
$localCaddyfilePath = Join-Path $serverAssetsDir "Caddyfile"
$localWebEnvTemplatePath = Join-Path $serverAssetsDir "web.env.template"
$remoteComposePath = "$appDir/compose.yaml"
$remoteCaddyfilePath = "$appDir/Caddyfile"
$remoteWebEnvPath = "$appDir/web.env"

Invoke-RemoteCommand -Server $server -Script @"
set -e
mkdir -p $(ConvertTo-BashSingleQuoted -Value $appDir)
mkdir -p $(ConvertTo-BashSingleQuoted -Value ((Split-Path -Path $serverRollbackStateFile -Parent).Replace('\','/')))
"@ | Out-Null

Sync-RemoteFileIfChanged -Server $server -LocalPath $localComposePath -RemotePath $remoteComposePath -Description "compose asset"
Sync-RemoteFileIfChanged -Server $server -LocalPath $localCaddyfilePath -RemotePath $remoteCaddyfilePath -Description "Caddy asset"
Ensure-RemoteFileFromTemplateIfMissing -Server $server -LocalTemplatePath $localWebEnvTemplatePath -RemotePath $remoteWebEnvPath -Description "server web.env bootstrap asset"

$quotedAppDir = ConvertTo-BashSingleQuoted -Value $appDir
$quotedComposeProjectName = ConvertTo-BashSingleQuoted -Value $composeProjectName
$quotedRemoteWebEnvPath = ConvertTo-BashSingleQuoted -Value $remoteWebEnvPath
$quotedWebImage = ConvertTo-BashSingleQuoted -Value $webImage
$quotedPublicMarketingUrl = ConvertTo-BashSingleQuoted -Value $publicMarketingUrl
$quotedPublicAppUrl = ConvertTo-BashSingleQuoted -Value $publicAppUrl

try {
  Invoke-RemoteCommand -Server $server -Script @"
set -uo pipefail
APP_DIR=$quotedAppDir
COMPOSE_PROJECT_NAME=$quotedComposeProjectName
WEB_ENV_PATH=$quotedRemoteWebEnvPath
WEB_IMAGE=$quotedWebImage
PUBLIC_MARKETING_URL=$quotedPublicMarketingUrl
PUBLIC_APP_URL=$quotedPublicAppUrl

upsert_env_var() {
  key="`$1"
  value="`$2"
  file_path="`$3"
  tmp_file="`$(mktemp)"

  if [ -f "`$file_path" ]; then
    awk -v key="`$key" -v value="`$value" '
      BEGIN { replaced = 0 }
      index(`$0, key "=") == 1 {
        print key "=" value
        replaced = 1
        next
      }
      { print }
      END {
        if (!replaced) {
          print key "=" value
        }
      }
    ' "`$file_path" > "`$tmp_file"
  else
    printf '%s=%s\n' "`$key" "`$value" > "`$tmp_file"
  fi

  mv "`$tmp_file" "`$file_path"
}

cd "`$APP_DIR"
upsert_env_var "WEB_IMAGE" "`$WEB_IMAGE" "`$WEB_ENV_PATH"
upsert_env_var "NEXT_PUBLIC_MARKETING_URL" "`$PUBLIC_MARKETING_URL" "`$WEB_ENV_PATH"
upsert_env_var "NEXT_PUBLIC_APP_URL" "`$PUBLIC_APP_URL" "`$WEB_ENV_PATH"
docker pull "`$WEB_IMAGE" || exit 1
docker compose --env-file "`$WEB_ENV_PATH" -p "`$COMPOSE_PROJECT_NAME" -f compose.yaml config -q || exit 1
docker compose --env-file "`$WEB_ENV_PATH" -p "`$COMPOSE_PROJECT_NAME" -f compose.yaml up -d --no-build || true
if ! docker inspect --format '{{.State.Running}}' agentkid-web 2>/dev/null | grep -Fx 'true' >/dev/null; then
  docker start agentkid-web >/dev/null 2>&1 || exit 1
fi
if ! docker inspect --format '{{.State.Running}}' agentkid-web 2>/dev/null | grep -Fx 'true' >/dev/null; then
  exit 1
fi
"@ | Out-Null
} catch {
  $webRunning = $false

  try {
    $webRunningOutput = Invoke-RemoteCommand -Server $server -Script @"
set -u
docker inspect --format '{{.State.Running}}' agentkid-web 2>/dev/null || true
"@
    $webRunning = (($webRunningOutput | Out-String).Trim() -eq "true")
  } catch {
    $webRunning = $false
  }

  if (-not $webRunning) {
    throw "Remote deploy failed before smoke checks for '$webImage' on $server. $($_.Exception.Message)"
  }

  Write-Host "Remote deploy command returned non-zero on $server, but agentkid-web is already running. Continuing to smoke checks."
}

try {
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "smoke-check.ps1") -ConfigPath $resolvedConfigPath
  if ($LASTEXITCODE -ne 0) {
    throw "smoke-check.ps1 exited with code $LASTEXITCODE."
  }
} catch {
  throw "Smoke checks failed for '$webImage' on $server. The server-side last-known-good record was not updated. $($_.Exception.Message)"
}

$stateRecord = [ordered]@{
  project = [string]$config.project.name
  tag = $resolvedImageTag
  image = $webImage
  composeProjectName = $composeProjectName
  appDir = $appDir
  server = $sshHost
  recordedAtUtc = [DateTime]::UtcNow.ToString("o")
  source = "deploy-server.ps1"
}
$stateJson = $stateRecord | ConvertTo-Json -Depth 4 -Compress
$quotedServerRollbackStateFile = ConvertTo-BashSingleQuoted -Value $serverRollbackStateFile
$quotedStateJson = ConvertTo-BashSingleQuoted -Value $stateJson

Invoke-RemoteCommand -Server $server -Script @"
set -euo pipefail
STATE_PATH=$quotedServerRollbackStateFile
STATE_JSON=$quotedStateJson
mkdir -p "`$(dirname "`$STATE_PATH")"
printf '%s\n' "`$STATE_JSON" > "`$STATE_PATH"
chmod 0644 "`$STATE_PATH"
"@ | Out-Null

if ($resolvedLocalRollbackCachePath) {
  Write-LocalRollbackCache -CachePath $resolvedLocalRollbackCachePath -Json $stateJson
}

Write-Host "Deploy succeeded for $webImage on $server. Last-known-good record updated at $serverRollbackStateFile"
