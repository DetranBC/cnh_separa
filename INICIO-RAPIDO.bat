@echo off
echo ========================================
echo    SISTEMA CNH/PID - INICIO RAPIDO
echo ========================================
echo.
echo Este script vai iniciar o sistema automaticamente
echo.
echo Pressione qualquer tecla para continuar...
pause >nul

echo.
echo [1/2] Iniciando servidor (banco de dados)...
start "Servidor CNH/PID" cmd /k "cd /d %~dp0 && npm run server"

echo.
echo Aguardando 5 segundos para o servidor inicializar...
timeout /t 5 /nobreak >nul

echo.
echo [2/2] Iniciando interface do sistema...
start "Interface CNH/PID" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================
echo           SISTEMA INICIADO!
echo ========================================
echo.
echo O sistema sera aberto automaticamente no seu navegador
echo.
echo Para acessar de outros computadores, use o IP mostrado
echo na janela "Servidor CNH/PID"
echo.
echo Login padrao: admin / admin123
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul