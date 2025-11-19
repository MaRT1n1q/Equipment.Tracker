# 🗄️ Документация базы данных

## Обзор

Equipment Tracker использует **SQLite 3** в качестве локальной базы данных. Взаимодействие с БД происходит через **Knex.js** query builder.

## Расположение базы данных

База данных автоматически создаётся при первом запуске приложения:

- **Windows**: `%APPDATA%\equipment-tracker\equipment.db`
- **macOS**: `~/Library/Application Support/equipment-tracker/equipment.db`
- **Linux**: `~/.config/equipment-tracker/equipment.db`

## Схема базы данных

### Таблица: `requests`

Хранит информацию о заявках на выдачу оборудования.

| Колонка          | Тип        | Описание                              | Constraints              |
|------------------|------------|---------------------------------------|--------------------------|
| `id`             | INTEGER    | Уникальный идентификатор              | PRIMARY KEY, AUTOINCREMENT |
| `employee_name`  | TEXT       | ФИО сотрудника                        | NOT NULL                 |
| `login`          | TEXT       | Логин сотрудника                      | NOT NULL                 |
| `sd_number`      | TEXT       | Номер заявки в Service Desk           | NOT NULL                 |
| `created_at`     | TEXT       | Дата создания (ISO 8601)              | NOT NULL                 |
| `is_issued`      | INTEGER    | Выдано ли оборудование (0/1)          | NOT NULL, DEFAULT 0      |
| `return_required`| INTEGER    | Требуется ли возврат (0/1)            | NOT NULL, DEFAULT 0      |
| `return_completed`| INTEGER   | Возврат завершён (0/1)                | NOT NULL, DEFAULT 0      |
| `return_date`    | TEXT       | Дата возврата (ISO 8601)              | NULL                     |

**Индексы:**
- `idx_requests_created_at` на `created_at` (DESC)
- `idx_requests_employee_name` на `employee_name`
- `idx_requests_is_issued` на `is_issued`

**Пример данных:**
```json
{
  "id": 1,
  "employee_name": "Иванов Иван Иванович",
  "login": "i.ivanov",
  "sd_number": "INC0001234",
  "created_at": "2024-01-15T10:30:00.000Z",
  "is_issued": 1,
  "return_required": 1,
  "return_completed": 0,
  "return_date": "2024-02-15T00:00:00.000Z"
}
```

### Таблица: `equipment_items`

Хранит список единиц оборудования, привязанных к заявкам.

| Колонка         | Тип        | Описание                              | Constraints              |
|-----------------|------------|---------------------------------------|--------------------------|
| `id`            | INTEGER    | Уникальный идентификатор              | PRIMARY KEY, AUTOINCREMENT |
| `request_id`    | INTEGER    | ID заявки                             | NOT NULL, FOREIGN KEY    |
| `equipment_name`| TEXT       | Название оборудования                 | NOT NULL                 |
| `serial_number` | TEXT       | Серийный номер                        | NOT NULL                 |

**Связи:**
- `FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE`

**Индексы:**
- `idx_equipment_items_request_id` на `request_id`

**Пример данных:**
```json
[
  {
    "id": 1,
    "request_id": 1,
    "equipment_name": "Ноутбук Dell Latitude 5520",
    "serial_number": "ABC123456"
  },
  {
    "id": 2,
    "request_id": 1,
    "equipment_name": "Мышь Logitech M185",
    "serial_number": "XYZ789012"
  }
]
```

### Таблица: `employee_exits`

Хранит информацию о выходах сотрудников с оборудованием.

