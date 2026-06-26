param(
  [ValidateSet('dev', 'test')]
  [string]$Environment = 'dev',
  [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'lib\Panderuu.Dev.psm1') -Force
$root = Get-PanderuuRepoRoot
$dataRoot = Join-Path $root ".data\$Environment"
$dbPath = Join-Path $dataRoot 'panderuu.db'

if ($Environment -eq 'dev' -and -not $Force) {
  Write-PanderuuWarn 'db-reset para dev requiere -Force para evitar borrados accidentales.'
  exit 1
}

if (-not (Test-Path $dataRoot)) {
  New-Item -ItemType Directory -Path $dataRoot | Out-Null
}

if (Test-Path $dbPath) {
  Remove-Item -LiteralPath $dbPath -Force
  Write-PanderuuOk "DB eliminada: $dbPath"
} else {
  Write-PanderuuWarn "No existia DB: $dbPath"
}

& (Join-Path $PSScriptRoot 'db-migrate.ps1') -Environment $Environment

