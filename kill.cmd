@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill.ps1" %*
exit /b %ERRORLEVEL%