| Колонка         | Тип        | Описание                              | Constraints              |
|-----------------|------------|---------------------------------------|--------------------------|
| `id`            | INTEGER    | Уникальный идентификатор              | PRIMARY KEY, AUTOINCREMENT |
| `employee_name` | TEXT       | ФИО сотрудника                        | NOT NULL                 |
| `exit_date`     | TEXT       | Дата выхода (YYYY-MM-DD)              | NOT NULL                 |
| `equipment_list`| TEXT       | Список оборудования (JSON или текст)  | NOT NULL                 |
| `is_completed`  | INTEGER    | Выход завершён (0/1)                  | NOT NULL, DEFAULT 0      |
| `created_at`    | TEXT       | Дата создания записи (ISO 8601)       | NOT NULL                 |

**Индексы:**
- `idx_employee_exits_exit_date` на `exit_date` (DESC)
- `idx_employee_exits_is_completed` на `is_completed`
- `idx_employee_exits_employee_name` на `employee_name`

**Форматы `equipment_list`:**

1. **JSON формат** (новый):
```json
[
  { "name": "Ноутбук", "serial": "SN12345" },
  { "name": "Мышь", "serial": "SN67890" }
]
```

2. **Текстовый формат** (legacy):
```
Ноутбук - SN12345
Мышь - SN67890
```

3. **Только названия** (старые записи):
```
Ноутбук
Мышь
```

**Пример данных:**
```json
{
  "id": 1,
  "employee_name": "Петров Петр Петрович",
  "exit_date": "2024-02-20",
  "equipment_list": "[{\"name\":\"Ноутбук\",\"serial\":\"SN123\"}]",
  "is_completed": 0,
  "created_at": "2024-02-18T14:20:00.000Z"
}
```

### Таблица: `templates`

Хранит шаблоны для быстрого создания заявок.

| Колонка         | Тип        | Описание                              | Constraints              |
|-----------------|------------|---------------------------------------|--------------------------|
| `id`            | INTEGER    | Уникальный идентификатор              | PRIMARY KEY, AUTOINCREMENT |
| `name`          | TEXT       | Название шаблона                      | NOT NULL                 |
| `equipment_items`| TEXT      | Список оборудования (JSON)            | NOT NULL                 |
| `created_at`    | TEXT       | Дата создания (ISO 8601)              | NOT NULL                 |

**Формат `equipment_items`:**
```json
[
  { "equipment_name": "Ноутбук Dell", "serial_number": "" },
  { "equipment_name": "Мышь", "serial_number": "" }
]
```

**Пример данных:**
```json
{
  "id": 1,
  "name": "Стандартный набор разработчика",
  "equipment_items": "[{\"equipment_name\":\"Ноутбук\",\"serial_number\":\"\"},{\"equipment_name\":\"Мышь\",\"serial_number\":\"\"}]",
  "created_at": "2024-01-10T09:00:00.000Z"
}
```

## Связи между таблицами

```
┌──────────────┐
│   requests   │
│              │
│ id (PK)      │◄──┐
│ employee_name│   │
│ login        │   │
│ sd_number    │   │
│ ...          │   │
└──────────────┘   │
                   │ 1:N
                   │
          ┌────────┴─────────┐
          │ equipment_items  │
          │                  │
          │ id (PK)          │
          │ request_id (FK)  │
          │ equipment_name   │
          │ serial_number    │
          └──────────────────┘

┌──────────────────┐      ┌──────────────┐
│ employee_exits   │      │  templates   │
│                  │      │              │
│ id (PK)          │      │ id (PK)      │
│ employee_name    │      │ name         │
│ exit_date        │      │ equipment_   │
│ equipment_list   │      │   _items     │
│ ...              │      │ ...          │
└──────────────────┘      └──────────────┘
  (независимая)             (независимая)
```

## Миграции

### Текущие миграции

#### 1. migrateLegacyRequests
Конвертирует устаревший формат `equipment` (текстовое поле) в связанную таблицу `equipment_items`.

**Что делает:**
1. Проверяет наличие старой колонки `equipment`
2. Парсит текстовые записи вида "Название - Серийник"
3. Создаёт записи в `equipment_items`
4. Удаляет старую колонку

**Формат старых данных:**
```
Ноутбук Dell - SN123456
Мышь Logitech - SN789012
```

