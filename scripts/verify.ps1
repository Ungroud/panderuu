param(
  [switch]$Strict
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'lib\Panderuu.Dev.psm1') -Force

Write-PanderuuStep 'Verificacion integral'
& (Join-Path $PSScriptRoot 'status.ps1')
& (Join-Path $PSScriptRoot 'lint.ps1') -Strict:$Strict
& (Join-Path $PSScriptRoot 'test.ps1') -Strict:$Strict
& (Join-Path $PSScriptRoot 'db-migrate.ps1') -DryRun

Write-PanderuuOk 'Verificacion integral finalizada'

