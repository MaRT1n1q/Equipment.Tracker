# Stage 1 — Target Architecture и границы ответственности

Дата: 2026-02-25  
Статус: ✅ Зафиксировано

## 1) Baseline (что есть сейчас)

- UI слой (`src/*`) в основном работает через `window.electronAPI`.
- Для web-режима подключается shim `src/lib/webElectronApi.ts`, который хранит данные в `localStorage` (`equipment-tracker:web-db:v1`).
- Desktop main-process (`electron/ipc/*`) содержит доменную логику CRUD для:
  - заявок и оборудования;
  - выходов сотрудников;
  - шаблонов и файлов шаблонов;
  - инструкций и вложений.
- Backend сейчас покрывает auth/user и не является источником данных для доменных модулей Equipment Tracker.

## 2) Целевая модель ответственности

## Backend (источник истины)

Backend хранит и валидирует доменные данные, выполняет бизнес-правила и авторизацию:

- `requests` + `equipment_items`
- `employee_exits`
- `templates` + `template_files`
- `instructions` + `instruction_attachments`
- `auth` + `users` + `rbac`

## Frontend (web + desktop renderer)

- Только UI/UX + orchestration через React Query.
- Единый API client для web и desktop.
- Никакой доменной persistence-логики на клиенте.

## Electron Main Process (после миграции)

Остаются только OS-level функции:

- window controls: `getWindowState`, `minimizeWindow`, `toggleMaximizeWindow`, `closeWindow`, `onWindowStateChanged`
- app/runtime: `getAppVersion`
- updater: `checkForUpdates`, `downloadUpdate`, `installUpdate`, `onUpdateStatus`
- shell integration: `openExternal`
- file dialogs / local OS helpers (минимально необходимые)

## 3) Матрица IPC каналов: оставить vs мигрировать

### Остаются в IPC (OS-level)

- App/Window: `get-app-version`, `get-window-state`, `window-minimize`, `window-toggle-maximize`, `window-close`, `window-state-changed`
- Updates: `check-for-updates`, `download-update`, `install-update`, `update-status`
- External integration: `open-external`
- Локальные file-dialog helpers (временные), если нужны для upload/select/open на desktop

### Мигрируются в backend API (domain-level)

- Requests:
  - `get-requests`, `get-requests-summary`
  - `create-request`, `update-request`, `delete-request`, `restore-request`
  - `update-issued`, `schedule-request-return`, `complete-request-return`, `cancel-request-return`
  - `update-equipment-status`
- Employee exits:
  - `get-employee-exits`, `get-employee-exits-summary`
  - `create-employee-exit`, `update-employee-exit`, `delete-employee-exit`, `restore-employee-exit`
  - `update-exit-completed`, `update-exit-equipment-status`, `export-employee-exits`
- Templates + files:
  - `get-templates`, `create-template`, `update-template`, `delete-template`, `reorder-templates`
  - `get-template-files`, `upload-template-files-*`, `download-template-file`, `open-template-file`, `delete-template-file`, `get-template-file-preview`, `get-template-file-counts`
- Instructions + attachments:
  - `get-instructions`, `get-instruction`, `create-instruction`, `update-instruction`, `move-instruction`, `reorder-instructions`, `delete-instruction`, `duplicate-instruction`, `toggle-instruction-favorite`, `update-instruction-tags`, `get-all-instruction-tags`
  - `get-instruction-attachments`, `add-instruction-attachment`, `delete-instruction-attachment`, `get-instruction-attachment-preview`, `open-instruction-attachment`, `select-instruction-attachment-file`

## 4) Web bridge policy

`src/lib/webElectronApi.ts` — только временный compatibility слой на период миграции.

Правило:

- новые фичи не добавляются в `webElectronApi`;
- все новые данные и бизнес-операции делаются только через backend API;
- после переключения всех доменных hooks на API-client слой `webElectronApi` удаляется.

## 5) Environment strategy (local / staging / prod)

## Local

- Backend запускается локально (`backend/.env`, `docker compose up` для Postgres/Redis).
- Frontend web/desktop работает против локального backend API.
- Временный fallback web-shim допускается только для dev, но не как production путь.

## Staging

- Отдельная БД/Redis.
- Тестовые учётные записи и тестовые данные.
- Проверка миграций, совместимости клиентов и импортера данных.

## Production

- Отдельные секреты JWT и инфраструктура.
- Централизованный backup/restore на стороне серверной БД.
- Наблюдаемость: метрики + алерты + структурированные логи.

## 6) Definition of Done для Stage 1

Stage 1 считается завершённым, когда:

- зафиксированы границы ответственности backend/frontend/electron main;
- утверждён список IPC каналов на deprecation и список остающихся OS-level каналов;
- утверждена стратегия окружений local/staging/prod;
- в roadmap есть запрет на развитие `webElectronApi` как data layer.

## 7) Что делаем следующим шагом (Stage 2)

- Зафиксировать `v1` API-контракты для доменных модулей:
  - requests + equipment_items
  - employee_exits
  - templates + template_files
  - instructions + attachments
- Зафиксировать единый формат ошибок, пагинации и фильтрации.
