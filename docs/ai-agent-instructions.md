# 🤖 Инструкция для AI агента по работе с Equipment Tracker

## Общая информация о проекте

**Equipment Tracker** — это десктопное приложение на Electron для учёта выдачи оборудования сотрудникам и управления их выходами.

### Ключевые характеристики:

- **Платформа**: Electron 39 + React 19 + TypeScript 5
- **База данных**: SQLite 3 (локальная, оффлайн)
- **Архитектура**: Разделение Main Process (Node.js) и Renderer Process (React)
- **Интерфейс**: Русский язык, современный UI на Tailwind CSS + shadcn/ui
- **Коммуникация**: IPC через contextBridge (preload.ts)

## Архитектурные принципы

### 1. Безопасность превыше всего

- Context Isolation включен
- Node Integration отключен
- Все операции с Node.js только через IPC
- Валидация данных на обеих сторонах (Zod)

### 2. Оффлайн-первый подход

- Все данные хранятся локально в SQLite
- Не требуется интернет для работы
- Автоматические резервные копии

### 3. Типизация везде

- Строгий режим TypeScript
- Zod схемы для runtime валидации
- Синхронизированные типы между Main и Renderer

### 4. Реактивность и производительность

- TanStack Query для управления состоянием
- Оптимистичные обновления
- Debouncing для поиска
- Skeleton loaders для UX

## Структура проекта

```
equipment-tracker/
├── electron/          # Main Process (Node.js)
│   ├── main.ts       # Точка входа
│   ├── database.ts   # SQLite + Knex
│   ├── preload.ts    # IPC Bridge
│   └── ipc/          # API handlers
├── src/              # Renderer Process (React)
│   ├── components/   # React компоненты
│   ├── hooks/        # Custom hooks
│   ├── types/        # TypeScript типы
│   └── lib/          # Утилиты
└── docs/             # Документация
```

## Правила работы с кодом

### 1. При изменении базы данных

**ВСЕГДА:**

1. Создавай миграцию в `electron/migrations.ts`
2. Обновляй схему в `electron/database.ts` (для новых установок)
3. Проверяй идемпотентность миграции
4. Тестируй на чистой БД и на существующей

```typescript
// Пример миграции
export async function migrateNewFeature(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('table', 'column')
  if (!hasColumn) {
    await knex.schema.alterTable('table', (table) => {
      table.string('column')
    })
  }
}
```

### 2. При добавлении нового IPC метода

**Последовательность действий:**

1. **Создай Zod схему** в `src/types/ipc.ts`:

```typescript
export const myDataSchema = z.object({
  name: z.string().min(1),
  value: z.number(),
})
```

2. **Создай IPC handler** в `electron/ipc/`:

```typescript
ipcMain.handle('my-channel', async (event, payload) => {
  try {
    const data = myDataSchema.parse(payload)
    // Логика
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
```

3. **Зарегистрируй** в `electron/main.ts`

4. **Экспортируй** через `electron/preload.ts`:

```typescript
myMethod: (data) => ipcRenderer.invoke('my-channel', data)
```

5. **Типизируй** в `src/types/electron.d.ts`:

```typescript
interface ElectronAPI {
  myMethod: (data: MyData) => Promise<ApiResponse<Result>>
}
```

### 3. При создании React компонента

**Следуй структуре:**

- View компоненты — главные экраны (`RequestsView.tsx`)
- Modal компоненты — модальные окна (`AddRequestModal.tsx`)
- Shared компоненты — переиспользуемые (`SearchAndFilters.tsx`)
- UI компоненты — примитивы в `components/ui/`

**Используй:**

- TanStack Query для данных
- Custom hooks для логики
- TypeScript строго
- Tailwind для стилей

```typescript
export function MyView() {
  const { data, isLoading } = useMyData()

  if (isLoading) return <TableSkeleton />

  return (
    <div className="space-y-4">
      {data?.map(item => (
        <Card key={item.id}>{item.name}</Card>
      ))}
    </div>
  )
}
```

### 4. При работе с данными

**Используй TanStack Query:**

```typescript
// Чтение данных
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

// Изменение данных
export function useCreateRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => window.electronAPI.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      toast.success('Создано')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
```

## Частые задачи

### Добавление нового поля в таблицу

