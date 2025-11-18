<div align="center">

# 🎯 Equipment Tracker

**Профессиональная система учёта оборудования и выходов сотрудников**

[![Latest Release](https://img.shields.io/github/v/release/MaRT1n1q/Equipment.Tracker?style=for-the-badge&logo=github&color=blue)](https://github.com/MaRT1n1q/Equipment.Tracker/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/MaRT1n1q/Equipment.Tracker/total?style=for-the-badge&logo=download&color=green)](https://github.com/MaRT1n1q/Equipment.Tracker/releases)
[![License](https://img.shields.io/github/license/MaRT1n1q/Equipment.Tracker?style=for-the-badge&color=orange)](LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/MaRT1n1q/Equipment.Tracker/release.yml?style=for-the-badge&logo=github-actions)](https://github.com/MaRT1n1q/Equipment.Tracker/actions)

**Десктопное приложение для учёта выдачи оборудования и управления выходами сотрудников**  
_Оффлайн-первый подход • Современный UI • Кросс-платформенность_

[📥 Скачать](#-скачать) • [✨ Возможности](#-возможности) • [📚 Документация](#-документация) • [🚀 Быстрый старт](#-быстрый-старт)

---

</div>

## 📥 Скачать

<div align="center">

### 🪟 Windows (x64)

[![Download Windows](https://img.shields.io/badge/💾_Скачать-Windows_x64-0078D4?style=for-the-badge&logo=windows)](https://github.com/MaRT1n1q/Equipment.Tracker/releases/latest)

### 🍏 macOS

[![Download macOS Intel](<https://img.shields.io/badge/💾_Скачать-Intel_(x64)-000000?style=for-the-badge&logo=apple>)](https://github.com/MaRT1n1q/Equipment.Tracker/releases/latest)
[![Download macOS ARM](<https://img.shields.io/badge/💾_Скачать-Apple_Silicon_(arm64)-000000?style=for-the-badge&logo=apple>)](https://github.com/MaRT1n1q/Equipment.Tracker/releases/latest)

### 🐧 Linux (x64)

[![Download Linux AppImage](https://img.shields.io/badge/💾_Скачать-AppImage-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://github.com/MaRT1n1q/Equipment.Tracker/releases/latest)
[![Download Linux DEB](https://img.shields.io/badge/💾_Скачать-DEB-A81D33?style=for-the-badge&logo=debian&logoColor=white)](https://github.com/MaRT1n1q/Equipment.Tracker/releases/latest)

**🔄 Автообновление:** Приложение автоматически проверяет и устанавливает обновления

[📋 Все версии и changelog](https://github.com/MaRT1n1q/Equipment.Tracker/releases) • [🌍 Мультиплатформенная сборка](./MULTIPLATFORM.md)

</div>

---

## ✨ Возможности

<table>
<tr>
<td width="50%">

### 📋 Управление заявками

- ✅ Создание, редактирование и удаление заявок
- 📦 Карточки оборудования с серийными номерами
- ☑️ Отслеживание статуса выдачи
- 🔍 Быстрый поиск и фильтрация
- 📊 Учёт возвратов оборудования

</td>
<td width="50%">

### 👥 Выходы сотрудников

- 📅 Календарный вид и таблица
- 🔔 Системные уведомления (09:00, 12:00, 15:00, 18:00)
- ✅ Отслеживание завершённых выходов
- 📈 Статистика по выходам

</td>
</tr>
<tr>
<td width="50%">

### 💾 Работа с данными

- 🗄️ SQLite база данных (полностью оффлайн)
- 💿 Автоматические бэкапы
- ♻️ Восстановление из резервных копий
- 🔒 Данные не покидают устройство

</td>
<td width="50%">

### 🎨 Интерфейс

- 🌓 Тёмная и светлая тема
- 🚀 Skeleton-загрузки
- 🎯 Современный UI (shadcn/ui + Tailwind)
- 📱 Адаптивная вёрстка
- 🔥 Оптимистичные обновления

</td>
</tr>
</table>

---

## 🧱 Технологии

<div align="center">

[![Electron](https://img.shields.io/badge/Electron-39.0.0-47848F?style=for-the-badge&logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.12-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)

[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?style=for-the-badge&logo=react-query&logoColor=white)](https://tanstack.com/query)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.18-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-Latest-000000?style=for-the-badge&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)

</div>

### Основной стек:

- **🖥️ Electron 39** — десктопная оболочка с нативными возможностями ОС
- **⚛️ React 19 + Vite 7** — быстрая разработка с HMR и оптимизированная сборка
- **📘 TypeScript 5** — полная типизация main/renderer процессов
- **🗄️ SQLite + Knex** — локальная БД с миграциями и типизированными запросами
- **🔄 TanStack Query** — умное кеширование, оптимистичные обновления, синхронизация
- **🎨 Tailwind CSS + shadcn/ui** — современный UI-кит с готовыми компонентами
- **🔧 ESLint + Prettier + Husky** — контроль качества кода на pre-commit

---

## 🚀 Быстрый старт

### Для пользователей

1. **Скачайте** установщик для вашей ОС [из релизов](#-скачать)
2. **Установите** приложение (Windows/macOS) или запустите AppImage (Linux)
3. **Готово!** База данных создастся автоматически при первом запуске

### Для разработчиков

```bash
# 1️⃣ Клонирование репозитория
git clone https://github.com/MaRT1n1q/Equipment.Tracker.git
cd Equipment.Tracker

# 2️⃣ Установка зависимостей
npm install

# 3️⃣ Запуск в режиме разработки
npm run dev              # Полный Electron + Vite
# только UI (опционально)
npm run dev:renderer

# 4️⃣ Сборка для production
npm run build            # Текущая платформа
npm run build -- --win   # Принудительно Windows
npm run build -- --mac   # Принудительно macOS
npm run build -- --linux # Принудительно Linux
```

<details>
<summary>📋 <b>Все доступные команды</b></summary>

| Команда                    | Описание                             |
| -------------------------- | ------------------------------------ |
| `npm run dev`              | Запуск Electron + Vite с hot-reload  |
| `npm run dev:renderer`     | Только Vite dev-сервер (UI)          |
| `npm run electron`         | Запуск собранного приложения         |
| `npm run build`            | Production сборка для текущей ОС     |
| `npm run build -- --win`   | Сборка Windows (.exe)                |
| `npm run build -- --mac`   | Сборка macOS (.dmg/.zip)             |
| `npm run build -- --linux` | Сборка Linux (.AppImage/.deb)        |
| `npm run build:bundle`     | Сборка только бандлов (без упаковки) |
| `npm run lint`             | Проверка кода ESLint                 |
| `npm run format`           | Форматирование кода Prettier         |
| `npm run format:check`     | Проверка форматирования              |

</details>

> **⚠️ Примечание:** Для сборки macOS требуется macOS-хост или GitHub Actions с macOS runner

---

## 🧭 Архитектура проекта

```
equipment-tracker/
├─ 📂 electron/              # Main-процесс Electron
│  ├─ main.ts               # Точка входа, создание окон
│  ├─ window.ts             # Управление окнами
│  ├─ tray.ts               # Системный трей
│  ├─ updater.ts            # Автообновление
│  ├─ database.ts           # SQLite соединение
│  ├─ migrations.ts         # Миграции БД
│  ├─ notifications.ts      # Системные уведомления
│  └─ ipc/                  # IPC handlers
│     ├─ requests.ts        # Обработка заявок
│     ├─ employeeExits.ts   # Обработка выходов
│     └─ backup.ts          # Бэкапы
│
├─ 📂 src/                   # React-приложение (renderer)
│  ├─ components/           # React компоненты
│  │  ├─ Dashboard.tsx
│  │  ├─ RequestsView.tsx
│  │  ├─ EmployeeExitView.tsx
│  │  └─ ui/               # shadcn/ui компоненты
│  ├─ hooks/               # Custom React hooks
│  │  ├─ useRequests.ts
│  │  ├─ useEmployeeExits.ts
│  │  └─ useDebounce.ts
│  ├─ types/               # TypeScript типы
│  ├─ lib/                 # Утилиты
│  ├─ App.tsx              # Главный компонент
│  └─ main.tsx             # Точка входа React
│
├─ 📂 build/                 # Ресурсы для сборки
│  ├─ icon.ico             # Иконка Windows
│  ├─ icon.icns            # Иконка macOS
│  └─ icon.png             # Иконка Linux
│
├─ 📂 .github/workflows/     # CI/CD
│  └─ release.yml          # Автоматическая сборка релизов
│
├─ 📂 dist/                  # Production React bundle
├─ 📂 dist-electron/         # Production Electron bundle
└─ 📂 release/               # Готовые установщики
```

---

## � Документация

| Документ                                  | Описание                           |
| ----------------------------------------- | ---------------------------------- |
| [🌍 MULTIPLATFORM.md](./MULTIPLATFORM.md) | Мультиплатформенная сборка и CI/CD |
| [🔄 AUTO_UPDATE.md](./AUTO_UPDATE.md)     | Система автоматических обновлений  |
| [📖 USAGE.md](./USAGE.md)                 | Руководство пользователя           |
| [🔒 SECURITY.md](./SECURITY.md)           | Политика безопасности              |

---

## 🗄️ База данных

- **Расположение**: Автоматически создаётся в системной папке пользователя
  - Windows: `%APPDATA%\equipment-tracker\`
  - macOS: `~/Library/Application Support/equipment-tracker/`
  - Linux: `~/.config/equipment-tracker/`

- **Миграции**: Автоматически применяются при каждом запуске
- **Бэкапы**: Создаются в подпапке `backups/` той же директории

### Основные таблицы:

| Таблица           | Описание                           |
| ----------------- | ---------------------------------- |
| `requests`        | Заявки на выдачу оборудования      |
| `equipment_items` | Позиции оборудования внутри заявок |
| `employee_exits`  | Записи о выходах сотрудников       |

---

## 🔌 IPC Коммуникация

Связь между renderer и main процессами через типизированные IPC-каналы:

```typescript
// Пример использования в React
const { data: requests } = useQuery({
  queryKey: ['requests'],
  queryFn: () => window.electronAPI.getRequests(),
})
```

### Доступные API:

<details>
<summary>📋 <b>Requests API</b></summary>

- `getRequests()` - Получить все заявки
- `createRequest(data)` - Создать заявку
- `updateRequest(id, data)` - Обновить заявку
- `deleteRequest(id)` - Удалить заявку
- `updateRequestIssued(id, issued)` - Обновить статус выдачи

</details>

<details>
<summary>👥 <b>Employee Exits API</b></summary>

- `getEmployeeExits()` - Получить все выходы
- `createEmployeeExit(data)` - Создать выход
- `updateEmployeeExit(id, data)` - Обновить выход
- `deleteEmployeeExit(id)` - Удалить выход
- `updateExitCompleted(id, completed)` - Обновить статус завершения

</details>

<details>
<summary>💾 <b>Backup API</b></summary>

- `createBackup()` - Создать резервную копию
- `restoreBackup(filePath)` - Восстановить из копии
- `getBackupPath()` - Получить путь к папке бэкапов

</details>

---

## 🧪 Качество кода и CI/CD

### Локальная разработка

```bash
npm run lint              # ESLint проверка
npm run format           # Prettier форматирование
npm run format:check     # Проверка форматирования
```

### Pre-commit хуки

Автоматически запускаются через Husky + lint-staged:

- ✅ ESLint с автофиксом
- ✅ Prettier проверка
- ✅ Применяется только к staged файлам

### CI/CD инфраструктура

#### GitHub Actions

- **🔄 CI**: Автоматическая проверка линтинга и сборки на каждый push
- **🚀 Release**: Автоматическая мультиплатформенная сборка при создании тега
  - Параллельная сборка для Windows, macOS, Linux
  - Автоматическая публикация в GitHub Releases
  - Красивое описание релиза с кликабельными кнопками скачивания

#### GitLab CI/CD

- **🧪 Линт и сборка:** jobs `lint` и `build_web` запускаются для всех веток и Merge Request'ов
- **📦 Release pipeline:** при пуше тега `v*.*.*` автоматически собираются артефакты для Windows, Linux и (опционально) macOS
- **📁 Артефакты:** публикуются в GitLab Release с прямыми ссылками на `AppImage`, `DEB`, `.exe`, `.dmg`, `.zip`
- **🏷️ Требования:** для `build_macos_artifacts` нужен self-hosted runner с тегом `macos`; при отсутствии runner'а release создаётся без macOS билдов
- Подробнее в `.gitlab-ci.yml`

---

## �️ Советы по разработке

<details>
<summary>🔍 <b>Отладка</b></summary>

- **DevTools**: Открываются автоматически в dev-режиме
- **Main процесс**: Логи в консоли терминала
- **Renderer процесс**: DevTools в окне Electron
- **База данных**: Используйте SQLite Browser для просмотра

</details>

<details>
<summary>⚡ <b>Hot Reload</b></summary>

- **Renderer**: Автоматический при изменении `src/`
- **Main**: Требует перезапуска `npm run dev` при изменении `electron/`
- **Preload**: Требует полной перезагрузки окна (Ctrl+R)

</details>

<details>
<summary>🎨 <b>Tailwind IntelliSense</b></summary>

Установите расширение VS Code для автодополнения классов:

```
Name: Tailwind CSS IntelliSense
Id: bradlc.vscode-tailwindcss
```

</details>

<details>
<summary>🔔 <b>Системные уведомления</b></summary>

- Работают только в упакованном приложении (production)
- В dev-режиме используйте `npm run electron` после сборки
- Проверьте настройки уведомлений в ОС

</details>

---

## 🤝 Contributing

Мы приветствуем вклад в проект!

### Как внести вклад:

1. **Fork** репозитория
2. Создайте **ветку** для фичи: `git checkout -b feature/amazing-feature`
3. **Commit** изменений: `git commit -m 'feat: add amazing feature'`
4. **Push** в ветку: `git push origin feature/amazing-feature`
5. Откройте **Pull Request**

### Требования:

- ✅ Код проходит `npm run lint`
- ✅ Код проходит `npm run format:check`
- ✅ Проект собирается без ошибок
- ✅ Добавлены комментарии для сложной логики
- ✅ Обновлена документация при необходимости

---

## 📊 Статистика проекта

![GitHub repo size](https://img.shields.io/github/repo-size/MaRT1n1q/Equipment.Tracker?style=flat-square)
![GitHub code size](https://img.shields.io/github/languages/code-size/MaRT1n1q/Equipment.Tracker?style=flat-square)
![GitHub language count](https://img.shields.io/github/languages/count/MaRT1n1q/Equipment.Tracker?style=flat-square)
![GitHub top language](https://img.shields.io/github/languages/top/MaRT1n1q/Equipment.Tracker?style=flat-square)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/MaRT1n1q/Equipment.Tracker?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/MaRT1n1q/Equipment.Tracker?style=flat-square)

---

## 📜 Лицензия

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**MIT License** — свободное использование в коммерческих и некоммерческих проектах

</div>

---

<div align="center">

### 🌟 Если проект оказался полезным, поставьте звезду!

[![GitHub stars](https://img.shields.io/github/stars/MaRT1n1q/Equipment.Tracker?style=social)](https://github.com/MaRT1n1q/Equipment.Tracker/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/MaRT1n1q/Equipment.Tracker?style=social)](https://github.com/MaRT1n1q/Equipment.Tracker/network/members)
[![GitHub watchers](https://img.shields.io/github/watchers/MaRT1n1q/Equipment.Tracker?style=social)](https://github.com/MaRT1n1q/Equipment.Tracker/watchers)

**Made with ❤️ by [MaRT1n1q](https://github.com/MaRT1n1q)**

[🏠 На главную](https://github.com/MaRT1n1q/Equipment.Tracker) • [📥 Скачать](#-скачать) • [🐛 Сообщить об ошибке](https://github.com/MaRT1n1q/Equipment.Tracker/issues) • [💡 Предложить идею](https://github.com/MaRT1n1q/Equipment.Tracker/issues/new)

</div>
