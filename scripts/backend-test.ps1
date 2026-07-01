Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'lib\Panderuu.Dev.psm1') -Force
$root = Get-PanderuuRepoRoot

if (-not (Test-PanderuuCommand 'node')) {
  Write-PanderuuFail 'Node.js no esta disponible para probar el backend'
  exit 1
}

Write-PanderuuStep 'Pruebas del backend real v1'
Invoke-PanderuuChecked -FilePath 'node' -Arguments @('--no-warnings=ExperimentalWarning', 'backend/test.mjs') -WorkingDirectory $root
Write-PanderuuOk 'Backend probado'
