@echo off
echo ========================================
echo      INICIANDO SISTEMA CNH/PID
echo ========================================
echo.
echo Iniciando servidor e interface...
echo.

start "Servidor CNH/PID" cmd /k "cd /d %~dp0 && npm run server"
timeout /t 3 /nobreak >nul
start "Interface CNH/PID" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo Sistema iniciado!
echo.
echo O navegador abrira automaticamente
echo Para acessar de outros PCs, use o IP mostrado na janela "Servidor CNH/PID"
echo.
echo Login: admin / admin123
echo.
pause