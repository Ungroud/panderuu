param(
  [ValidateSet('dev', 'test', 'prod')]
  [string]$Environment = 'dev',
  [switch]$DryRun,
  [switch]$ConfirmProduction
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'lib\Panderuu.Dev.psm1') -Force
$root = Get-PanderuuRepoRoot
$dataDir = if ($Environment -eq 'dev') {
  Join-Path $root '.data\backend'
} else {
  Join-Path $root ".data\$Environment"
}
$dbPath = Join-Path $dataDir 'panderuu.db'

if ($Environment -eq 'prod' -and -not $ConfirmProduction) {
  Write-PanderuuFail 'Migracion prod bloqueada. Usa -ConfirmProduction despues de backup y aprobacion.'
  exit 1
}

if (-not (Test-Path $dataDir)) {
  New-Item -ItemType Directory -Path $dataDir | Out-Null
}

if (-not (Test-PanderuuCommand 'node')) {
  throw 'node no esta disponible.'
}

Write-PanderuuStep "Migraciones SQLite para $Environment"
$arguments = @('--no-warnings=ExperimentalWarning', 'backend/migrate.mjs', '--db', $dbPath)
if ($DryRun) {
  $arguments += '--dry-run'
}

Invoke-PanderuuChecked -FilePath 'node' -Arguments $arguments -WorkingDirectory $root
