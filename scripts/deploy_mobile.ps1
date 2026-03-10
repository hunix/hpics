<#
.SYNOPSIS
Deploys the PICS Mobile Ambient Interceptor.

.DESCRIPTION
This script provides the automated build step for compiling the React Native 
Android app containing the PICS Native Services into an APK.
#>

$ErrorActionPreference = "Stop"
$WorkingDir = $PSScriptRoot | Split-Path -Parent
$MobileDir = Join-Path $WorkingDir "src-mobile"
$OutputDir = Join-Path $WorkingDir "builds"

Write-Host "===================================="
Write-Host "PICS Mobile Ambient Agent Deploy"
Write-Host "===================================="

if (!(Test-Path $MobileDir)) {
    Write-Error "Mobile directory not found at $MobileDir"
    exit 1
}

Write-Host "NOTE: Ensure you have Android Studio, SDKs, and JDK 17 installed."
Write-Host "Building Android APK (Release)..."

Set-Location $MobileDir\android
# Using gradlew to build the release APK
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Error "Gradle build failed."
    exit $LASTEXITCODE
}

$ApkPath = Join-Path $MobileDir "app\build\outputs\apk\release\app-release.apk"
$DeployPath = Join-Path $OutputDir "pics-ambient-agent.apk"

if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

if (Test-Path $ApkPath) {
    Copy-Item -Path $ApkPath -Destination $DeployPath -Force
    Write-Host "`nMobile App built successfully!" -ForegroundColor Green
    Write-Host "APK copied to: $DeployPath" -ForegroundColor Cyan
    Write-Host "`nTo install on your connected device:"
    Write-Host "adb install -r $DeployPath"
    Write-Host "`nCRITICAL: Don't forget to enable Accessibility and Notification permissions in Android Settings after installation!" -ForegroundColor Yellow
} else {
    Write-Error "APK not found at expected path: $ApkPath"
}

Set-Location $WorkingDir
