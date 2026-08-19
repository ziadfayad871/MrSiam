@echo off
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo هتحتاج صلاحيات مدير - افتح طلب القبول وسجل الدخول
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

set "NODE=C:\Program Files\nodejs\node.exe"
if not exist "%NODE%" (
    for /f "delims=" %%i in ('where node 2^>nul') do set "NODE=%%i"
)
if not exist "%NODE%" (
    echo ما لقيتش Node على الجهاز - نزله من https://nodejs.org ثم أعد التشغيل
    pause
    exit /b
)

set "ROOT=%~dp0"
set "GW=%ROOT%backend\whatsapp-gateway"
set "NSSM=%ROOT%tools\nssm\nssm.exe"
set "APP=MrSiamWhatsAppGateway"

"%NSSM%" stop %APP% >nul 2>&1
"%NSSM%" remove %APP% confirm >nul 2>&1

"%NSSM%" install %APP% "%NODE%" "index.js"
"%NSSM%" set %APP% AppDirectory "%GW%"
"%NSSM%" set %APP% Start SERVICE_AUTO_START
"%NSSM%" set %APP% AppExit Default Restart
"%NSSM%" set %APP% AppRestartDelay 5000
"%NSSM%" set %APP% AppStdout "%GW%\service.out.log"
"%NSSM%" set %APP% AppStderr "%GW%\service.err.log"
"%NSSM%" set %APP% AppRotateFiles 1
"%NSSM%" set %APP% AppRotateOnline 1
"%NSSM%" set %APP% AppRotateBytes 1048576

"%NSSM%" start %APP%

echo.
echo ====== حالة الخدمة ======
sc query %APP%
echo.
echo الخطوة الأخيرة: افتح https://mrmohamedsiam.runasp.net/secretary/whatsapp وامسح QR
pause