### Создание новой миграции

```typescript
// electron/migrations.ts

export async function migrateMyFeature(knex: Knex): Promise<void> {
  // Проверка необходимости миграции
  const hasColumn = await knex.schema.hasColumn('table', 'new_column')
  
  if (!hasColumn) {
    console.log('Applying migration: MyFeature')
    
    // Применение изменений
    await knex.schema.alterTable('table', (table) => {
      table.string('new_column').defaultTo('default_value')
    })
    
    console.log('Migration MyFeature completed')
  }
}

// Добавить вызов в runMigrations()
export async function runMigrations(knex: Knex): Promise<void> {
  await migrateLegacyRequests(knex)
  await migrateMyFeature(knex) // Новая миграция
}
```

### Правила миграций

1. **Идемпотентность** — миграция может запускаться многократно без ошибок
2. **Обратная совместимость** — не удалять данные без резервного копирования
3. **Валидация** — проверять формат старых данных перед преобразованием
4. **Логирование** — выводить прогресс миграции в консоль
5. **Транзакции** — использовать для атомарности изменений

## Запросы и примеры

### Получение всех заявок с оборудованием

```typescript
const requests = await db('requests')
  .select('*')
  .orderBy('created_at', 'desc')

for (const request of requests) {
  request.equipment_items = await db('equipment_items')
    .where('request_id', request.id)
    .select('*')
}
```

### Создание заявки с оборудованием

```typescript
await db.transaction(async (trx) => {
  // Создание заявки
  const [requestId] = await trx('requests').insert({
    employee_name: 'Иванов И.И.',
    login: 'i.ivanov',
    sd_number: 'INC123',
    created_at: new Date().toISOString(),
    is_issued: 0,
    return_required: 0,
    return_completed: 0
  })
  
  // Добавление оборудования
  await trx('equipment_items').insert([
    {
      request_id: requestId,
      equipment_name: 'Ноутбук',
      serial_number: 'SN123'
    },
    {
      request_id: requestId,
      equipment_name: 'Мышь',
      serial_number: 'SN456'
    }
  ])
})
```

### Поиск по сотруднику

```typescript
const results = await db('requests')
  .where('employee_name', 'like', '%Иванов%')
  .orWhere('login', 'like', '%ivanov%')
  .select('*')
```

### Статистика выходов

```typescript
const stats = await db('employee_exits')
  .select(
    db.raw('COUNT(*) as total'),
    db.raw('SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed'),
    db.raw('SUM(CASE WHEN is_completed = 0 THEN 1 ELSE 0 END) as pending')
  )
  .first()
```

### Предстоящие выходы (для уведомлений)

```typescript
const today = new Date().toISOString().split('T')[0]
const tomorrow = new Date(Date.now() + 86400000)
  .toISOString()
  .split('T')[0]

const upcoming = await db('employee_exits')
  .whereBetween('exit_date', [today, tomorrow])
  .where('is_completed', 0)
  .select('*')
```

## Резервное копирование

### Автоматическое резервное копирование

Создаётся при завершении приложения (в `app.on('before-quit')`):

```typescript
await createAutomaticBackup()
```

Файлы сохраняются в:
- `%APPDATA%\equipment-tracker\backups\backup-{timestamp}.db`

Хранятся последние 5 копий.

### Ручное резервное копирование

Через Settings Modal или IPC:

```typescript
const response = await window.electronAPI.createBackup()
// Открывает диалог сохранения файла
```

### Восстановление из резервной копии

```typescript
const response = await window.electronAPI.restoreBackup(filePath)
// Создаёт emergency backup перед восстановлением
// После успеха требуется перезагрузка приложения
```

### Emergency Backup

При восстановлении из резервной копии, текущая БД сохраняется как:
- `equipment.db.emergency`

Можно удалить после проверки, что всё работает.

## Оптимизация производительности

### Индексы

Созданные индексы ускоряют частые запросы:

