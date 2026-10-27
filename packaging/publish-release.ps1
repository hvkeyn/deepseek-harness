# Assemble and publish one release for every operating system.
#
# Windows artifacts come from the desktop packaging target, Linux from the WSL
# build that writes into DeepSeekHarness-dist-linux, and the skills make the same
# pass so the catalog URLs point at this tag. The script stages everything into
# dist\release-<version>, absolutizes the update feed, writes SHA256SUMS.txt, and
# uploads the set to hvkeyn/deepseek-harness.
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Version,
  [string]$Repository = 'hvkeyn/deepseek-harness',
  [string]$LinuxDirectory = 'C:\PROJECTS\DeepSeekHarness-dist-linux',
  [switch]$CreateRelease
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$tag = "binaries-$Version"
$stage = Join-Path $root "dist/release-$Version"
$winArtifacts = Join-Path $root 'apps/desktop/.desktop-build/targets/win-x64/unsigned-artifacts'
New-Item -ItemType Directory -Force $stage | Out-Null

function Add-File([string]$source, [string]$name) {
  if (-not (Test-Path $source)) { throw "missing artifact: $source" }
  Copy-Item $source (Join-Path $stage $name) -Force
}

$exe = "deepseek-harness-$Version-win-x64-unsigned.exe"
Add-File (Join-Path $winArtifacts $exe) $exe
Add-File (Join-Path $winArtifacts "$exe.blockmap") "$exe.blockmap"
Add-File (Join-Path $winArtifacts 'nightly.yml') 'nightly.yml'

$appImage = "deepseek-harness-$Version-linux-x86_64.AppImage"
Add-File (Join-Path $LinuxDirectory $appImage) $appImage
$appImageBlockmap = Join-Path $LinuxDirectory "$appImage.blockmap"
if (Test-Path $appImageBlockmap) { Add-File $appImageBlockmap "$appImage.blockmap" }

$tarballs = Join-Path $LinuxDirectory 'packed'
if (Test-Path $tarballs) {
  $archive = Join-Path $stage "deepseek-harness-$Version-npm-tarballs.tar.gz"
  tar -czf $archive -C $tarballs .
}

$skills = Join-Path $root 'dist/skills'
if (Test-Path (Join-Path $skills 'skills-index.json')) {
  Add-File (Join-Path $skills 'skills-index.json') 'skills-index.json'
  Get-ChildItem (Join-Path $skills 'files') -Filter '*.md' -ErrorAction SilentlyContinue |
    ForEach-Object { Add-File $_.FullName $_.Name }
  Add-File (Join-Path $skills 'hvkeyn-skills-1.0.0.zip') 'hvkeyn-skills-1.0.0.zip'
  Add-File (Join-Path $skills 'hvkeyn-skills-1.0.0.tar.gz') 'hvkeyn-skills-1.0.0.tar.gz'
}

& (Join-Path $PSScriptRoot 'absolutize-feed.ps1') -Feed (Join-Path $stage 'nightly.yml') -Tag $tag -Repository $Repository

Get-ChildItem $stage -File | Where-Object { $_.Name -ne 'SHA256SUMS.txt' } |
  ForEach-Object { "$((Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower())  $($_.Name)" } |
  Set-Content (Join-Path $stage 'SHA256SUMS.txt') -Encoding ascii

$files = Get-ChildItem $stage -File | ForEach-Object { $_.FullName }
if ($CreateRelease) {
  gh release create $tag -R $Repository --title "HVKeyn Edition $Version" --notes-file (Join-Path $stage 'notes.md') $files 2>&1 | Select-Object -Last 1
} else {
  gh release upload $tag -R $Repository $files --clobber 2>&1 | Select-Object -Last 1
}
"staged $($files.Count) file(s) for $tag"
