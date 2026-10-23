# Build the installable skills index published beside the release.
#
# Each skill is one Markdown file. The index names its release URL, hash, and
# per-language summary, so the app can list the catalog, install a skill, and
# detect an installed file that changed.
[CmdletBinding()]
param(
  [string]$Version = '1.0.0',
  [string]$Tag = 'binaries-0.2.4',
  [string]$Repository = 'hvkeyn/deepseek-harness',
  [string]$OutputDirectory = 'dist/skills'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$skillsRoot = Join-Path $root '.dsh/skills'
$output = Join-Path $root $OutputDirectory
$filesDir = Join-Path $output 'files'
$i18nPath = Join-Path $PSScriptRoot 'skills-i18n.json'

if (-not (Test-Path $skillsRoot)) { throw "skills directory not found: $skillsRoot" }
if (-not (Test-Path $i18nPath)) { throw "skills translations not found: $i18nPath" }
New-Item -ItemType Directory -Force $filesDir | Out-Null

$translations = Get-Content $i18nPath -Raw -Encoding UTF8 | ConvertFrom-Json
$base = "https://github.com/$Repository/releases/download/$Tag/"
$entries = @()
foreach ($file in (Get-ChildItem $skillsRoot -Filter *.md -File | Sort-Object Name)) {
  $name = [IO.Path]::GetFileNameWithoutExtension($file.Name)
  $hash = (Get-FileHash $file.FullName -Algorithm SHA256).Hash.ToLower()
  $text = Get-Content $file.FullName -Raw -Encoding UTF8
  $summary = ($text -split "`n" | Where-Object { $_ -match '^Use this ' } | Select-Object -First 1)
  if (-not $summary) { $summary = ($text -split "`n" | Where-Object { $_.Trim() -ne '' } | Select-Object -First 1) }
  $localized = $translations.$name
  $entry = [ordered]@{
    name        = $name
    version     = $Version
    file        = "hvkeyn-skill-$name.md"
    url         = "$base" + "hvkeyn-skill-$name.md"
    sha256      = $hash
    description = [ordered]@{
      en = $summary.Trim()
      ru = if ($localized -and $localized.ru) { $localized.ru } else { $summary.Trim() }
      zh = if ($localized -and $localized.zh) { $localized.zh } else { $summary.Trim() }
    }
  }
  $entries += $entry
  $target = Join-Path $filesDir $entry.file
  Copy-Item $file.FullName $target -Force
  $actual = (Get-FileHash $target -Algorithm SHA256).Hash.ToLower()
  if ($actual -ne $hash) { throw "hash mismatch after copy for $name" }
}

$index = [ordered]@{
  schemaVersion = 1
  name          = 'hvkeyn-skills'
  version       = $Version
  skills        = $entries
}
$indexPath = Join-Path $output 'skills-index.json'
$index | ConvertTo-Json -Depth 6 | Set-Content $indexPath -Encoding UTF8
"index: $indexPath"
"skills: $($entries.Count)"
$entries | ForEach-Object { " - $($_.name) $($_.sha256.Substring(0, 12))" }
