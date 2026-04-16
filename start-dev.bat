@echo off
REM Start development server (double-click this file)
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies...
  npm install
)
echo Starting dev server on http://localhost:3000
npm run dev
