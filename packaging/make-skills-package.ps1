# Build the installable skills package.
#
# A skill is one UTF-8 Markdown file; the package is those files, a manifest that
# lists them, and an install note. Publish it beside the release so a user can
# unzip it into a skill root instead of copying files one by one.
[CmdletBinding()]
param(
  [string]$Version = '1.0.0',
  [string]$OutputDirectory = 'dist/skills'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$skillsRoot = Join-Path $root '.dsh/skills'
$output = Join-Path $root $OutputDirectory
$stage = Join-Path $output "hvkeyn-skills-$Version"

if (-not (Test-Path $skillsRoot)) { throw "skills directory not found: $skillsRoot" }
Remove-Item -Recurse -Force $stage -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $stage | Out-Null

$libraryRoot = Join-Path $root 'dist/skills/library'
$files = @(Get-ChildItem $skillsRoot -Filter *.md -File)
if (Test-Path $libraryRoot) { $files += Get-ChildItem $libraryRoot -Filter *.md -File }
$files = $files | Sort-Object Name
if ($files.Count -eq 0) { throw "no skill files in $skillsRoot" }

$entries = @()
foreach ($file in $files) {
  $name = [IO.Path]::GetFileNameWithoutExtension($file.Name)
  $text = Get-Content $file.FullName -Raw -Encoding UTF8
  if ($text.Length -gt 12000) { Write-Warning "skipped ${name}: $($text.Length) characters exceeds the 12000 limit"; continue }
  $summary = ($text -split "`n" | Where-Object { $_ -match '^Use this ' } | Select-Object -First 1)
  if (-not $summary) { $summary = ($text -split "`n" | Where-Object { $_.Trim() -ne '' } | Select-Object -First 1) }
  $entries += [ordered]@{ name = $name; file = "$name.md"; summary = $summary.Trim() }
  Copy-Item $file.FullName (Join-Path $stage $file.Name) -Force
}

$manifest = [ordered]@{
  schemaVersion = 1
  name          = 'hvkeyn-skills'
  version       = $Version
  description   = 'Example skills for DeepSeek Harness: review, debug, research, learn, security, and Russian translation.'
  skills        = $entries
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $stage 'manifest.json') -Encoding UTF8

$skillCount = $entries.Count
$skillList = ($entries | ForEach-Object { '- `' + $_.name + '` — ' + $_.summary }) -join "`n"
$readme = @"
# HVKeyn skills $Version

$skillCount skills in the DeepSeek Harness local skill format: a title, a
``Use this when`` line, and numbered steps.

## Install

Every workspace (copy the files):

    $stage

to

    %USERPROFILE%\.dsh\skills

One project only: copy them into ``<project>\.dsh\skills`` instead. The
filesystem provider scans both roots, watches them, and the catalog picks up new,
renamed, and deleted files without a restart.

## Skills

$skillList

## Manage

List them with ``/`` in the composer, or through a session's skill catalog.
Disable a skill without deleting the file by withholding its name in the
registry; delete the file to remove it.
"@
Set-Content (Join-Path $stage 'README.md') $readme -Encoding UTF8

$zip = Join-Path $output "hvkeyn-skills-$Version.zip"
Remove-Item $zip -Force -ErrorAction SilentlyContinue
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip

$tarball = Join-Path $output "hvkeyn-skills-$Version.tar.gz"
Remove-Item $tarball -Force -ErrorAction SilentlyContinue
tar -czf $tarball -C $stage .

"package: $zip"
"archive: $tarball"
"skills: $($entries.Count)"
