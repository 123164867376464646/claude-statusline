@echo off
REM 创建 Windows 定时任务，每 12 小时自动更新 cookie
REM 需要以管理员权限运行

echo 正在创建定时任务...

schtasks /create /tn "MIMO-Cookie-AutoUpdate" /tr "node \"%~dp0mimo-cookie-fetcher.js\" --auto" /sc hourly /mo 12 /f

if %errorlevel% equ 0 (
    echo ✅ 定时任务创建成功！
    echo    任务名称: MIMO-Cookie-AutoUpdate
    echo    执行频率: 每 12 小时
    echo    执行命令: node mimo-cookie-fetcher.js --auto
    echo.
    echo 查看任务: schtasks /query /tn "MIMO-Cookie-AutoUpdate"
    echo 删除任务: schtasks /delete /tn "MIMO-Cookie-AutoUpdate" /f
) else (
    echo ❌ 创建失败，请以管理员权限运行此脚本
)

pause
