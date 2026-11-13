# Run Blender headless for a Python script or expression.
#
# Finds the newest installed Blender unless -Blender is given, runs it with `-b`
# so no window is required, prints everything Blender wrote, and returns its exit
# code. A .blend path is optional: without one Blender starts from the empty file
# and the script is responsible for saving a new asset.
[CmdletBinding()]
param(
  [string]$Script,
  [string]$PythonExpr,
  [string]$BlendFile,
  [string]$Blender,
  [switch]$ListOnly
)

$ErrorActionPreference = 'Stop'
if (-not $Script -and -not $PythonExpr -and -not $ListOnly) {
  throw 'give -Script <file.py>, -PythonExpr "<code>", or -ListOnly'
}
if ($Script -and $PythonExpr) { throw 'use either -Script or -PythonExpr, not both' }

if (-not $Blender) {
  $command = Get-Command blender.exe -ErrorAction SilentlyContinue
  if ($command) { $Blender = $command.Source }
  else {
    $candidates = Get-ChildItem 'C:\Program Files\Blender Foundation' -Directory -ErrorAction SilentlyContinue |
      Sort-Object Name -Descending |
      ForEach-Object { Join-Path $_.FullName 'blender.exe' } |
      Where-Object { Test-Path $_ }
    $Blender = $candidates | Select-Object -First 1
  }
}
if (-not $Blender) {
  throw 'Blender not found: install it from https://www.blender.org/download/ or pass -Blender <path>'
}
if ($ListOnly) { "blender: $Blender"; & $Blender --version | Select-Object -First 2; exit 0 }

$arguments = @('--factory-startup', '-b')
if ($BlendFile) {
  if (-not (Test-Path $BlendFile)) { throw "blend file not found: $BlendFile" }
  $arguments += (Resolve-Path $BlendFile).Path
}
if ($Script) {
  if (-not (Test-Path $Script)) { throw "script not found: $Script" }
  $arguments += @('--python', (Resolve-Path $Script).Path)
} else {
  $arguments += @('--python-expr', $PythonExpr)
}

& $Blender @arguments
$code = $LASTEXITCODE
if ($code -ne 0) { Write-Warning "Blender exited with $code" }
exit $code
