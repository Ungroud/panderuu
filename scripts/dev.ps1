param(
  [switch]$WebOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'lib\Panderuu.Dev.psm1') -Force
$root = Get-PanderuuRepoRoot

if (-not (Test-Path (Join-Path $root 'src'))) {
  Write-PanderuuWarn 'Aun no existe src/. Ejecuta la fase del subagente frontend-ui antes de iniciar dev.'
  exit 0
}

if (-not (Test-Path (Join-Path $root 'node_modules'))) {
  Write-PanderuuWarn 'Faltan dependencias. Ejecuta npm run bootstrap -- -Install.'
  exit 1
}

if ($WebOnly) {
  Invoke-PanderuuChecked -FilePath 'npm' -Arguments @('run', 'dev:web') -WorkingDirectory $root
} else {
  if (Test-Path (Join-Path $root 'src-tauri')) {
    Invoke-PanderuuChecked -FilePath 'npm' -Arguments @('run', 'tauri:dev') -WorkingDirectory $root
  } else {
    Invoke-PanderuuChecked -FilePath 'npm' -Arguments @('run', 'dev:web') -WorkingDirectory $root
  }
}

