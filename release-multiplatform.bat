@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo =============================================
echo   🌍 Мультиплатформенная автоматическая сборка
echo =============================================
echo.
echo GitHub Actions будет собирать приложение для:
echo   ✅ Windows (x64) - .exe
echo   ✅ macOS (Intel и Apple Silicon) - .dmg, .zip
echo   ✅ Linux (x64) - .AppImage, .deb
echo.
echo =============================================
echo.

REM Проверка на незакоммиченные изменения
git diff --quiet
if errorlevel 1 (
    echo ❌ Ошибка: У вас есть незакоммиченные изменения!
    echo Пожалуйста, закоммитьте или отмените изменения перед релизом.
    pause
    exit /b 1
)

git diff --cached --quiet
if errorlevel 1 (
    echo ❌ Ошибка: У вас есть добавленные, но незакоммиченные изменения!
    echo Пожалуйста, закоммитьте или отмените изменения перед релизом.
    pause
    exit /b 1
)

echo ✅ Рабочая директория чиста
echo.

REM Запрос типа обновления версии
echo Выберите тип обновления версии:
echo   1 - patch  (1.0.9 → 1.0.10) - мелкие исправления
echo   2 - minor  (1.0.9 → 1.1.0)  - новые функции
echo   3 - major  (1.0.9 → 2.0.0)  - крупные изменения
echo.
set /p VERSION_TYPE="Введите номер (1-3): "

if "%VERSION_TYPE%"=="1" (
    set UPDATE_TYPE=patch
    echo.
    echo 📦 Создаём patch-релиз...
) else if "%VERSION_TYPE%"=="2" (
    set UPDATE_TYPE=minor
    echo.
    echo 📦 Создаём minor-релиз...
) else if "%VERSION_TYPE%"=="3" (
    set UPDATE_TYPE=major
    echo.
    echo 📦 Создаём major-релиз...
) else (
    echo ❌ Неверный выбор!
    pause
    exit /b 1
)
echo.

REM Получение текущей версии
for /f "tokens=2 delims=:, " %%a in ('findstr /c:"\"version\"" package.json') do (
    set CURRENT_VERSION=%%a
    set CURRENT_VERSION=!CURRENT_VERSION:"=!
)
echo 📌 Текущая версия: !CURRENT_VERSION!
echo.

REM Обновление версии в package.json
echo 🔄 Обновляю версию в package.json...
call npm version %UPDATE_TYPE% --no-git-tag-version
if errorlevel 1 (
    echo ❌ Ошибка при обновлении версии!
    pause
    exit /b 1
)

REM Получение новой версии
for /f "tokens=2 delims=:, " %%a in ('findstr /c:"\"version\"" package.json') do (
    set NEW_VERSION=%%a
    set NEW_VERSION=!NEW_VERSION:"=!
)
echo ✅ Новая версия: !NEW_VERSION!
echo.

REM Коммит изменений
echo 💾 Коммичу изменение версии...
git add package.json package-lock.json
git commit -m "chore: bump version to !NEW_VERSION!"
if errorlevel 1 (
    echo ❌ Ошибка при создании коммита!
    pause
    exit /b 1
)
echo ✅ Коммит создан
echo.

REM Создание тега
echo 🏷️  Создаю тег v!NEW_VERSION!...
git tag v!NEW_VERSION!
if errorlevel 1 (
    echo ❌ Ошибка при создании тега!
    pause
    exit /b 1
)
echo ✅ Тег создан
echo.

REM Пуш изменений
echo 📤 Отправляю изменения на GitHub...
git push
if errorlevel 1 (
    echo ❌ Ошибка при отправке коммита!
    pause
    exit /b 1
)
echo ✅ Коммит отправлен
echo.

echo 📤 Отправляю тег на GitHub...
git push origin v!NEW_VERSION!
if errorlevel 1 (
    echo ❌ Ошибка при отправке тега!
    pause
    exit /b 1
)
echo ✅ Тег отправлен
echo.

echo ====================================
echo   ✅ Мультиплатформенный релиз запущен!
echo ====================================
echo.
echo 📦 Версия: !NEW_VERSION!
echo.
echo 🔗 Проверьте GitHub Actions:
echo    https://github.com/MaRT1n1q/Equipment.Tracker/actions
echo.
echo ⏳ Через ~10-15 минут релиз появится здесь:
echo    https://github.com/MaRT1n1q/Equipment.Tracker/releases/tag/v!NEW_VERSION!
echo.
echo 🌍 Будут собраны версии для:
echo    • Windows (x64) - .exe установщик
echo    • macOS Intel (x64) - .dmg и .zip
echo    • macOS Apple Silicon (arm64) - .dmg и .zip
echo    • Linux (x64) - .AppImage и .deb
echo.

pause
