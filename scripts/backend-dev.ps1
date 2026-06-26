param(
  [int]$Port = 5180,
  [string]$StoragePath = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'lib\Panderuu.Dev.psm1') -Force
$root = Get-PanderuuRepoRoot

if (-not (Test-PanderuuCommand 'node')) {
  Write-PanderuuFail 'Node.js no esta disponible para iniciar el backend'
  exit 1
}

if ($StoragePath.Trim().Length -gt 0) {
  $env:PANDERUU_DB_JSON = $StoragePath
}

$env:PANDERUU_BACKEND_PORT = [string]$Port
Write-PanderuuStep "Backend real v0 en http://localhost:$Port"
Invoke-PanderuuChecked -FilePath 'node' -Arguments @('backend/server.mjs') -WorkingDirectory $root