```typescript
// 1. Миграция
await knex.schema.alterTable('requests', (table) => {
  table.string('new_field').defaultTo('')
})

// 2. Обновление схемы (для новых установок)
await knex.schema.createTable('requests', (table) => {
  // ... существующие поля
  table.string('new_field').defaultTo('')
})

// 3. Обновление Zod схемы
export const requestSchema = z.object({
  // ... существующие поля
  new_field: z.string()
})

// 4. Обновление TypeScript интерфейса
interface Request {
  // ... существующие поля
  new_field: string
}

// 5. Обновление UI формы
<Input name="new_field" label="Новое поле" />
```

### Добавление новой таблицы

1. Создай схему в `database.ts` (ensureSchema)
2. Создай IPC handlers в `electron/ipc/`
3. Создай Zod схемы в `src/types/ipc.ts`
4. Создай React hooks в `src/hooks/`
5. Создай UI компоненты

### Исправление бага

1. **Воспроизведи** баг локально
2. **Найди** причину (логи, отладка)
3. **Исправь** минимальным изменением
4. **Тестируй** сценарии:
   - Основной use case
   - Edge cases
   - Разные платформы (если возможно)
5. **Документируй** в коммите

### Оптимизация производительности

**Приоритеты:**

1. Добавь индексы в БД для часто используемых фильтров
2. Используй useMemo для тяжёлых вычислений
3. Добавь debouncing для поиска
4. Рассмотри виртуализацию для больших списков
5. Проверь, что нет лишних ре-рендеров

## Что НЕ делать

### ❌ Никогда не делай:

1. **Не добавляй nodeIntegration в renderer**

   ```typescript
   // ❌ ПЛОХО
   nodeIntegration: true
   ```

2. **Не используй any без крайней необходимости**

   ```typescript
   // ❌ ПЛОХО
   const data: any = {}

   // ✅ ХОРОШО
   const data: MyType = {}
   ```

3. **Не игнорируй ошибки**

   ```typescript
   // ❌ ПЛОХО
   try {
     await operation()
   } catch (error) {
     // пусто
   }

   // ✅ ХОРОШО
   try {
     await operation()
   } catch (error) {
     log.error('Operation failed:', error)
     return { success: false, error: 'Понятное сообщение' }
   }
   ```

4. **Не удаляй данные пользователя без бэкапа**

   ```typescript
   // ✅ ХОРОШО
   await createBackup()
   await deleteData()
   ```

5. **Не забывай про миграции**
   - Любое изменение схемы БД = миграция
   - Миграции должны быть идемпотентными

6. **Не используй прямой доступ к Node.js в renderer**

   ```typescript
   // ❌ ПЛОХО (в renderer)
   import fs from 'fs'

   // ✅ ХОРОШО (через IPC)
   await window.electronAPI.readFile()
   ```

## Стилизация и UI

### Tailwind CSS паттерны

```tsx
// Базовая карточка
<div className="rounded-lg border bg-card p-6 shadow-sm">

// Кнопка primary
<Button variant="default" className="bg-gradient-primary">

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Dark mode
<div className="bg-white dark:bg-gray-800">
```

### Компоненты shadcn/ui

Всегда используй готовые компоненты из `components/ui/`:

- Button, Dialog, Input, Select
- Tooltip, Dropdown, Card
- И другие

### Локализация

**ВСЕ** пользовательские строки на русском:

```typescript
// ✅ ХОРОШО
toast.success('Заявка создана')
toast.error('Ошибка при сохранении')

// ❌ ПЛОХО
toast.success('Request created')
```

## Отладка

### Main Process

```typescript
import log from 'electron-log'
log.info('Debug info:', data)
```

Логи: `%USERPROFILE%\AppData\Roaming\Equipment Tracker\logs\`

### Renderer Process

- DevTools автоматически в dev режиме
- React Query DevTools встроен
- `console.log()` в DevTools консоль

### База данных

```bash
# Открыть в SQLite Browser
%APPDATA%\equipment-tracker\equipment.db
```

## Тестирование

### Перед коммитом:

```bash
# 1. Линтинг
npm run lint

# 2. Форматирование
npm run format:check

