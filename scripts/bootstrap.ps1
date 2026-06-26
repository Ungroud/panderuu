param(
  [switch]$Install
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'lib\Panderuu.Dev.psm1') -Force
$root = Get-PanderuuRepoRoot

Write-PanderuuStep 'Preparando entorno local'

$dirs = @(
  '.data',
  '.data\backups',
  '.data\audio',
  '.data\receipts',
  'src',
  'src-tauri',
  'src-tauri\migrations'
)

foreach ($dir in $dirs) {
  $path = Join-Path $root $dir
  if (-not (Test-Path $path)) {
    New-Item -ItemType Directory -Path $path | Out-Null
    Write-PanderuuOk "Creado $dir"
  } else {
    Write-PanderuuOk "Existe $dir"
  }
}

Write-PanderuuStep 'Herramientas'
foreach ($tool in @('node', 'npm', 'rustc', 'cargo', 'git')) {
  if (Test-PanderuuCommand $tool) {
    $version = (& $tool --version 2>$null | Select-Object -First 1)
    Write-PanderuuOk "$tool $version"
  } else {
    Write-PanderuuWarn "$tool no encontrado"
  }
}

if ($Install) {
  if (Test-PanderuuCommand 'npm') {
    Write-PanderuuStep 'Instalando dependencias npm'
    Invoke-PanderuuChecked -FilePath 'npm' -Arguments @('install') -WorkingDirectory $root
  } else {
    throw 'npm no esta disponible para instalar dependencias.'
  }
} else {
  Write-PanderuuWarn 'No se instalaron dependencias. Usa scripts/bootstrap.ps1 -Install cuando exista acceso a red.'
}

