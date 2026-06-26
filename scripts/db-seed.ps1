param(
  [ValidateSet('dev', 'test')]
  [string]$Environment = 'dev'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'lib\Panderuu.Dev.psm1') -Force
$root = Get-PanderuuRepoRoot
$seedDir = Join-Path $root 'src-tauri\seeds'

if (-not (Test-Path $seedDir)) {
  Write-PanderuuWarn 'No existe src-tauri/seeds. El subagente backend-db debe agregar datos demo seguros.'
  exit 0
}

if (-not (Test-Path (Join-Path $root 'src-tauri\Cargo.toml'))) {
  Write-PanderuuWarn 'No existe src-tauri/Cargo.toml. Aun no se puede ejecutar seed real.'
  exit 0
}

Write-PanderuuStep "Ejecutando seed $Environment"
Invoke-PanderuuChecked -FilePath 'cargo' -Arguments @('run', '--', 'seed', $Environment) -WorkingDirectory (Join-Path $root 'src-tauri')

