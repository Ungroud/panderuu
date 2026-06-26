param(
  [switch]$Strict
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'lib\Panderuu.Dev.psm1') -Force
$root = Get-PanderuuRepoRoot
$failed = $false

Write-PanderuuStep 'Lint documental'

foreach ($doc in Get-PanderuuRequiredDocs) {
  if (-not (Test-PanderuuFile $doc)) {
    Write-PanderuuFail "Falta $doc"
    $failed = $true
  }
}

if (Test-PanderuuCommand 'rg') {
  Push-Location $root
  try {
    $oldNames = rg -n 'Joseline|Jordan|Roger|Paolo|Daniela|Gianela|Andrea' Panderuu.md docs 2>$null
    if ($LASTEXITCODE -eq 0) {
      Write-PanderuuFail 'Se encontraron nombres del documento anterior:'
      Write-Host $oldNames
      $failed = $true
    } else {
      Write-PanderuuOk 'No hay nombres personales del documento anterior'
    }

    $nonAscii = rg -n '[^\x00-\x7F]' Panderuu.md docs package.json scripts 2>$null
    if ($LASTEXITCODE -eq 0) {
      Write-PanderuuFail 'Se encontraron caracteres no ASCII:'
      Write-Host $nonAscii
      $failed = $true
    } else {
      Write-PanderuuOk 'Contenido ASCII validado'
    }
  }
  finally {
    Pop-Location
  }
} else {
  Write-PanderuuWarn 'rg no esta disponible; se omite lint de contenido'
}

if (Test-Path (Join-Path $root 'src')) {
  if ((Test-Path (Join-Path $root 'node_modules')) -and (Test-PanderuuCommand 'npm')) {
    Write-PanderuuStep 'Lint de app'
    Invoke-PanderuuChecked -FilePath 'npm' -Arguments @('run', 'lint:app') -WorkingDirectory $root
  } else {
    Write-PanderuuWarn 'App detectada, pero dependencias npm no instaladas'
    if ($Strict) { $failed = $true }
  }
}

if ($failed) {
  exit 1
}

Write-PanderuuOk 'Lint finalizado'

