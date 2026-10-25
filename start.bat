@echo off
chcp 65001 >nul
title Clever Rentals - Local Dev Server

echo ===================================================
echo     Запуск сайта «Клевер — Гостевые квартиры»
echo ===================================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 goto err_node

if not exist "node_modules" goto do_install
goto start_server

:do_install
echo [ИНФО] Установка зависимостей через npm...
call npm install
if %errorlevel% neq 0 goto err_install

:start_server
call node scripts/network-info.js

echo [ИНФО] Сайт откроется в браузере на этом ПК: http://localhost:5173/
echo [ИНФО] Для открытия на телефоне отсканируйте QR-код выше камерой телефона.
echo.

start "" /min cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5173/"
call npm run dev
if %errorlevel% neq 0 goto err_run
goto end

:err_node
echo [ОШИБКА] Node.js не установлен или не добавлен в PATH!
echo Скачайте и установите Node.js: https://nodejs.org/
goto fail

:err_install
echo [ОШИБКА] Не удалось установить зависимости npm.
goto fail

:err_run
echo.
echo [ОШИБКА] Сервер завершил работу с ошибкой.
goto fail

:fail
pause
exit /b 1

:end
