@echo off
echo ========================================
echo    INSTALACAO AUTOMATICA - SISTEMA CNH
echo ========================================
echo.
echo Este script vai instalar tudo automaticamente
echo Aguarde alguns minutos...
echo.

echo [1/4] Instalando dependencias do frontend...
call npm install

echo.
echo [2/4] Entrando na pasta do servidor...
cd server

echo.
echo [3/4] Instalando dependencias do servidor...
call npm install

echo.
echo [4/4] Voltando para pasta principal...
cd ..

echo.
echo ========================================
echo        INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo Para usar o sistema diariamente:
echo 1. Clique duplo em "USAR-SISTEMA.bat"
echo 2. Ou execute: npm run start-all
echo.
echo Login padrao: admin / admin123
echo.
pause