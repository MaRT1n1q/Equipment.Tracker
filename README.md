# Equipment Tracker

Настольное приложение для учета заявок на выдачу оборудования.

## Технологии

- **Electron** - настольное приложение
- **React 18** - UI библиотека
- **Vite** - сборщик
- **TypeScript** - типизация
- **SQLite** (better-sqlite3) - локальная база данных
- **Tailwind CSS** - стилизация
- **shadcn/ui** - UI компоненты
- **Sonner** - уведомления
- **Lucide React** - иконки

## Функционал

✅ Создание заявок с автоматическим номером  
✅ Хранение данных: ФИО, название оборудования, серийный номер, дата  
✅ Таблица со всеми заявками  
✅ Отметка о выдаче оборудования (checkbox)  
✅ Удаление заявок  
✅ Светлая и тёмная тема  
✅ Toast-уведомления  
✅ Полностью оффлайн (без интернета)  

## Установка зависимостей

```bash
npm install
```

## Запуск в режиме разработки

```bash
npm run electron:dev
```

Это запустит Vite dev сервер и откроет приложение Electron.

## Сборка приложения

```bash
npm run build
```

Готовое приложение будет в папке `release/`.

## Структура проекта

```
equipment-tracker/
├── electron/          # Electron main и preload процессы
│   ├── main.ts       # Главный процесс Electron
│   └── preload.ts    # Preload скрипт для IPC
├── src/              # React приложение
│   ├── components/   # React компоненты
│   ├── lib/          # Утилиты
│   ├── types/        # TypeScript типы
│   ├── App.tsx       # Главный компонент
│   ├── main.tsx      # Точка входа React
│   └── index.css     # Глобальные стили
├── index.html        # HTML шаблон
├── package.json      # Зависимости
├── vite.config.ts    # Конфигурация Vite
└── tailwind.config.js # Конфигурация Tailwind
```

## База данных

SQLite база данных автоматически создается при первом запуске в папке данных приложения:

- Windows: `%APPDATA%/equipment-tracker/equipment.db`
- macOS: `~/Library/Application Support/equipment-tracker/equipment.db`
- Linux: `~/.config/equipment-tracker/equipment.db`

Схема таблицы `requests`:

```sql
CREATE TABLE requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_name TEXT NOT NULL,
  equipment_name TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  created_at TEXT NOT NULL,
  is_issued INTEGER DEFAULT 0
)
```

## Горячие клавиши

- `Esc` - закрыть модальное окно
- Переключение темы - кнопка в правом верхнем углу

## Разработка

Приложение использует IPC (Inter-Process Communication) для связи между React UI (renderer process) и Electron main process:

- `get-requests` - получить все заявки
- `create-request` - создать новую заявку
- `update-issued` - обновить статус выдачи
- `delete-request` - удалить заявку

## Лицензия

MIT
