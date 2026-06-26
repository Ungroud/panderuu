param(
  [switch]$Detailed
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'lib\Panderuu.Dev.psm1') -Force
$root = Get-PanderuuRepoRoot

Write-PanderuuStep 'Subagentes de desarrollo'

$agents = @(
  [ordered]@{
    Id = 'frontend-ui'
    Owner = 'Subagente Frontend/UI'
    Scope = 'React, dashboard, formularios, perfiles, boletas, tema visual'
    Docs = 'docs/subagentes/frontend-ui.md'
  },
  [ordered]@{
    Id = 'backend-db'
    Owner = 'Subagente Backend/DB'
    Scope = 'Tauri/Rust, SQLite, permisos, caja, prestamos, pagos, auditoria'
    Docs = 'docs/subagentes/backend-db.md'
  },
  [ordered]@{
    Id = 'devops-scripts'
    Owner = 'Subagente DevOps/Scripts'
    Scope = 'Scripts, bootstrap, build, migraciones, backup, release'
    Docs = 'docs/subagentes/devops-scripts.md'
  },
  [ordered]@{
    Id = 'qa-security'
    Owner = 'Subagente QA/Seguridad'
    Scope = 'Pruebas, permisos, datos sensibles, caja, boletas, backups'
    Docs = 'docs/subagentes/qa-security.md'
  }
)

foreach ($agent in $agents) {
  $docPath = Join-Path $root $agent.Docs
  $status = if (Test-Path $docPath) { 'documentado' } else { 'pendiente' }
  Write-Host ("{0,-16} {1,-28} {2}" -f $agent.Id, $status, $agent.Scope)
}

if ($Detailed) {
  Write-PanderuuStep 'Archivos de detalle'
  foreach ($agent in $agents) {
    Write-Host "- $($agent.Docs)"
  }
}

