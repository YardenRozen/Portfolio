@echo off
REM Double-click: publish the CV files in cv\ to the live portfolio now.
REM With -Watch: keep running and publish automatically whenever a CV changes.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0publish-cv.ps1" %*
if "%~1"=="" pause
