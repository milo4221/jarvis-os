@echo off
title J.A.R.V.I.S. OS Launcher

:: Start the server if not already running
netstat -an | findstr "9090" >nul 2>&1
if errorlevel 1 (
    cd /d "%USERPROFILE%\jarvis-os"
    start /min "" cmd /c "npx -y http-server -p 9090 -c-1 --silent"
    timeout /t 3 /nobreak >nul
)

:: Try Chrome first
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:9090 --window-size=1280,800
    goto :done
)
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --app=http://localhost:9090 --window-size=1280,800
    goto :done
)

:: Try Edge (every Windows 10/11 has it)
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:9090 --window-size=1280,800
    goto :done
)

:: Try Firefox
if exist "C:\Program Files\Mozilla Firefox\firefox.exe" (
    start "" "C:\Program Files\Mozilla Firefox\firefox.exe" -url http://localhost:9090
    goto :done
)

:: Try Brave
if exist "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" (
    start "" "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" --app=http://localhost:9090 --window-size=1280,800
    goto :done
)

:: Fallback: open in whatever the default browser is
start http://localhost:9090

:done
