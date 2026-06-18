@echo off
REM MIMO Cookie 获取工具
REM 使用方法：
REM   fetch-cookie.bat          # 首次运行，手动登录
REM   fetch-cookie.bat --auto   # 自动模式

cd /d "%~dp0"
node mimo-cookie-fetcher.js %*
pause
