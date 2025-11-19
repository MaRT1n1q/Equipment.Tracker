# 💻 Руководство разработчика

## Начало работы

### Требования

- **Node.js** 18+ (рекомендуется LTS версия)
- **npm** 9+
- **Git** для клонирования репозитория
- **VS Code** (рекомендуется) с расширениями:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

### Установка

```bash
# 1. Клонирование репозитория
git clone https://github.com/MaRT1n1q/Equipment.Tracker.git
cd Equipment.Tracker

# 2. Установка зависимостей
npm install

# 3. Запуск в режиме разработки
npm run dev
```

## Структура рабочего окружения

### Режимы разработки

#### 1. Полный режим (рекомендуется)

```bash
npm run dev
```

- Запускает Vite dev-сервер для React
- Запускает Electron с hot-reload
- DevTools открываются автоматически
- Изменения в `src/` применяются мгновенно
- Изменения в `electron/` требуют перезапуска

#### 2. Только renderer (для работы над UI)

```bash
npm run dev:renderer
```

- Запускает только Vite dev-сервер
- Быстрее загружается
- Без Electron функциональности
- Полезно для чистой работы над UI

#### 3. Production build для тестирования

```bash
npm run build:bundle
npm run electron
```

- Сборка production версии
- Тестирование в реальных условиях
- Проверка автообновлений, уведомлений

### Переменные окружения

В режиме разработки доступны:

- `NODE_ENV=development`
- `VITE_DEV_SERVER_URL=http://localhost:5173`

В production:

- `NODE_ENV=production`

## Архитектура кодовой базы

### Main Process (electron/)

#### main.ts

Точка входа приложения. Отвечает за:

- Инициализацию приложения
- Проверку единственного экземпляра
- Создание окна
- Инициализацию БД
- Запуск планировщика

```typescript
// Пример: добавление нового lifecycle hook
app.on('ready', async () => {
  await initDatabase()
  createWindow()
  // Ваш код здесь
})
```

#### database.ts

Управление SQLite через Knex:

- Создание подключения
- Инициализация схемы
- Применение миграций
- Seed данные для dev

```typescript
// Пример: добавление новой таблицы
await knex.schema.createTable('new_table', (table) => {
  table.increments('id').primary()
  table.string('name').notNullable()
  table.timestamps(true, true)
})
```

#### ipc/

IPC обработчики для связи с renderer:

- `requests.ts` — CRUD для заявок
- `employeeExits.ts` — CRUD для выходов
- `templates.ts` — CRUD для шаблонов
- `backup.ts` — Создание/восстановление бэкапов

```typescript
// Пример: создание нового IPC handler
ipcMain.handle('my-channel', async (event, payload) => {
  try {
    // Валидация через Zod
    const data = mySchema.parse(payload)
    // Логика
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
```

### Renderer Process (src/)

#### Структура компонентов

```
src/components/
├── [View].tsx          # Главные экраны
├── [Modal].tsx         # Модальные окна
├── [Component].tsx     # Переиспользуемые компоненты
└── ui/                 # shadcn/ui примитивы
```

#### Hooks паттерны

```typescript
// useRequests.ts - пример data fetching hook
export function useRequests() {
  return useQuery({
    queryKey: ['requests'],
    queryFn: async () => {
      const response = await window.electronAPI.getRequests()
      if (!response.success) throw new Error(response.error)
      return response.data
    },
  })
}

// useMutation для изменения данных
export function useCreateRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => window.electronAPI.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      toast.success('Заявка создана')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
```

## Разработка новых функций

### Шаг 1: Планирование

1. Определите требования
2. Спроектируйте структуру данных
3. Определите IPC API
4. Спланируйте UI

### Шаг 2: База данных

#### Создание миграции

```typescript
// electron/migrations.ts
export async function migrateNewFeature(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('table_name', 'new_column')
  if (!hasColumn) {
    await knex.schema.alterTable('table_name', (table) => {
      table.string('new_column')
    })
  }
}

// Добавьте вызов в runMigrations()
await migrateNewFeature(knex)
```

#### Обновление схемы для новых установок

```typescript
// electron/database.ts в ensureSchema()
await knex.schema.createTable('new_table', (table) => {
  table.increments('id').primary()
  table.string('column_name').notNullable()
  table.timestamps(true, true)
})
```

### Шаг 3: IPC API

#### 1. Определите Zod схему

```typescript
// src/types/ipc.ts
export const myDataSchema = z.object({
  name: z.string().min(1),
  value: z.number(),
})

export type MyData = z.infer<typeof myDataSchema>
```

#### 2. Создайте IPC handler

```typescript
// electron/ipc/myFeature.ts
import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { myDataSchema } from '../../src/types/ipc'

export function registerMyFeatureHandlers() {
  ipcMain.handle('get-my-data', async () => {
    try {
      const db = getDatabase()
      const data = await db('my_table').select('*')
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('create-my-data', async (event, payload) => {
    try {
      const validated = myDataSchema.parse(payload)
      const db = getDatabase()
      const [id] = await db('my_table').insert(validated)
      return { success: true, id }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
}
```

