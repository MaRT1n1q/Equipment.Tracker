# 🚀 Мультиплатформенная сборка

Проект настроен для автоматической сборки под **Windows**, **macOS** и **Linux** через GitHub Actions.

## 📦 Поддерживаемые платформы

### Windows

- **Формат**: `.exe` (NSIS installer)
- **Архитектуры**: x64
- **Автообновление**: ✅ Поддерживается

### macOS

- **Форматы**:
  - `.dmg` (для установки)
  - `.zip` (альтернатива)
- **Архитектуры**:
  - x64 (Intel Mac)
  - arm64 (Apple Silicon M1/M2/M3)
- **Автообновление**: ✅ Поддерживается

### Linux

- **Форматы**:
  - `.AppImage` (универсальный, не требует установки)
  - `.deb` (для Debian/Ubuntu)
- **Архитектуры**: x64
- **Автообновление**: ✅ Поддерживается

## 🛠️ Локальная сборка

### Все платформы сразу

```bash
npm run build
```

### Windows

```bash
npm run build:win
```

### macOS

```bash
npm run build:mac
```

**Примечание**: Для сборки macOS нужна macOS система или GitHub Actions

### Linux

```bash
npm run build:linux
```

## 🤖 Автоматическая сборка через GitHub Actions

При создании нового релиза:

1. Обновите версию и создайте тег:

   ```bash
   release.bat
   ```

   Или вручную:

   ```bash
   npm version patch  # или minor, или major
   git push --follow-tags
   ```

2. GitHub Actions автоматически:
   - ✅ Соберёт приложение для **Windows**, **macOS** и **Linux**
   - ✅ Создаст релиз на GitHub
   - ✅ Загрузит все установщики
   - ✅ Настроит автообновление для всех платформ

3. Готовые файлы появятся здесь:
   - https://github.com/MaRT1n1q/Equipment.Tracker/releases

## 📋 Что будет в релизе

### Windows

- `Equipment-Tracker-X.X.X-win-x64.exe` - установщик
- `Equipment-Tracker-X.X.X-win-x64.exe.blockmap` - для быстрого обновления
- `latest.yml` - информация для автообновления

### macOS

- `Equipment-Tracker-X.X.X-mac-x64.dmg` - установщик для Intel Mac
- `Equipment-Tracker-X.X.X-mac-arm64.dmg` - установщик для Apple Silicon
- `Equipment-Tracker-X.X.X-mac-x64.zip` - архив для Intel Mac
- `Equipment-Tracker-X.X.X-mac-arm64.zip` - архив для Apple Silicon
- `*.dmg.blockmap` - для быстрого обновления
- `latest-mac.yml` - информация для автообновления

### Linux

- `Equipment-Tracker-X.X.X-linux-x64.AppImage` - запускаемый файл
- `Equipment-Tracker-X.X.X-linux-x64.deb` - пакет для Debian/Ubuntu
- `*.AppImage.blockmap` - для быстрого обновления
- `latest-linux.yml` - информация для автообновления

## 🔄 Как работает автообновление

Приложение автоматически проверяет наличие новых версий на GitHub:

- **Windows**: Скачивает и устанавливает обновление
- **macOS**: Скачивает и устанавливает обновление
- **Linux**: Уведомляет о новой версии

## ⚙️ Настройка иконок

Убедитесь, что в папке `build/` есть:

- `icon.ico` - для Windows (256x256)
- `icon.icns` - для macOS (512x512)
- `icon.png` - для Linux (512x512)

## 📝 Примечания

### Подпись приложений

Для продакшена рекомендуется настроить code signing:

**Windows**:

```json
"win": {
  "certificateFile": "path/to/cert.pfx",
  "certificatePassword": "password"
}
```

**macOS**:

```json
"mac": {
  "identity": "Developer ID Application: Your Name (TEAM_ID)"
}
```

### Ограничения

- **macOS**: Для сборки на Windows/Linux создаются неподписанные `.dmg` файлы
- **Подпись**: Полноценная подпись возможна только на соответствующей ОС через GitHub Actions
- **Notarization** (macOS): Требует Apple Developer аккаунт ($99/год)

## 🎯 Быстрый старт для разработчика

1. Склонируйте репозиторий
2. Установите зависимости: `npm install`
3. Запустите в dev-режиме: `npm run dev`
4. Создайте релиз: `release.bat` (выберите тип версии)
5. Подождите ~10-15 минут пока соберутся все платформы
6. Скачайте установщики с GitHub Releases

## 🐛 Troubleshooting

**Ошибка сборки Linux на Windows/macOS:**

```bash
# Установите дополнительные зависимости
npm install --save-dev @electron/rebuild
```

**Ошибка прав доступа на Linux:**

```bash
chmod +x Equipment-Tracker-*.AppImage
```

**macOS блокирует неподписанное приложение:**

```bash
xattr -cr "/Applications/Equipment Tracker.app"
```

## 📚 Ссылки

- [electron-builder документация](https://www.electron.build/)
- [electron-updater](https://www.electron.build/auto-update)
- [GitHub Actions](https://docs.github.com/en/actions)
