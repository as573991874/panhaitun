@echo off
chcp 65001 >nul
title 别按那个键 - 打包工具
echo ========================================
echo    别按那个键 - 打包工具
echo ========================================
echo.
echo 正在打包，请稍候...
echo.

cd /d "%~dp0"
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
call npm run dist

if %errorlevel% equ 0 (
    echo.
    echo ========================================
echo    打包成功！
echo    输出目录：dist3\豚豚·别按那个键 1.0.0.exe
echo ========================================
echo.
pause
) else (
    echo.
    echo ========================================
echo    打包失败，请查看上方错误信息
echo ========================================
echo.
pause
)