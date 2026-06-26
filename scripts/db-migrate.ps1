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
$migrations = Join-Path $root 'src-tauri\migrations'
$dataDir = Join-Path $root ".data\$Environment"
$dbPath = Join-Path $dataDir 'panderuu.db'

if ($Environment -eq 'prod' -and -not $ConfirmProduction) {
  Write-PanderuuFail 'Migracion prod bloqueada. Usa -ConfirmProduction despues de backup y aprobacion.'
  exit 1
}

if (-not (Test-Path $dataDir)) {
  New-Item -ItemType Directory -Path $dataDir | Out-Null
}

if (-not (Test-Path $migrations)) {
  Write-PanderuuWarn 'No existe src-tauri/migrations. Ejecuta bootstrap o la fase backend-db.'
  exit 0
}

if ($DryRun) {
  Write-PanderuuStep "Migraciones disponibles para $Environment"
  Write-Host "DB: $dbPath"
  Get-ChildItem $migrations -File | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
  exit 0
}

if (-not (Test-PanderuuCommand 'cargo')) {
  throw 'cargo no esta disponible.'
}

if (-not (Test-Path (Join-Path $root 'src-tauri\Cargo.toml'))) {
  Write-PanderuuWarn 'No existe src-tauri/Cargo.toml. Aun no se puede ejecutar migracion real.'
  exit 0
}

Write-PanderuuStep 'Ejecutando migraciones via backend'
Invoke-PanderuuChecked -FilePath 'cargo' -Arguments @('run', '--', 'migrate', $Environment, $dbPath) -WorkingDirectory (Join-Path $root 'src-tauri')
