@echo off
:: Start the server if not already running
netstat -an | findstr "9090" >nul 2>&1
if errorlevel 1 (
    cd /d "%USERPROFILE%\jarvis-os"
    start /min "" cmd /c "npx -y http-server -p 9090 -c-1 --silent"
    timeout /t 3 /nobreak >nul
)
:: Launch Chrome in app mode
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:9090 --window-size=1280,800
