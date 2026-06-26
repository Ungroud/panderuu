param(
  [switch]$Strict
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'lib\Panderuu.Dev.psm1') -Force
$root = Get-PanderuuRepoRoot

Write-PanderuuStep 'Pruebas de documentacion y scripts'
& (Join-Path $PSScriptRoot 'lint.ps1') -Strict:$Strict

if ((Test-Path (Join-Path $root 'src')) -and (Test-PanderuuCommand 'npm')) {
  if (Test-Path (Join-Path $root 'node_modules')) {
    Write-PanderuuStep 'Pruebas frontend'
    Invoke-PanderuuChecked -FilePath 'npm' -Arguments @('run', 'test:app') -WorkingDirectory $root
  } else {
    Write-PanderuuWarn 'No hay node_modules; se omiten pruebas frontend'
    if ($Strict) { exit 1 }
  }
}

if ((Test-Path (Join-Path $root 'src-tauri\Cargo.toml')) -and (Test-PanderuuCommand 'cargo')) {
  Write-PanderuuStep 'Pruebas Rust'
  Invoke-PanderuuChecked -FilePath 'cargo' -Arguments @('test') -WorkingDirectory (Join-Path $root 'src-tauri')
} elseif ($Strict) {
  Write-PanderuuWarn 'No existe src-tauri/Cargo.toml'
}

Write-PanderuuOk 'Pruebas finalizadas'

