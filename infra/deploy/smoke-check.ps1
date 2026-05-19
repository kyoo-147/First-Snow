[CmdletBinding()]
param(
  [string]$ConfigPath = "infra/deploy/deploy.config.local.json"
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

    throw "Remote smoke check failed on ${Server}: $message"
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

function Get-PublicChecks {
  param(
    [Parameter(Mandatory = $true)]
    $Config
  )

  $checks = @()
  $configuredChecks = @($Config.healthchecks.publicChecks)

  foreach ($check in $configuredChecks) {
    if ($null -eq $check) {
      continue
    }

    $url = [string]$check.url
    if ([string]::IsNullOrWhiteSpace($url)) {
      continue
    }

    $label = [string]$check.label
    if ([string]::IsNullOrWhiteSpace($label)) {
      $label = $url
    }

    $checks += [pscustomobject]@{
      Label = $label
      Url = $url
    }
  }

  if ($checks.Count -eq 0) {
    $legacyPublicUrl = [string]$Config.healthchecks.publicUrl
    if (-not [string]::IsNullOrWhiteSpace($legacyPublicUrl)) {
      $checks += [pscustomobject]@{
        Label = "public"
        Url = $legacyPublicUrl
      }
    }
  }

  if ($checks.Count -eq 0) {
    $projectPublicAppUrl = [string]$Config.project.publicAppUrl
    if ([string]::IsNullOrWhiteSpace($projectPublicAppUrl)) {
      throw "Config must provide healthchecks.publicChecks, healthchecks.publicUrl, or project.publicAppUrl."
    }

    $checks += [pscustomobject]@{
      Label = "app"
      Url = ([System.Uri]::new([System.Uri]$projectPublicAppUrl, "/")).AbsoluteUri
    }
  }

  return $checks
}

function Get-InternalPaths {
  param(
    [Parameter(Mandatory = $true)]
    $Config
  )

  $paths = @()
  foreach ($path in @($Config.healthchecks.internalPaths)) {
    $stringPath = [string]$path
    if (-not [string]::IsNullOrWhiteSpace($stringPath)) {
      $paths += $stringPath
    }
  }

  if ($paths.Count -eq 0) {
    $legacyInternalPath = [string]$Config.healthchecks.internalPath
    if (-not [string]::IsNullOrWhiteSpace($legacyInternalPath)) {
      $paths += $legacyInternalPath
    }
  }

  if ($paths.Count -eq 0) {
    $paths += "/"
  }

  return $paths
}

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
$statusCodes = @($config.healthchecks.expectedStatusCodes | ForEach-Object { [int]$_ })

if ($statusCodes.Count -eq 0) {
  throw "Config is missing healthchecks.expectedStatusCodes."
}

$publicChecks = @(Get-PublicChecks -Config $config)
$internalPaths = @(Get-InternalPaths -Config $config)
$sshUser = Get-RequiredConfigValue -Value $config.server.sshUser -Path "server.sshUser"
$sshHost = Get-RequiredConfigValue -Value $config.server.sshHost -Path "server.sshHost"
$appDir = Get-RequiredConfigValue -Value $config.server.appDir -Path "server.appDir"
$composeProjectName = Get-RequiredConfigValue -Value $config.server.composeProjectName -Path "server.composeProjectName"
$proxyType = Get-RequiredConfigValue -Value $config.proxy.type -Path "proxy.type"
$server = "{0}@{1}" -f $sshUser, $sshHost

$publicResults = @()
foreach ($publicCheck in $publicChecks) {
  $targetUri = [System.Uri]$publicCheck.Url
  $statusCode = $null

  try {
    $response = Invoke-WebRequest -Uri $targetUri.AbsoluteUri -Method Get -MaximumRedirection 0 -TimeoutSec 30 -UseBasicParsing
    $statusCode = [int]$response.StatusCode
  } catch {
    $webResponse = $_.Exception.Response
    if ($null -eq $webResponse -or $null -eq $webResponse.StatusCode) {
      throw
    }

    $statusCode = [int]$webResponse.StatusCode
  }

  if ($statusCodes -notcontains $statusCode) {
    $allowed = $statusCodes -join ", "
    throw "Unexpected public status code '$statusCode' for '$($targetUri.AbsoluteUri)'. Allowed: $allowed"
  }

  $publicResults += [pscustomobject]@{
    Label = $publicCheck.Label
    Url = $targetUri.AbsoluteUri
    StatusCode = $statusCode
  }
}

$allowedStatusList = $statusCodes -join ","
$webContainerName = "agentkid-web"
$caddyContainerName = "agentkid-caddy"
$remoteChecks = @(
  "set -e",
  ('APP_DIR={0}' -f (ConvertTo-BashSingleQuoted -Value $appDir)),
  ('COMPOSE_PROJECT_NAME={0}' -f (ConvertTo-BashSingleQuoted -Value $composeProjectName)),
  ('WEB_ENV_PATH={0}' -f (ConvertTo-BashSingleQuoted -Value "$appDir/web.env")),
  "cd ""`$APP_DIR""",
  "docker compose --env-file ""`$WEB_ENV_PATH"" -p ""`$COMPOSE_PROJECT_NAME"" -f compose.yaml ps --status running --services | grep -Fx 'web' >/dev/null",
  "docker inspect --format '{{.State.Running}}' $webContainerName | grep -Fx 'true' >/dev/null"
)

foreach ($internalPath in $internalPaths) {
  $internalTargetUrl = "http://127.0.0.1:3000$internalPath"
  $remoteChecks += ('INTERNAL_TARGET_URL={0}' -f (ConvertTo-BashSingleQuoted -Value $internalTargetUrl))
  $remoteChecks += "docker exec $webContainerName node -e ""fetch(process.argv[1]).then((res)=>process.exit([$allowedStatusList].includes(res.status)?0:1)).catch(()=>process.exit(1))"" ""`$INTERNAL_TARGET_URL"""
}

$remoteChecks += "docker logs --tail 200 $webContainerName 2>&1 | grep -E -i '(Unhandled|Exception|Cannot find module|EADDRINUSE|crash loop|CrashLoop|Error:)' && exit 1 || true"

if ($proxyType -eq "caddy") {
  $remoteChecks += "docker inspect --format '{{.State.Running}}' $caddyContainerName | grep -Fx 'true' >/dev/null"
  $remoteChecks += "docker logs --tail 100 $caddyContainerName 2>&1 | grep -E -i '(panic|segmentation fault|address already in use|error provisioning|Error:)' && exit 1 || true"
}

Invoke-RemoteCommand -Server $server -Script ($remoteChecks -join "; ") | Out-Null

$publicSummary = $publicResults | ForEach-Object {
  "{0}={1} ({2})" -f $_.Label, $_.StatusCode, $_.Url
}

Write-Host "Smoke check passed on $server. Public checks: $($publicSummary -join '; '). Internal paths: $($internalPaths -join ', ')"
