param(
  [switch]$CreateTag,
  [string]$Version = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'lib\Panderuu.Dev.psm1') -Force
$root = Get-PanderuuRepoRoot

Write-PanderuuStep 'Release gate'
& (Join-Path $PSScriptRoot 'test.ps1') -Strict

if (Test-Path (Join-Path $root 'src')) {
  & (Join-Path $PSScriptRoot 'build.ps1')
} else {
  Write-PanderuuWarn 'Sin app scaffold; release gate se limita a documentacion y scripts.'
}

if ($CreateTag) {
  if ($Version.Trim().Length -eq 0) {
    throw 'Indica -Version vX.Y.Z para crear tag.'
  }
  Invoke-PanderuuChecked -FilePath 'git' -Arguments @('tag', '-a', $Version, '-m', "release $Version") -WorkingDirectory $root
  Write-PanderuuOk "Tag creado: $Version"
} else {
  Write-PanderuuWarn 'No se creo tag. Usa -CreateTag -Version vX.Y.Z cuando corresponda.'
}

