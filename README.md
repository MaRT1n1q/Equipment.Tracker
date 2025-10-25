# Equipment Tracker

Desktop application that tracks equipment requests and employee exits in a
single, offline-first workspace. Built with Electron, React, Vite, TypeScript,
and SQLite for fast iteration and native-feeling UX on Windows, macOS, and
Linux.

## ✨ Возможности

- Создание, редактирование и удаление заявок на выдачу оборудования.
- Отдельные карточки оборудования внутри заявки (название, серийный номер,
  количество).
- Учёт возвратов и статистики по выходам сотрудников.
- Чекбоксы «Выдано / Завершено» с моментальной синхронизацией через React
  Query.
- Темная/светлая тема, удобный сайдбар, быстрый поиск и фильтры.
- Toast-уведомления, skeleton-загрузки, современный UI на shadcn/ui и Tailwind
  CSS.
- Полноценный оффлайн-режим: база хранится локально, данные не покидают
  устройство.
- Автоматический бэкап/restore БД по требованию пользователя.

## 🧱 Технологии

- **Electron 33** — оболочка настольного приложения.
- **React 18 + Vite 5** — фронтенд, сборка и HMR.
- **TypeScript 5** — строгая типизация, общие типы между main и renderer.
- **SQLite (better-sqlite3)** — встраиваемая база с миграциями и индексацией.
- **TanStack Query** — кэширование запросов, синхронизация и оптимистичные
  апдейты.
- **Tailwind CSS + shadcn/ui + Sonner + Lucide** — визуальный слой.
- **ESLint / Prettier / Husky / lint-staged** — качество кода и pre-commit
  проверки.

## 🚀 Быстрый старт

```bash
# 1. Установка зависимостей
npm install

# 2. Запуск Electron + Vite dev-серверов
npm run electron:dev

# 3. Альтернативно: только фронтенд (без Electron-окна)
npm run dev

# 4. Сборка production-бандла и electron-builder
npm run build

# 5. Запуск собранного приложения
npm run electron
```

> Команда `npm run build` создаёт renderer-бандл, компилирует TypeScript и
> запускает `electron-builder`, складывая артефакты в `release/`.

## 🧭 Структура проекта

```
equipment-tracker/
├─ electron/                # Main-процесс, окна, IPC-слой, миграции БД
│  ├─ database.ts
│  ├─ migrations.ts
│  ├─ preload.ts
│  └─ ipc/
├─ src/                     # React-приложение (renderer)
│  ├─ components/
│  │  ├─ AddRequestModal.tsx
│  │  ├─ EmployeeExitView.tsx
│  │  └─ ui/...
│  ├─ hooks/                # useRequests, useEmployeeExits и пр.
│  ├─ lib/
│  ├─ types/
│  ├─ App.tsx
│  └─ main.tsx
├─ docs/                    # Документация и планы развития
├─ dist/, dist-electron/    # Прод билд (vite, electron)
├─ release/                 # Артефакты electron-builder
├─ package.json             # Скрипты и зависимости
└─ tsconfig*.json           # Конфигурация TypeScript
```

## 🗄️ База данных и миграции

- SQLite-файл создаётся автоматически в userData каталоге системы (AppData на
  Windows, `~/Library/Application Support` на macOS, `~/.config` на Linux).
- Служебные миграции описаны в `electron/migrations.ts` и нумеруются через
  `user_version`. Первый запуск обновляет старые схемы до актуальной структуры с
  отдельной таблицей `equipment_items`.
- Основные таблицы:
  - `requests` — заявки сотрудников.
  - `equipment_items` — конкретные позиции оборудования внутри заявки.
  - `employee_exits` — записи о выходах сотрудников.

> Дополнительные индексы и `PRAGMA foreign_keys` включаются автоматически при
> инициализации `database.ts`.

## 🔌 IPC и слой данных

Коммуникация между renderer и main-процессом идёт через IPC-каналы, типизированные
`zod`-схемами и описанные в `src/types/ipc.ts`.

Основные хендлеры (см. `electron/ipc/*.ts`):

- Requests: `get-requests`, `create-request`, `update-request`, `update-issued`,
  `delete-request`, `restore-request`.
- Employee exits: `get-employee-exits`, `create-employee-exit`,
  `update-employee-exit`, `update-exit-completed`, `delete-employee-exit`.
- Backups: `create-backup`, `restore-backup`.

React Query-хуки (`src/hooks/useRequests.ts`, `useEmployeeExits.ts`)
инкапсулируют вызовы IPC и кеширование.

## 🧪 Качество кода

- `npm run lint` — ESLint по всем `ts/tsx` файлам.
- `npm run format` / `npm run format:check` — Prettier с единым конфигом.
- Husky pre-commit хук запускает lint-staged (eslint + prettier по staged
  файлам).
- GitHub Actions (`.github/workflows/ci.yml`) проверяет lint и
  `npm run build:ci` (tsc --noEmit + vite build).

## 🔄 Скрипты npm

| Скрипт                 | Назначение                                               |
| ---------------------- | -------------------------------------------------------- |
| `npm run dev`          | Vite dev-сервер (renderer)                               |
| `npm run electron:dev` | Vite dev-сервер + Electron с авто-перезапуском           |
| `npm run electron`     | Запуск production Electron из `dist-electron`            |
| `npm run build`        | `tsc && vite build && electron-builder`                  |
| `npm run build:ci`     | Облегчённая сборка для CI (`tsc --noEmit && vite build`) |
| `npm run lint`         | ESLint с жёстким порогом (max-warnings = 0)              |
| `npm run format`       | Prettier с `--write`                                     |
| `npm run format:check` | Prettier с `--check`                                     |

## 💾 Резервные копии

- Бэкап — `create-backup` кладёт `.db` копию в `%USER_DATA%/backups`.
- Восстановление — `restore-backup` подменяет текущую БД выбранным файлом (UI
  диалог в разделе «Настройки»).
- Путь к директории бэкапов можно увидеть в UI.

## 🛠️ Отладка и советы

- **DevTools**: в dev-режиме Electron открывает инструменты в отдельном окне.
- **Перезапуск main-процесса**: изменения в `electron/` требуют перезапуска
  команды `npm run electron:dev`.
- **Блокировки SQLite**: при параллельных чтениях/записях база синхронная,
  поэтому избегайте долгих операций в main-процессе.
- **Tailwind IntelliSense**: расширения VS Code помогают при верстке.

## 🤝 Contributing

1. Сделайте форк и ветку от `main`.
2. Убедитесь, что проходят `npm run lint` и `npm run build:ci`.
3. Откройте PR с описанием изменений. Автолинтеры запустятся в CI.
4. При необходимости обновите `docs/improvement-plan.md` и README.

## 📜 Лицензия

[MIT](LICENSE) — используйте свободно, в том числе в коммерческих проектах.