```sql
CREATE INDEX idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX idx_requests_employee_name ON requests(employee_name);
CREATE INDEX idx_requests_is_issued ON requests(is_issued);
CREATE INDEX idx_equipment_items_request_id ON equipment_items(request_id);
CREATE INDEX idx_employee_exits_exit_date ON employee_exits(exit_date DESC);
CREATE INDEX idx_employee_exits_is_completed ON employee_exits(is_completed);
```

### PRAGMA настройки

```typescript
// Включены в database.ts
await db.raw('PRAGMA foreign_keys = ON') // Проверка FK
await db.raw('PRAGMA journal_mode = WAL') // Write-Ahead Log
await db.raw('PRAGMA synchronous = NORMAL') // Баланс скорости/надёжности
```

### Рекомендации

1. **Используйте индексы** для полей в WHERE, ORDER BY
2. **Ограничивайте SELECT** — не используйте `SELECT *` без необходимости
3. **Пагинация** — используйте LIMIT/OFFSET для больших наборов
4. **Транзакции** — группируйте связанные операции
5. **VACUUM** — периодически для оптимизации размера БД

## Работа с датами

### Форматы

- **created_at**: ISO 8601 полный (`2024-01-15T10:30:00.000Z`)
- **exit_date**: ISO 8601 дата (`2024-02-20`)
- **return_date**: ISO 8601 полный или NULL

### Примеры

```typescript
// Текущая дата и время
const now = new Date().toISOString()

// Только дата
const date = new Date().toISOString().split('T')[0]

// Парсинг даты
const dateObj = new Date('2024-01-15T10:30:00.000Z')

// Сравнение дат в SQL
const results = await db('employee_exits')
  .where('exit_date', '>=', '2024-01-01')
  .where('exit_date', '<=', '2024-12-31')
```

## Целостность данных

### Foreign Keys

```sql
FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
```

При удалении заявки, все связанные `equipment_items` удаляются автоматически.

### NOT NULL constraints

Обязательные поля:
- `employee_name`
- `login`
- `sd_number`
- `created_at`
- `equipment_name`
- `serial_number`
- `exit_date`
- `equipment_list`

### Валидация

Дополнительная валидация происходит на уровне приложения через Zod схемы.

## Troubleshooting

### База данных заблокирована

**Ошибка:** `SQLITE_BUSY: database is locked`

**Решение:**
1. Закройте все экземпляры приложения
2. Удалите lock файлы:
   - `equipment.db-shm`
   - `equipment.db-wal`

### База данных повреждена

**Симптомы:**
- Ошибки при чтении данных
- Приложение не запускается

**Решение:**
1. Восстановите из последней резервной копии
2. Или используйте emergency backup

```bash
# Копируйте emergency backup обратно
copy equipment.db.emergency equipment.db
```

### Данные не сохраняются

**Проверьте:**
1. Права доступа к директории БД
2. Доступное место на диске
3. Логи приложения на наличие ошибок

## Миграция с предыдущих версий

Если вы обновляете с очень старой версии:

1. **Создайте резервную копию** перед обновлением
2. **Запустите новую версию** — миграции применятся автоматически
3. **Проверьте данные** — убедитесь, что всё на месте
4. **Сохраните emergency backup** — на всякий случай

## Инструменты

### DB Browser for SQLite

Рекомендуемый инструмент для просмотра и редактирования БД:
- [Скачать](https://sqlitebrowser.org/)
- Открыть: `%APPDATA%\equipment-tracker\equipment.db`

### Командная строка

```bash
# Открыть БД
sqlite3 equipment.db

# Показать таблицы
.tables

# Показать схему
.schema requests

# Выполнить запрос
SELECT * FROM requests LIMIT 5;

# Выйти
.quit
```

## Дополнительная информация

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Knex.js Documentation](https://knexjs.org/)
- [SQL Tutorial](https://www.w3schools.com/sql/)
