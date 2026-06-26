Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'lib\Panderuu.Dev.psm1') -Force

Write-PanderuuStep 'Check rapido'
& (Join-Path $PSScriptRoot 'status.ps1')
& (Join-Path $PSScriptRoot 'lint.ps1')
& (Join-Path $PSScriptRoot 'test.ps1')

Write-PanderuuOk 'Check rapido finalizado'