#### 3. Зарегистрируйте handlers

```typescript
// electron/main.ts
import { registerMyFeatureHandlers } from './ipc/myFeature'

app.on('ready', async () => {
  await initDatabase()
  registerMyFeatureHandlers() // Добавьте здесь
  createWindow()
})
```

#### 4. Экспортируйте API через preload

```typescript
// electron/preload.ts
const electronAPI = {
  // ... существующие методы
  getMyData: () => ipcRenderer.invoke('get-my-data'),
  createMyData: (data) => ipcRenderer.invoke('create-my-data', data),
}
```

#### 5. Типизируйте для renderer

```typescript
// src/types/electron.d.ts
interface ElectronAPI {
  // ... существующие методы
  getMyData: () => Promise<ApiResponse<MyData[]>>
  createMyData: (data: MyData) => Promise<ApiResponse<{ id: number }>>
}
```

### Шаг 4: React интеграция

#### 1. Создайте custom hook

```typescript
// src/hooks/useMyData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useMyData() {
  return useQuery({
    queryKey: ['myData'],
    queryFn: async () => {
      const response = await window.electronAPI.getMyData()
      if (!response.success) throw new Error(response.error)
      return response.data
    },
  })
}

export function useCreateMyData() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => window.electronAPI.createMyData(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myData'] })
      toast.success('Данные созданы')
    },
  })
}
```

#### 2. Создайте UI компонент

```typescript
// src/components/MyFeatureView.tsx
import { useMyData } from '../hooks/useMyData'

export function MyFeatureView() {
  const { data, isLoading } = useMyData()

  if (isLoading) return <TableSkeleton />

  return (
    <div className="space-y-4">
      {data?.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
```

## Работа с базой данных

### Использование Knex Query Builder

```typescript
// SELECT
const items = await db('table_name')
  .select('*')
  .where('is_active', true)
  .orderBy('created_at', 'desc')

// INSERT
const [id] = await db('table_name').insert({
  name: 'value',
  created_at: new Date().toISOString(),
})

// UPDATE
await db('table_name').where('id', id).update({ name: 'new value' })

// DELETE
await db('table_name').where('id', id).del()

// TRANSACTION
await db.transaction(async (trx) => {
  await trx('table1').insert(data1)
  await trx('table2').insert(data2)
})
```

### Индексы для производительности

```typescript
// Создание индекса
await knex.schema.alterTable('requests', (table) => {
  table.index('employee_name', 'idx_requests_employee_name')
  table.index(['is_issued', 'created_at'], 'idx_requests_issued_date')
})
```

### Best Practices для БД

1. **Всегда используйте транзакции** для связанных операций
2. **Создавайте индексы** для часто фильтруемых полей
3. **Используйте timestamps** для аудита
4. **Foreign keys** для связей между таблицами
5. **NOT NULL** для обязательных полей

## Стилизация и UI

### Tailwind CSS

```tsx
// Базовое использование
<div className="flex items-center gap-2 p-4 bg-white rounded-lg shadow">
  <span className="text-sm font-medium">Текст</span>
</div>

// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Контент */}
</div>

// Dark mode
<div className="bg-white dark:bg-gray-800 text-black dark:text-white">
  {/* Контент */}
</div>
```

### CSS переменные (темы)

```css
/* src/index.css */
:root {
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  /* ... */
}

.dark {
  --primary: 210 40% 98%;
  --secondary: 217.2 32.6% 17.5%;
  /* ... */
}
```

### shadcn/ui компоненты

```tsx
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

function MyComponent() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Открыть</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Заголовок</DialogTitle>
        </DialogHeader>
        {/* Контент */}
      </DialogContent>
    </Dialog>
  )
}
```

## Отладка

### Main Process

```typescript
// Логирование в консоль терминала
console.log('Debug info:', data)

// Использование electron-log
import log from 'electron-log'
log.info('Info message')
log.error('Error:', error)
```

Логи сохраняются в:

- **Windows**: `%USERPROFILE%\AppData\Roaming\Equipment Tracker\logs\`
- **macOS**: `~/Library/Logs/Equipment Tracker/`
- **Linux**: `~/.config/Equipment Tracker/logs/`

### Renderer Process

```typescript
// DevTools консоль
console.log('Debug:', data)

// React Query DevTools (автоматически в dev режиме)
// Показывает состояние всех запросов
```

### Отладка IPC

```typescript
// Main process
ipcMain.handle('my-channel', async (event, payload) => {
  console.log('Received:', payload)
  const result = await doSomething(payload)
  console.log('Returning:', result)
  return result
})

