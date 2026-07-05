@echo off
chcp 65001 >nul
title 豚豚·别按那个键 - 开发模式
echo ========================================
echo    豚豚·别按那个键 - 开发模式
echo ========================================
echo.
echo 启动中...
echo.

cd /d "%~dp0"
npx electron .

echo.
echo 游戏已退出
pause