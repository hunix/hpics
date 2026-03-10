<#
.SYNOPSIS
Builds and deploys the PICS Desktop Ghost Agent.

.DESCRIPTION
This script uses the Rust toolchain (cargo) to compile the desktop daemon into a 
release binary.
#>

$ErrorActionPreference = "Stop"
$WorkingDir = $PSScriptRoot | Split-Path -Parent
$DesktopDir = Join-Path $WorkingDir "src-desktop"
$OutputDir = Join-Path $WorkingDir "builds"

Write-Host "===================================="
Write-Host "PICS Desktop Ghost Agent Deploy"
Write-Host "===================================="

if (!(Test-Path $DesktopDir)) {
    Write-Error "Desktop Ghost directory not found at $DesktopDir"
    exit 1
}

if (!(Get-Command "cargo" -ErrorAction SilentlyContinue)) {
    Write-Error "Rust toolchain (cargo) is not installed or not in PATH. Please install rustup."
    exit 1
}

Write-Host "Compiling Rust Daemon for Release mode. This may take a minute..."
Set-Location $DesktopDir

# Compile
cargo build --release

if ($LASTEXITCODE -ne 0) {
    Write-Error "Cargo build failed."
    exit $LASTEXITCODE
}

$BinaryPath = Join-Path $DesktopDir "target\release\pics-omni-desktop.exe"
$DeployPath = Join-Path $OutputDir "pics-omni-desktop.exe"

if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

Copy-Item -Path $BinaryPath -Destination $DeployPath -Force

Write-Host "`nDesktop Daemon built successfully!" -ForegroundColor Green
Write-Host "Executable copied to: $DeployPath" -ForegroundColor Cyan
Write-Host "`nTo run the agent in the background:"
Write-Host "Execute $DeployPath"
Write-Host "For a production environment, consider setting this up as a Windows Service using NSSM."

Set-Location $WorkingDir