// Renderer process
const result = await window.electronAPI.myMethod(data)
console.log('Got:', result)
```

### Отладка SQLite

```typescript
// Включение SQL логов в Knex
const knex = Knex({
  client: 'sqlite3',
  connection: { filename: dbPath },
  debug: true, // Логирует все SQL запросы
})
```

## Тестирование

### Ручное тестирование

#### Checklist для новых функций:

- [ ] Создание записи
- [ ] Редактирование записи
- [ ] Удаление записи
- [ ] Поиск/фильтрация
- [ ] Сортировка
- [ ] Валидация форм
- [ ] Toast уведомления
- [ ] Состояние загрузки
- [ ] Обработка ошибок
- [ ] Перезагрузка данных
- [ ] Dark/Light тема
- [ ] Responsive дизайн

#### Тестирование на платформах:

- Windows (обязательно)
- macOS (если доступно)
- Linux (если доступно)

### Тестирование БД

```bash
# Откройте БД в SQLite Browser
# Windows: %APPDATA%/equipment-tracker/equipment.db

# Или через командную строку
sqlite3 equipment.db
.tables
.schema requests
SELECT * FROM requests;
```

## Линтинг и форматирование

### Запуск вручную

```bash
# ESLint
npm run lint

# Prettier
npm run format        # Форматирование
npm run format:check  # Только проверка
```

### Pre-commit hooks

Автоматически запускается через Husky:

1. Линтинг staged файлов
2. Prettier проверка
3. Блокировка коммита при ошибках

### Конфигурация ESLint

```javascript
// eslint.config.mjs
export default [
  {
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]
```

### Отключение правил (с осторожностью)

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = {}

// Для файла
/* eslint-disable @typescript-eslint/no-explicit-any */
```

## Сборка и релиз

### Локальная сборка

```bash
# Текущая платформа
npm run build

# Конкретная платформа
npm run build -- --win
npm run build -- --mac
npm run build -- --linux
```

### Создание релиза

```bash
# Используйте скрипты:
release.bat               # Windows релиз
release-multiplatform.bat # Все платформы через CI
```

Или вручную:

```bash
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

git push --follow-tags
```

### Проверка перед релизом

- [ ] Версия обновлена в package.json
- [ ] CHANGELOG обновлён
- [ ] Все тесты пройдены
- [ ] Линтинг чист
- [ ] Локальная сборка успешна
- [ ] Тестирование production build

## Советы и лучшие практики

### TypeScript

✅ **Хорошо:**

```typescript
interface User {
  id: number
  name: string
}

const user: User = { id: 1, name: 'John' }
```

❌ **Плохо:**

```typescript
const user: any = { id: 1, name: 'John' }
```

### React Hooks

✅ **Хорошо:**

```typescript
const memoizedValue = useMemo(() => computeExpensive(data), [data])
const stableCallback = useCallback(() => doSomething(), [])
```

❌ **Плохо:**

```typescript
const value = computeExpensive(data) // Вычисляется каждый рендер
```

### Обработка ошибок

✅ **Хорошо:**

```typescript
try {
  await riskyOperation()
} catch (error) {
  log.error('Operation failed:', error)
  return { success: false, error: 'Понятное сообщение' }
}
```

❌ **Плохо:**

```typescript
try {
  await riskyOperation()
} catch (error) {
  // Игнорируем ошибку
}
```

### Производительность

✅ **Хорошо:**

```typescript
const filteredItems = useMemo(() => items.filter((item) => item.active), [items])
```

❌ **Плохо:**

```typescript
const filteredItems = items.filter((item) => item.active) // Каждый рендер
```

## Часто встречающиеся проблемы

### Порт 5173 занят

```bash
# Найти процесс
netstat -ano | findstr :5173

# Убить процесс (Windows)
taskkill /PID <PID> /F
```

### Electron не запускается

1. Удалите node_modules и переустановите:

```bash
rm -rf node_modules
npm install
```

2. Пересоберите нативные модули:

```bash
npm run postinstall
```

### База данных заблокирована

```bash
# Закройте все экземпляры приложения
# Удалите файлы блокировки
rm %APPDATA%/equipment-tracker/*.db-shm
rm %APPDATA%/equipment-tracker/*.db-wal
```

### Hot reload не работает

1. Перезапустите dev сервер
2. Очистите кэш браузера (Ctrl+Shift+Delete)
3. Проверьте, что изменения в правильной директории

## Полезные ссылки

### Документация

- [Electron Docs](https://www.electronjs.org/docs/latest)
- [React Docs](https://react.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Knex.js](https://knexjs.org/)

### Инструменты

- [SQLite Browser](https://sqlitebrowser.org/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [VS Code](https://code.visualstudio.com/)

## Вклад в проект

См. [CONTRIBUTING.md](../CONTRIBUTING.md) для деталей.

## Поддержка

Если возникли вопросы:

1. Проверьте [TROUBLESHOOTING.md](./troubleshooting.md)
2. Поищите в [Issues](https://github.com/MaRT1n1q/Equipment.Tracker/issues)
3. Создайте новый Issue с подробным описанием
