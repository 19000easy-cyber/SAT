#!/usr/bin/env pwsh
# Start development server (right-click -> Run with PowerShell)
Push-Location $PSScriptRoot
if (-not (Test-Path node_modules)) {
  Write-Host "Installi,ong dependencies..."
  npm install
}
Write-Host "Starting dev server on http://localhost:3000"
npm run dev
Pop-Location
