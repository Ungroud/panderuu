param(
  [string]$Name = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'lib\Panderuu.Dev.psm1') -Force
$root = Get-PanderuuRepoRoot
$dataDir = Join-Path $root '.data'
$backupDir = Join-Path $dataDir 'backups'

if (-not (Test-Path $dataDir)) {
  New-Item -ItemType Directory -Path $dataDir | Out-Null
}
if (-not (Test-Path $backupDir)) {
  New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$safeName = if ($Name.Trim().Length -gt 0) { $Name.Trim() -replace '[^a-zA-Z0-9._-]', '-' } else { 'dev' }
$zipPath = Join-Path $backupDir "panderuu-$safeName-$stamp.zip"
$manifestPath = Join-Path $dataDir 'backup-manifest.txt'

"Panderuu backup $stamp" | Set-Content -Path $manifestPath -Encoding ASCII
"Repo: $root" | Add-Content -Path $manifestPath -Encoding ASCII

$items = @()
foreach ($relative in @('panderuu.db', 'audio', 'receipts', 'backup-manifest.txt')) {
  $path = Join-Path $dataDir $relative
  if (Test-Path $path) {
    $items += $path
  }
}

if ($items.Count -eq 0) {
  Write-PanderuuWarn 'No hay datos de runtime para respaldar todavia.'
  exit 0
}

Compress-Archive -Path $items -DestinationPath $zipPath -Force
Write-PanderuuOk "Backup creado: $zipPath"

