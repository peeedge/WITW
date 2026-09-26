# Start WitW locally: install dependencies, then run the Vite dev server.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\bootstrap.ps1
#    or: .\bootstrap.cmd
#    or: npm run bootstrap

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

function Assert-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name is not on PATH. Install Node.js from https://nodejs.org/ and reopen the terminal."
    }
}

Assert-Command "node"
Assert-Command "npm"

Write-Host "Installing WitW dependencies..."
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Starting WitW at http://127.0.0.1:5173/WITW/"
npm run dev -- --host 127.0.0.1 --open
exit $LASTEXITCODE
