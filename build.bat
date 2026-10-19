@echo off
rem Build DeepSeek Harness from source on Windows.
rem
rem Mirrors the build ergonomics of the KARAT Chat project: one entry script that
rem installs dependencies, builds the shipped artifacts, and optionally packages
rem the Desktop installer. Outputs land in dist\.
setlocal enabledelayedexpansion
chcp 65001 >nul
set "ROOT=%~dp0"
cd /d "%ROOT%"

set "DO_DESKTOP=0"
set "DO_PACK=0"
set "SKIP_INSTALL=0"

:parse
if "%~1"=="" goto parsed
if /I "%~1"=="--desktop"     ( set "DO_DESKTOP=1" & shift & goto parse )
if /I "%~1"=="--pack"        ( set "DO_PACK=1" & shift & goto parse )
if /I "%~1"=="--no-install"  ( set "SKIP_INSTALL=1" & shift & goto parse )
if /I "%~1"=="-h"            goto usage
if /I "%~1"=="--help"        goto usage
echo build.bat: unknown option "%~1" 1>&2
goto usage_error
:parsed

rem --- prerequisites ----------------------------------------------------------

where node >nul 2>nul
if errorlevel 1 goto missing_node

set "NODE_VERSION="
for /f "delims=" %%v in ('node -p "process.versions.node" 2^>nul') do set "NODE_VERSION=%%v"
if not defined NODE_VERSION goto no_node_version

for /f "tokens=1,2 delims=." %%a in ("!NODE_VERSION!") do (
  set "NODE_MAJOR=%%a"
  set "NODE_MINOR=%%b"
)
set "NODE_OK=0"
if !NODE_MAJOR! GEQ 24 set "NODE_OK=1"
if !NODE_MAJOR! EQU 22 if !NODE_MINOR! GEQ 19 set "NODE_OK=1"
if "!NODE_OK!"=="0" goto unsupported_node
echo Node.js !NODE_VERSION!

set "PNPM="
where pnpm >nul 2>nul && set "PNPM=pnpm"
if defined PNPM goto have_pnpm
where corepack >nul 2>nul && set "PNPM=corepack pnpm"
if not defined PNPM goto try_npx
call corepack enable pnpm >nul 2>nul
goto have_pnpm
:try_npx
where npx >nul 2>nul && set "PNPM=npx --yes pnpm@11.28.5"
if not defined PNPM goto no_pnpm
:have_pnpm

set "VERSION="
for /f "delims=" %%v in ('node -p "require('./package.json').version" 2^>nul') do set "VERSION=%%v"
echo DeepSeek Harness !VERSION!

if not exist dist mkdir dist

rem --- build ------------------------------------------------------------------

if "%SKIP_INSTALL%"=="1" goto build_step
echo ^>^> %PNPM% install --frozen-lockfile
call !PNPM! install --frozen-lockfile
if errorlevel 1 exit /b 1

:build_step
if "%DO_PACK%"=="1" goto official_build
echo ^>^> %PNPM% run build
call !PNPM! run build
if errorlevel 1 exit /b 1
goto after_build

:official_build
echo ^>^> %PNPM% run build:official
call !PNPM! run build:official
if errorlevel 1 exit /b 1

:after_build
if not "%DO_PACK%"=="1" goto after_pack
echo ^>^> %PNPM% run release:pack --family dsh
if not exist "dist\packed" mkdir "dist\packed"
call !PNPM! run release:pack --family dsh --out "dist\packed"
if errorlevel 1 exit /b 1

:after_pack
if not "%DO_DESKTOP%"=="1" goto done
if not exist "apps\desktop\.env.windows" goto missing_desktop_env
echo ^>^> %PNPM% run package:desktop:win:x64:unsigned
call !PNPM! run package:desktop:win:x64:unsigned
if errorlevel 1 exit /b 1
if not exist "dist\win" mkdir "dist\win"
copy /Y "apps\desktop\.desktop-build\targets\win-x64\unsigned-artifacts\*.exe" "dist\win\" >nul

goto done

:done
echo.
echo Done. Run the Web UI with:
echo   %PNPM% dsh web
exit /b 0

rem --- errors ------------------------------------------------------------------

:missing_node
echo build.bat: Node.js is required: 22.19 or newer, or 24 or newer. Install it from https://nodejs.org/ 1>&2
exit /b 1

:no_node_version
echo build.bat: cannot query the Node.js version 1>&2
exit /b 1

:unsupported_node
echo build.bat: Node.js !NODE_VERSION! is unsupported; the repository requires 22.19 or newer, or 24 or newer 1>&2
exit /b 1

:no_pnpm
echo build.bat: pnpm is required. Run "corepack enable" with Node.js 22 or newer installed. 1>&2
exit /b 1

:missing_desktop_env
echo build.bat: Desktop packaging needs apps\desktop\.env.windows 1>&2
echo           Copy apps\desktop\.env.windows.example to .env.windows and set 1>&2
echo           DSH_DESKTOP_APP_ID, the mandatory-update origins, and DOWNLOAD_TEST_RELEASE_ID. 1>&2
exit /b 1

:usage
echo Usage: build.bat [options]
echo.
echo   (no options)    install dependencies and run the complete repository build
echo   --desktop       additionally package the Desktop application for Windows
echo   --pack          additionally produce the publishable dsh npm tarballs
echo   --no-install    reuse an existing node_modules instead of running pnpm install
echo   -h, --help      show this help
echo.
echo Outputs land in dist\.
exit /b 0

:usage_error
exit /b 2