# 3. Сборка
npm run build:bundle
```

### Ручное тестирование:

- [ ] Создание записи
- [ ] Редактирование записи
- [ ] Удаление записи
- [ ] Поиск работает
- [ ] Фильтры работают
- [ ] Toast уведомления показываются
- [ ] Валидация форм
- [ ] Dark/Light тема
- [ ] Responsive (если применимо)

## Сборка и релиз

### Локальная сборка

```bash
npm run build              # Текущая ОС
npm run build -- --win     # Windows
npm run build -- --mac     # macOS
npm run build -- --linux   # Linux
```

### Создание релиза

```bash
# Автоматически (рекомендуется)
release-multiplatform.bat  # Все платформы через CI

# Или вручную
npm version patch          # 1.0.0 -> 1.0.1
git push --follow-tags
```

## Контрольный список для изменений

### При добавлении функции:

- [ ] Создана миграция БД (если нужно)
- [ ] Обновлена схема для новых установок
- [ ] Созданы Zod схемы
- [ ] Созданы IPC handlers
- [ ] Обновлён preload.ts
- [ ] Обновлены TypeScript типы
- [ ] Созданы React hooks
- [ ] Созданы UI компоненты
- [ ] Добавлена валидация
- [ ] Добавлена обработка ошибок
- [ ] Проверена производительность
- [ ] Проверена на разных платформах
- [ ] Обновлена документация

### При исправлении бага:

- [ ] Воспроизведён баг
- [ ] Найдена причина
- [ ] Исправлен минимально
- [ ] Проверены edge cases
- [ ] Добавлены логи (если нужно)
- [ ] Прошёл линтинг
- [ ] Протестирован вручную

## Полезные ссылки

### Внутренняя документация

- [ARCHITECTURE.md](./ARCHITECTURE.md) — архитектура проекта
- [DEVELOPMENT.md](./DEVELOPMENT.md) — руководство разработчика
- [DATABASE.md](./DATABASE.md) — схема базы данных
- [API.md](./API.md) — IPC API документация
- [TROUBLESHOOTING.md](./troubleshooting.md) — решение проблем

### Внешняя документация

- [Electron Docs](https://www.electronjs.org/docs/latest)
- [React Docs](https://react.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Knex.js](https://knexjs.org/)
- [Zod](https://zod.dev/)

## Примеры кода

### Полный пример: добавление нового поля

```typescript
// 1. Миграция (electron/migrations.ts)
export async function migrateAddPhoneNumber(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('requests', 'phone_number')
  if (!hasColumn) {
    await knex.schema.alterTable('requests', (table) => {
      table.string('phone_number').defaultTo('')
    })
  }
}

// 2. Zod схема (src/types/ipc.ts)
export const createRequestSchema = z.object({
  // ... существующие поля
  phone_number: z.string().optional()
})

// 3. TypeScript тип
interface Request {
  // ... существующие поля
  phone_number?: string
}

// 4. UI (src/components/AddRequestModal.tsx)
<Input
  name="phone_number"
  label="Телефон"
  placeholder="+7 (999) 123-45-67"
/>
```

### Полный пример: новый IPC метод

```typescript
// 1. Handler (electron/ipc/requests.ts)
ipcMain.handle('search-requests', async (event, query: string) => {
  try {
    const db = getDatabase()
    const results = await db('requests')
      .where('employee_name', 'like', `%${query}%`)
      .orWhere('login', 'like', `%${query}%`)
      .select('*')
    return { success: true, data: results }
  } catch (error) {
    return { success: false, error: 'Ошибка поиска' }
  }
})

// 2. Preload (electron/preload.ts)
searchRequests: (query) => ipcRenderer.invoke('search-requests', query)

// 3. Type (src/types/electron.d.ts)
searchRequests: (query: string) => Promise<ApiResponse<Request[]>>

// 4. Hook (src/hooks/useRequests.ts)
export function useSearchRequests(query: string) {
  return useQuery({
    queryKey: ['requests', 'search', query],
    queryFn: async () => {
      if (!query) return []
      const response = await window.electronAPI.searchRequests(query)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    enabled: query.length > 0,
  })
}

// 5. Component (src/components/RequestsView.tsx)
const { data: searchResults } = useSearchRequests(searchQuery)
```

## Заключение

Следуя этим инструкциям, ты сможешь эффективно работать с кодовой базой Equipment Tracker. Помни:

1. **Безопасность** — изоляция процессов, валидация
2. **Типизация** — TypeScript + Zod везде
3. **Производительность** — оптимизация, кеширование
4. **UX** — понятные ошибки, skeleton loaders
5. **Документация** — обновляй при изменениях

При возникновении вопросов обращайся к соответствующим разделам документации.
