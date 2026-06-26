Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'lib\Panderuu.Dev.psm1') -Force
$root = Get-PanderuuRepoRoot
$state = Get-PanderuuAppState

Write-PanderuuStep 'Estado del proyecto'
Write-Host "Repo: $root"

if (Test-PanderuuCommand 'git') {
  Push-Location $root
  try {
    git status --short --branch
    git log --oneline --decorate -1
  }
  finally {
    Pop-Location
  }
} else {
  Write-PanderuuWarn 'git no esta disponible'
}

Write-PanderuuStep 'Documentacion requerida'
$missingDocs = @()
foreach ($doc in Get-PanderuuRequiredDocs) {
  if (Test-PanderuuFile $doc) {
    Write-PanderuuOk $doc
  } else {
    Write-PanderuuFail $doc
    $missingDocs += $doc
  }
}

Write-PanderuuStep 'Estructura de app'
foreach ($key in $state.Keys) {
  if ($key -ne 'RepoRoot') {
    Write-Host ("{0,-16} {1}" -f $key, $state[$key])
  }
}

if ($missingDocs.Count -gt 0) {
  exit 1
}

