# Sign a Windows installer with a locally generated self-signed code-signing certificate.
#
# A self-signed certificate makes the file Authenticode-signed and lets anyone
# verify that the bytes came from this machine's key. Windows does not trust the
# certificate until it is installed in Trusted Root Certification Authorities, so
# SmartScreen and the UAC prompt still read "Unknown publisher". A certificate a
# stranger's Windows already trusts must come from a public CA with an identity
# check; this script cannot and does not replace that.
#
# Usage:
#   pwsh -File packaging/sign-windows-selfsigned.ps1 -File dist\release\app.exe
#
# Outputs the .cer beside the signed file; install it under "Trusted Root
# Certification Authorities" (or "Trusted Publishers") on a machine that should
# accept this publisher.

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$File,
  [string]$Subject = 'CN=HVKeyn Edition, O=HVKeyn, C=RU',
  [string]$CertificateOut,
  [string]$TimestampServer = 'http://timestamp.digicert.com',
  [switch]$WhatIfSign
)

$ErrorActionPreference = 'Stop'

$target = (Resolve-Path -LiteralPath $File).Path
if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
  throw "sign-windows-selfsigned: $File is not a file"
}

$certificate = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert |
  Where-Object { $_.Subject -eq $Subject } |
  Sort-Object NotAfter -Descending |
  Select-Object -First 1

if ($null -eq $certificate) {
  Write-Host ">> creating self-signed code-signing certificate: $Subject"
  $certificate = New-SelfSignedCertificate `
    -Type CodeSigningCert `
    -Subject $Subject `
    -KeyUsage DigitalSignature `
    -KeyAlgorithm RSA `
    -KeyLength 3072 `
    -HashAlgorithm SHA256 `
    -CertStoreLocation Cert:\CurrentUser\My `
    -NotAfter (Get-Date).AddYears(3)
}
else {
  Write-Host ">> reusing certificate thumbprint $($certificate.Thumbprint)"
}

if ([string]::IsNullOrWhiteSpace($CertificateOut)) {
  $CertificateOut = [System.IO.Path]::ChangeExtension($target, '.cer')
}
$exported = [System.IO.Path]::GetFullPath($CertificateOut)
Export-Certificate -Cert $certificate -FilePath $exported -Type CERT | Out-Null
Write-Host ">> public certificate: $exported"

if ($WhatIfSign) {
  Write-Host ">> -WhatIfSign set; skipping the signature"
  exit 0
}

$parameters = @{
  FilePath      = $target
  Certificate   = $certificate
  HashAlgorithm = 'SHA256'
}
if (-not [string]::IsNullOrWhiteSpace($TimestampServer)) {
  $parameters.TimestampServer = $TimestampServer
}

Write-Host ">> signing $target"
$signature = Set-AuthenticodeSignature @parameters

$signed = Get-AuthenticodeSignature -LiteralPath $target
Write-Host ">> status=$($signed.Status) signer=$($signed.SignerCertificate.Subject) thumbprint=$($signed.SignerCertificate.Thumbprint)"
Write-Host ">> timestamp=$($signed.TimeStamperCertificate.NotBefore)"
if ($signed.Status -ne 'Valid') {
  Write-Host ">> Windows does not trust this certificate yet; install $exported as a trusted root to make it Valid on that machine."
}
