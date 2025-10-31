# Настройка GitHub для автоматических релизов

## Проблема с правами доступа

Если вы видите ошибку `403 Forbidden` при создании релиза через GitHub Actions, нужно настроить права доступа.

## Решение

### 1. Настройка прав в репозитории

Перейдите в настройки репозитория на GitHub:

1. Откройте: `https://github.com/MaRT1n1q/Equipment.Tracker/settings/actions`
2. Найдите раздел **"Workflow permissions"**
3. Выберите **"Read and write permissions"** (вместо "Read repository contents and packages permissions")
4. Включите опцию **"Allow GitHub Actions to create and approve pull requests"** (опционально)
5. Нажмите **"Save"**

### 2. Обновление workflow файла

Убедитесь, что в `.github/workflows/release.yml` добавлена секция `permissions`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*.*.*'

permissions:
  contents: write # ← Важно!

jobs:
  release:
    runs-on: windows-latest
    # ...
```

### 3. Повторный запуск

После настройки прав, перезапустите workflow:

#### Вариант A: Через GitHub UI

1. Перейдите на вкладку **Actions**
2. Найдите неудачный workflow
3. Нажмите **"Re-run jobs"** → **"Re-run all jobs"**

#### Вариант B: Создать новый тег

```bash
# Удалить старый тег локально и на GitHub
git tag -d v1.0.8
git push origin :refs/tags/v1.0.8

# Создать новый тег
npm version patch
git push
git push --tags
```

## Проверка настроек

### Текущие настройки можно проверить:

1. Перейдите: `https://github.com/MaRT1n1q/Equipment.Tracker/settings/actions`
2. Проверьте, что выбрано **"Read and write permissions"**

### Если ошибка повторяется:

1. Проверьте, что вы являетесь владельцем репозитория
2. Убедитесь, что репозиторий не является fork'ом (у fork'ов ограниченные права)
3. Проверьте, что нет организационных политик, блокирующих создание релизов

## Альтернативное решение: Personal Access Token

Если встроенный `GITHUB_TOKEN` не работает, можно использовать Personal Access Token:

### 1. Создание токена

1. Перейдите: `https://github.com/settings/tokens`
2. Нажмите **"Generate new token"** → **"Generate new token (classic)"**
3. Выберите права:
   - ✅ `repo` (полный доступ к репозиториям)
   - ✅ `write:packages` (опционально)
4. Сгенерируйте и скопируйте токен

### 2. Добавление в Secrets

1. Откройте: `https://github.com/MaRT1n1q/Equipment.Tracker/settings/secrets/actions`
2. Нажмите **"New repository secret"**
3. Имя: `RELEASE_TOKEN`
4. Значение: ваш токен
5. Нажмите **"Add secret"**

### 3. Обновление workflow

Замените в `.github/workflows/release.yml`:

```yaml
- name: Build application
  run: npm run build:win
  env:
    GH_TOKEN: ${{ secrets.RELEASE_TOKEN }} # Вместо GITHUB_TOKEN
```

## Текущий статус

После применения этих настроек автоматическая публикация релизов должна работать корректно.

## Проверка работоспособности

Создайте тестовый релиз:

```bash
npm version patch
git push && git push --tags
```

Следите за процессом в Actions: `https://github.com/MaRT1n1q/Equipment.Tracker/actions`
