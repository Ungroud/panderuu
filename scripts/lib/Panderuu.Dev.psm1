Set-StrictMode -Version Latest

function Get-PanderuuRepoRoot {
  $moduleDir = Split-Path -Parent $PSCommandPath
  return (Resolve-Path (Join-Path $moduleDir '..\..')).Path
}

function Write-PanderuuStep {
  param([Parameter(Mandatory = $true)][string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-PanderuuOk {
  param([Parameter(Mandatory = $true)][string]$Message)
  Write-Host "[ok] $Message" -ForegroundColor Green
}

function Write-PanderuuWarn {
  param([Parameter(Mandatory = $true)][string]$Message)
  Write-Host "[warn] $Message" -ForegroundColor Yellow
}

function Write-PanderuuFail {
  param([Parameter(Mandatory = $true)][string]$Message)
  Write-Host "[fail] $Message" -ForegroundColor Red
}

function Test-PanderuuCommand {
  param([Parameter(Mandatory = $true)][string]$Name)
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Invoke-PanderuuChecked {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [string[]]$Arguments = @(),
    [string]$WorkingDirectory = (Get-PanderuuRepoRoot)
  )

  Push-Location $WorkingDirectory
  try {
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "$FilePath exited with code $LASTEXITCODE"
    }
  }
  finally {
    Pop-Location
  }
}

function Get-PanderuuRequiredDocs {
  return @(
    'Panderuu.md',
    'docs/00-informe-general.md',
    'docs/01-reglas-negocio.md',
    'docs/02-modelo-datos.md',
    'docs/03-flujos-pantalla.md',
    'docs/04-arte-diseno.md',
    'docs/05-tecnologias.md',
    'docs/06-seguridad-auditoria.md',
    'docs/07-versiones-feats.md',
    'docs/08-commits-desarrollo.md',
    'docs/09-subagentes-desarrollo.md',
    'docs/10-backend-real.md'
  )
}

function Test-PanderuuFile {
  param([Parameter(Mandatory = $true)][string]$Path)
  $root = Get-PanderuuRepoRoot
  return Test-Path (Join-Path $root $Path)
}

function Get-PanderuuAppState {
  $root = Get-PanderuuRepoRoot
  return [ordered]@{
    RepoRoot = $root
    HasSrc = Test-Path (Join-Path $root 'src')
    HasTauri = Test-Path (Join-Path $root 'src-tauri')
    HasMigrations = Test-Path (Join-Path $root 'backend\sqlite-storage.mjs')
    HasBackend = Test-Path (Join-Path $root 'backend\server.mjs')
    HasBackendStorage = Test-Path (Join-Path $root '.data\backend\panderuu.db')
    HasNodeModules = Test-Path (Join-Path $root 'node_modules')
    HasPackageLock = Test-Path (Join-Path $root 'package-lock.json')
    HasDataDir = Test-Path (Join-Path $root '.data')
  }
}

Export-ModuleMember -Function `
  Get-PanderuuRepoRoot, `
  Write-PanderuuStep, `
  Write-PanderuuOk, `
  Write-PanderuuWarn, `
  Write-PanderuuFail, `
  Test-PanderuuCommand, `
  Invoke-PanderuuChecked, `
  Get-PanderuuRequiredDocs, `
  Test-PanderuuFile, `
  Get-PanderuuAppState
