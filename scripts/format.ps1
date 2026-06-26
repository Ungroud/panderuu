param(
  [switch]$Check
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'lib\Panderuu.Dev.psm1') -Force
$root = Get-PanderuuRepoRoot

if ((Test-Path (Join-Path $root 'node_modules')) -and (Test-PanderuuCommand 'npm')) {
  if ($Check) {
    Invoke-PanderuuChecked -FilePath 'npm' -Arguments @('run', 'format:check') -WorkingDirectory $root
  } else {
    Invoke-PanderuuChecked -FilePath 'npm' -Arguments @('run', 'format:write') -WorkingDirectory $root
  }
} else {
  Write-PanderuuWarn 'No hay formatter instalado todavia. Se ejecuta lint documental como alternativa.'
  & (Join-Path $PSScriptRoot 'lint.ps1')
}

