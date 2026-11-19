# Publish the skills catalog independently of an application release.
#
# The catalog lives on its own tag (`skills-v1`), so adding, fixing, or removing a
# skill never requires rebuilding the app. The tag is a prerelease on purpose:
# `releases/latest` keeps resolving to the newest application release, which is
# what the update feed relies on.
[CmdletBinding()]
param(
  [string]$Tag = 'skills-v1',
  [string]$Version = '1.2.0',
  [string]$Repository = 'hvkeyn/deepseek-harness'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

& (Join-Path $PSScriptRoot 'make-skills-index.ps1') -Tag $Tag -Repository $Repository
& (Join-Path $PSScriptRoot 'make-skills-package.ps1') -Version $Version

$stage = Join-Path $root "dist/skills/$Version"
New-Item -ItemType Directory -Force $stage | Out-Null
Copy-Item (Join-Path $root 'dist/skills/skills-index.json') $stage -Force
Copy-Item (Join-Path $root "dist/skills/hvkeyn-skills-$Version.zip") $stage -Force
Copy-Item (Join-Path $root "dist/skills/hvkeyn-skills-$Version.tar.gz") $stage -Force

$existing = gh release view $Tag -R $Repository --json tagName *> $null
$exists = $LASTEXITCODE -eq 0
if (-not $exists) {
  gh release create $Tag -R $Repository --title "HVKeyn skills $Version" --prerelease --notes "Skills catalog for HVKeyn Edition; updated independently of the application release." 2>&1 | Select-Object -Last 1
}
$files = @(
  (Join-Path $stage 'skills-index.json'),
  (Join-Path $stage "hvkeyn-skills-$Version.zip"),
  (Join-Path $stage "hvkeyn-skills-$Version.tar.gz")
)
$files += Get-ChildItem (Join-Path $root 'dist/skills/files') -Filter '*.md' | ForEach-Object { $_.FullName }
gh release upload $Tag -R $Repository $files --clobber 2>&1 | Select-Object -Last 1

$served = curl.exe -sL --max-time 60 "https://github.com/$Repository/releases/download/$Tag/skills-index.json"
$count = ($served | Select-String '"name":').Count
"published $($files.Count) file(s) to $Tag; index serves $count name(s)"
