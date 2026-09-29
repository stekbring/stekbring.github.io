@echo off
rem Dubbelklicka för att ge .egna10-filer egna10-ikonen i Utforskaren.
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0filikon.ps1"
echo.
pause
