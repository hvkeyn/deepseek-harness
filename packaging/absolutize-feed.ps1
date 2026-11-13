# Rewrite a generated nightly.yml so every download URL is absolute.
#
# electron-updater resolves a relative `files[].url` against the feed URL it was
# served from — and `releases/latest/download/` is a moving redirect. A client
# that read one release's feed but downloads after `latest` moved asks the new
# tag for the old file's name and gets 404. Absolute URLs pin each feed to its
# own release, which stays downloadable forever.
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Feed,
  [Parameter(Mandatory = $true)][string]$Tag,
  [string]$Repository = 'hvkeyn/deepseek-harness'
)

$ErrorActionPreference = 'Stop'
if (-not (Test-Path $Feed)) { throw "feed not found: $Feed" }

$lines = Get-Content $Feed
$base = "https://github.com/$Repository/releases/download/$Tag/"
$out = foreach ($line in $lines) {
  if ($line -match '^\s*-\s*url:\s*(\S+)\s*$') {
    $name = $Matches[1]
    if ($name -match '^https?://') { $name = Split-Path -Leaf $name }
    '  - url: ' + $base + $name
  } elseif ($line -match '^path:\s*(\S+)\s*$') {
    'path: ' + $base + $Matches[1]
  } else {
    $line
  }
}
Set-Content $Feed $out -Encoding UTF8
"feed rewritten: $Feed"
Get-Content $Feed | Select-Object -First 3
