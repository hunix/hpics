<#
.SYNOPSIS
Deploys the PICS Omni-Extractor Chrome Extension.

.DESCRIPTION
This script packages the src-extension directory into a zip file ready to be uploaded 
to the Chrome Web Store or distributed for Developer Mode loading.
#>

$ErrorActionPreference = "Stop"
$WorkingDir = $PSScriptRoot | Split-Path -Parent
$ExtensionDir = Join-Path $WorkingDir "src-extension"
$OutputDir = Join-Path $WorkingDir "builds"
$ZipPath = Join-Path $OutputDir "pics-omni-extension-v1.zip"

Write-Host "===================================="
Write-Host "PICS Omni-Extractor Extension Deploy"
Write-Host "===================================="

if (!(Test-Path $ExtensionDir)) {
    Write-Error "Extension directory not found at $ExtensionDir"
    exit 1
}

if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
    Write-Host "Created output directory: $OutputDir"
}

if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

Write-Host "Compressing $ExtensionDir into $ZipPath..."
Compress-Archive -Path "$ExtensionDir\*" -DestinationPath $ZipPath -Force

Write-Host "`nDeployment package created successfully at:" -ForegroundColor Green
Write-Host $ZipPath -ForegroundColor Cyan
Write-Host "`nTo install manually:"
Write-Host "1. Go to chrome://extensions/"
Write-Host "2. Enable Developer mode"
Write-Host "3. Drag and drop the .zip file or load the unpacked src-extension folder."
