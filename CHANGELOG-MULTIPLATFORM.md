# Что изменилось: Мультиплатформенная сборка

## ✨ Новые возможности

### 🌍 Поддержка всех платформ

Теперь приложение автоматически собирается для:

- **Windows** (x64) - NSIS установщик `.exe`
- **macOS** Intel (x64) - `.dmg` и `.zip`
- **macOS** Apple Silicon (arm64) - `.dmg` и `.zip`
- **Linux** (x64) - `.AppImage` и `.deb`

### 🤖 GitHub Actions Workflow

- Параллельная сборка на трёх раннерах (windows-latest, macos-latest, ubuntu-latest)
- Автоматическая загрузка всех артефактов в один релиз
- Все файлы автообновления (latest.yml, latest-mac.yml, latest-linux.yml)
- Полное описание релиза с инструкциями для каждой платформы

### 📦 Автоматизация

- **release.bat** - для быстрого создания релиза только Windows
- **release-multiplatform.bat** - для создания мультиплатформенного релиза
- Автоматический выбор типа версии (patch/minor/major)
- Автоматический commit, tag и push

## 📁 Новые файлы

- `.github/workflows/release.yml` - обновлён для мультиплатформенной сборки
- `MULTIPLATFORM.md` - подробная документация по мультиплатформенности
- `release-multiplatform.bat` - скрипт для создания мультиплатформенного релиза
- `CHANGELOG-MULTIPLATFORM.md` - этот файл

## ⚙️ Изменения в конфигурации

### package.json

- Скрипты для сборки всех платформ уже были настроены
- Конфигурация electron-builder для mac, linux, win
- Правильные artifactName для всех платформ

### GitHub Actions

- 3 отдельные джобы для сборки (build-windows, build-macos, build-linux)
- 1 джоба для создания релиза (create-release) после завершения всех сборок
- Использование actions/upload-artifact@v4 и actions/download-artifact@v4
- Обновлённое описание релиза с инструкциями для всех ОС

## 🚀 Как использовать

### Быстрый релиз

```bash
release-multiplatform.bat
```

### Ручной релиз

```bash
npm version patch  # или minor, или major
git push --follow-tags
```

### Локальная сборка

```bash
# Все платформы
npm run build

# Только Windows
npm run build:win

# Только macOS
npm run build:mac

# Только Linux
npm run build:linux
```

## ⏱️ Время сборки

- **Windows**: ~3-5 минут
- **macOS**: ~5-7 минут (2 архитектуры)
- **Linux**: ~3-5 минут
- **Общее время**: ~10-15 минут

## 📝 Примечания

- macOS сборки **не подписаны** (требует Apple Developer аккаунт)
- Windows сборки **не подписаны** (можно добавить certificate позже)
- Linux AppImage работает на всех дистрибутивах без установки
- Автообновление работает на всех платформах

## 🔗 Ссылки

- **Релизы**: https://github.com/MaRT1n1q/Equipment.Tracker/releases
- **GitHub Actions**: https://github.com/MaRT1n1q/Equipment.Tracker/actions
- **Документация**: [MULTIPLATFORM.md](./MULTIPLATFORM.md)
