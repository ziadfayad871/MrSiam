@echo off
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)
set "ROOT=%~dp0"
set "NSSM=%ROOT%tools\nssm\nssm.exe"
set "APP=MrSiamWhatsAppGateway"
"%NSSM%" stop %APP% >nul 2>&1
"%NSSM%" remove %APP% confirm
echo.
echo تمت الإزالة
pause