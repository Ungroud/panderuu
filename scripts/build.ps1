param(
  [switch]$WebOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'lib\Panderuu.Dev.psm1') -Force
$root = Get-PanderuuRepoRoot

Write-PanderuuStep 'Build web'
Invoke-PanderuuChecked -FilePath 'npm' -Arguments @('run', 'build:web') -WorkingDirectory $root

if (-not $WebOnly) {
  if ((Test-Path (Join-Path $root 'src-tauri\Cargo.toml')) -and (Test-Path (Join-Path $root 'node_modules'))) {
    Write-PanderuuStep 'Build escritorio'
    Invoke-PanderuuChecked -FilePath 'npm' -Arguments @('run', 'tauri:build') -WorkingDirectory $root
  } else {
    Write-PanderuuWarn 'No existe src-tauri; se omite build Tauri'
  }
}
