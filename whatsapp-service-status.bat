@echo off
sc query MrSiamWhatsAppGateway
echo.
echo ====== محليا ======
curl.exe -s -m 10 http://localhost:3002/status
echo.
pause