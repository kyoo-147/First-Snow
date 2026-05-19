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
  $remoteTempScriptPath = "/tmp/agentkid-remote-{0}.sh" -f ([guid]::NewGuid().ToString("N"))

  try {
    [System.IO.File]::WriteAllText($localTempScriptPath, $normalizedScript, [System.Text.UTF8Encoding]::new($false))
    & scp $localTempScriptPath "${Server}:$remoteTempScriptPath" | Out-Null

    if ($LASTEXITCODE -ne 0) {
      throw ("Failed to copy remote script to {0}:{1}." -f $Server, $remoteTempScriptPath)
    }

    $output = & ssh $Server "bash $remoteTempScriptPath; rm -f $remoteTempScriptPath" 2>&1
  } finally {
    if (Test-Path -LiteralPath $localTempScriptPath) {
      Remove-Item -LiteralPath $localTempScriptPath -Force
    }
  }

  if ($LASTEXITCODE -ne 0) {
    $message = ($output | Out-String).Trim()
    if ([string]::IsNullOrWhiteSpace($message)) {
      $message = "remote command failed without output"
    }

    throw "Remote command failed on ${Server}: $message"
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

function Resolve-RollbackImageTag {
  param(
    [Parameter(Mandatory = $true)]
    [pscustomobject]$Config,
    [string]$RequestedTag
  )

  if (-not [string]::IsNullOrWhiteSpace($RequestedTag)) {
    return $RequestedTag
  }

  $sshUser = Get-RequiredConfigValue -Value $Config.server.sshUser -Path "server.sshUser"
  $sshHost = Get-RequiredConfigValue -Value $Config.server.sshHost -Path "server.sshHost"
  $appDir = Get-RequiredConfigValue -Value $Config.server.appDir -Path "server.appDir"
  $serverRollbackStateFile = [string]$Config.deploy.serverRollbackStateFile

  if ([string]::IsNullOrWhiteSpace($serverRollbackStateFile)) {
    $serverRollbackStateFile = "$appDir/.state/last-known-good.json"
  }

  $server = "{0}@{1}" -f $sshUser, $sshHost
  $quotedStatePath = ConvertTo-BashSingleQuoted -Value $serverRollbackStateFile
  $stateJson = Invoke-RemoteCommand -Server $server -Script @"
set -e
STATE_PATH=$quotedStatePath
if [ ! -f "\$STATE_PATH" ]; then
  echo "Missing last-known-good record at \$STATE_PATH" >&2
  exit 1
fi
cat "\$STATE_PATH"
"@

  $stateRecord = ($stateJson | Out-String).Trim() | ConvertFrom-Json
  $recordedTag = [string]$stateRecord.tag

  if ([string]::IsNullOrWhiteSpace($recordedTag)) {
    throw "Server-side last-known-good record at '$serverRollbackStateFile' does not contain a 'tag' value."
  }

  return $recordedTag
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
    throw "Refusing to roll back to the mutable 'latest' tag. Provide an immutable image tag."
  }
}

$script:RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$resolvedConfigPath = Resolve-RepoPath -Path $ConfigPath

if (-not (Test-Path -LiteralPath $resolvedConfigPath)) {
  throw "Deploy config not found at '$resolvedConfigPath'."
}

$config = Get-Content -Raw -LiteralPath $resolvedConfigPath | ConvertFrom-Json
$resolvedImageTag = Resolve-RollbackImageTag -Config $config -RequestedTag $ImageTag
Assert-SafeImageTag -Tag $resolvedImageTag

& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "deploy-server.ps1") -ConfigPath $resolvedConfigPath -ImageTag $resolvedImageTag

if ($LASTEXITCODE -ne 0) {
  throw "Rollback failed while redeploying immutable tag '$resolvedImageTag'."
}

Write-Host "Rollback completed by redeploying immutable tag '$resolvedImageTag'"
