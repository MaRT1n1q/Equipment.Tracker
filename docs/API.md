# 📡 IPC API Документация

## Обзор

Equipment Tracker использует IPC (Inter-Process Communication) для связи между Main Process (Node.js/Electron) и Renderer Process (React). Все API доступны через глобальный объект `window.electronAPI`.

## Формат ответа

Все IPC методы возвращают объект `ApiResponse`:

```typescript
interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  id?: number // Для операций создания
}
```

### Примеры ответов

**Успех:**
```typescript
{
  success: true,
  data: [ /* результаты */ ]
}
```

**Успех с ID (создание):**
```typescript
{
  success: true,
  id: 123,
  data: { /* созданная запись */ }
}
```

**Ошибка:**
```typescript
{
  success: false,
  error: "Описание ошибки на русском языке"
}
```

## Requests API

### getRequests()

Получает все заявки с привязанным оборудованием.

**Сигнатура:**
```typescript
getRequests(): Promise<ApiResponse<Request[]>>
```

**Request интерфейс:**
```typescript
interface Request {
  id: number
  employee_name: string
  login: string
  sd_number: string
  created_at: string
  is_issued: boolean
  return_required: boolean
  return_completed: boolean
  return_date: string | null
  equipment_items: EquipmentItem[]
}

interface EquipmentItem {
  id: number
  request_id: number
  equipment_name: string
  serial_number: string
}
```

**Пример использования:**
```typescript
const response = await window.electronAPI.getRequests()
if (response.success) {
  console.log('Заявки:', response.data)
}
```

**Пример ответа:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employee_name": "Иванов Иван Иванович",
      "login": "i.ivanov",
      "sd_number": "INC0001234",
      "created_at": "2024-01-15T10:30:00.000Z",
      "is_issued": true,
      "return_required": true,
      "return_completed": false,
      "return_date": "2024-02-15T00:00:00.000Z",
      "equipment_items": [
        {
          "id": 1,
          "request_id": 1,
          "equipment_name": "Ноутбук Dell Latitude 5520",
          "serial_number": "ABC123456"
        }
      ]
    }
  ]
}
```

---

### createRequest(data)

Создаёт новую заявку с оборудованием.

**Сигнатура:**
```typescript
createRequest(data: CreateRequestData): Promise<ApiResponse<Request>>
```

**CreateRequestData интерфейс:**
```typescript
interface CreateRequestData {
  employee_name: string      // минимум 1 символ
  login: string              // минимум 1 символ
  sd_number: string          // минимум 1 символ
  equipment_items: Array<{
    equipment_name: string   // минимум 1 символ
    serial_number: string    // минимум 1 символ
  }>                         // минимум 1 элемент
}
```

**Пример использования:**
```typescript
const newRequest = {
  employee_name: "Петров Петр Петрович",
  login: "p.petrov",
  sd_number: "INC0005678",
  equipment_items: [
    {
      equipment_name: "Ноутбук HP EliteBook",
      serial_number: "HP123456"
    },
    {
      equipment_name: "Мышь Logitech",
      serial_number: "LOG789"
    }
  ]
}

const response = await window.electronAPI.createRequest(newRequest)
if (response.success) {
  console.log('Создана заявка с ID:', response.id)
}
```

---

### updateRequest(id, data)

Обновляет существующую заявку.

**Сигнатура:**
```typescript
updateRequest(id: number, data: UpdateRequestData): Promise<ApiResponse>
```

**UpdateRequestData интерфейс:**
```typescript
interface UpdateRequestData {
  employee_name: string
  login: string
  sd_number: string
  equipment_items: Array<{
    equipment_name: string
    serial_number: string
  }>
}
```

**Пример использования:**
```typescript
const updates = {
  employee_name: "Петров П.П.",
  login: "p.petrov",
  sd_number: "INC0005678",
  equipment_items: [
    {
      equipment_name: "Ноутбук HP EliteBook (обновлённый)",
      serial_number: "HP123456"
    }
  ]
}

const response = await window.electronAPI.updateRequest(123, updates)
```

---

### deleteRequest(id)

Удаляет заявку и связанное оборудование.

**Сигнатура:**
```typescript
deleteRequest(id: number): Promise<ApiResponse<Request>>
```

**Возвращает:** Удалённую заявку для возможности отмены (undo).

**Пример использования:**
```typescript
const response = await window.electronAPI.deleteRequest(123)
if (response.success) {
  console.log('Удалена заявка:', response.data)
  // Можно восстановить через createRequest(response.data)
}
```

---

### updateRequestIssued(id, issued)

Обновляет статус выдачи оборудования.

**Сигнатура:**
```typescript
updateRequestIssued(id: number, issued: boolean): Promise<ApiResponse>
```

**Пример использования:**
```typescript
// Отметить как выданное
await window.electronAPI.updateRequestIssued(123, true)

// Отменить выдачу
await window.electronAPI.updateRequestIssued(123, false)
```

---

### scheduleReturn(id, returnDate)

Планирует возврат оборудования.

**Сигнатура:**
```typescript
scheduleReturn(id: number, returnDate: string): Promise<ApiResponse>
```

**Параметры:**
- `returnDate` — дата в формате ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)

**Пример использования:**
```typescript
const returnDate = new Date('2024-12-31').toISOString()
await window.electronAPI.scheduleReturn(123, returnDate)
```

---

### completeReturn(id)

Отмечает возврат как завершённый.

**Сигнатура:**
```typescript
completeReturn(id: number): Promise<ApiResponse>
```

**Пример использования:**
```typescript
await window.electronAPI.completeReturn(123)
```

---

## Employee Exits API

### getEmployeeExits()

Получает все записи о выходах сотрудников.

**Сигнатура:**
```typescript
getEmployeeExits(): Promise<ApiResponse<EmployeeExit[]>>
```

**EmployeeExit интерфейс:**
```typescript
interface EmployeeExit {
  id: number
  employee_name: string
  exit_date: string          // YYYY-MM-DD
  equipment_list: string     // JSON или текст
  is_completed: boolean
  created_at: string
}
```

**Пример ответа:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employee_name": "Сидоров Сидор Сидорович",
      "exit_date": "2024-02-20",
      "equipment_list": "[{\"name\":\"Ноутбук\",\"serial\":\"SN123\"}]",
      "is_completed": false,
      "created_at": "2024-02-18T14:20:00.000Z"
    }
  ]
}
```

---

### createEmployeeExit(data)

Создаёт новую запись о выходе.

**Сигнатура:**
```typescript
createEmployeeExit(data: CreateEmployeeExitData): Promise<ApiResponse>
```

**CreateEmployeeExitData интерфейс:**
```typescript
interface CreateEmployeeExitData {
  employee_name: string
  exit_date: string          // YYYY-MM-DD
  equipment_items: Array<{
    name: string
    serial: string
  }>
}
```

**Пример использования:**
```typescript
const newExit = {
  employee_name: "Алексеев А.А.",
  exit_date: "2024-03-15",
  equipment_items: [
    { name: "Ноутбук", serial: "NB123" },
    { name: "Телефон", serial: "PH456" }
  ]
}

const response = await window.electronAPI.createEmployeeExit(newExit)
```

---

### updateEmployeeExit(id, data)

Обновляет запись о выходе.

**Сигнатура:**
```typescript
updateEmployeeExit(id: number, data: UpdateEmployeeExitData): Promise<ApiResponse>
```

**UpdateEmployeeExitData интерфейс:**
```typescript
interface UpdateEmployeeExitData {
  employee_name: string
  exit_date: string
  equipment_items: Array<{
    name: string
    serial: string
  }>
}
```

**Пример использования:**
```typescript
const updates = {
  employee_name: "Алексеев Алексей Алексеевич",
  exit_date: "2024-03-16",
  equipment_items: [
    { name: "Ноутбук Dell", serial: "NB123" }
  ]
}

await window.electronAPI.updateEmployeeExit(1, updates)
```

---

### deleteEmployeeExit(id)

Удаляет запись о выходе.

**Сигнатура:**
```typescript
deleteEmployeeExit(id: number): Promise<ApiResponse<EmployeeExit>>
```

**Возвращает:** Удалённую запись для возможности отмены.

---

### updateExitCompleted(id, completed)

Обновляет статус завершения выхода.

**Сигнатура:**
```typescript
updateExitCompleted(id: number, completed: boolean): Promise<ApiResponse>
```

**Пример использования:**
```typescript
// Отметить как завершённый
await window.electronAPI.updateExitCompleted(1, true)

// Вернуть в незавершённые
await window.electronAPI.updateExitCompleted(1, false)
```

---

### exportEmployeeExits()

Экспортирует все выходы в CSV файл.

**Сигнатура:**
```typescript
exportEmployeeExits(): Promise<ApiResponse>
```

**Пример использования:**
```typescript
const response = await window.electronAPI.exportEmployeeExits()
if (response.success) {
  console.log('Экспорт завершён')
}
```

**Формат CSV:**
```csv
ФИО сотрудника,Дата выхода,Список оборудования,Статус,Дата создания
"Иванов И.И.","2024-02-20","Ноутбук - SN123
Мышь - SN456","Выполнено","2024-02-18"
```

---

## Templates API

### getTemplates()

Получает все шаблоны заявок.

**Сигнатура:**
```typescript
getTemplates(): Promise<ApiResponse<Template[]>>
```

**Template интерфейс:**
```typescript
interface Template {
  id: number
  name: string
  equipment_items: string    // JSON массив
  created_at: string
}
```

**Пример ответа:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Стандартный набор",
      "equipment_items": "[{\"equipment_name\":\"Ноутбук\",\"serial_number\":\"\"}]",
      "created_at": "2024-01-10T09:00:00.000Z"
    }
  ]
}
```

---

### createTemplate(data)

Создаёт новый шаблон.

**Сигнатура:**
```typescript
createTemplate(data: CreateTemplateData): Promise<ApiResponse>
```

**CreateTemplateData интерфейс:**
```typescript
interface CreateTemplateData {
  name: string
  equipment_items: Array<{
    equipment_name: string
    serial_number: string
  }>
}
```

---

### updateTemplate(id, data)

Обновляет шаблон.

**Сигнатура:**
```typescript
updateTemplate(id: number, data: UpdateTemplateData): Promise<ApiResponse>
```

---

### deleteTemplate(id)

Удаляет шаблон.

**Сигнатура:**
```typescript
deleteTemplate(id: number): Promise<ApiResponse<Template>>
```

---

## Backup API

### createBackup()

Создаёт резервную копию БД. Открывает диалог сохранения файла.

**Сигнатура:**
```typescript
createBackup(): Promise<ApiResponse>
```

**Пример использования:**
```typescript
const response = await window.electronAPI.createBackup()
if (response.success) {
  console.log('Резервная копия создана')
} else if (response.error === 'Отменено пользователем') {
  console.log('Пользователь отменил сохранение')
}
```

---

### restoreBackup(filePath)

Восстанавливает БД из резервной копии.

**Сигнатура:**
```typescript
restoreBackup(filePath: string): Promise<ApiResponse>
```

**⚠️ Важно:**
- Создаёт emergency backup текущей БД
- После успешного восстановления требуется перезагрузка приложения
- Renderer автоматически выполняет `window.location.reload()`

**Пример использования:**
```typescript
const response = await window.electronAPI.restoreBackup('/path/to/backup.db')
if (response.success) {
  // Приложение автоматически перезагрузится
}
```

---

### getBackupPath()

Получает путь к директории с автоматическими бэкапами.

**Сигнатура:**
```typescript
getBackupPath(): Promise<ApiResponse<{ path: string }>>
```

**Пример использования:**
```typescript
const response = await window.electronAPI.getBackupPath()
if (response.success) {
  console.log('Папка бэкапов:', response.data.path)
}
```

---

## System API

### getAppVersion()

Получает текущую версию приложения.

**Сигнатура:**
```typescript
getAppVersion(): Promise<string>
```

**Пример использования:**
```typescript
const version = await window.electronAPI.getAppVersion()
console.log('Версия:', version) // "1.0.18"
```

---

### onUpdateStatus(callback)

Подписка на события автообновления.

**Сигнатура:**
```typescript
onUpdateStatus(callback: (status: UpdateStatus) => void): void
```

**UpdateStatus интерфейс:**
```typescript
interface UpdateStatus {
  type: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  message: string
  version?: string
  error?: string
}
```

**Пример использования:**
```typescript
window.electronAPI.onUpdateStatus((status) => {
  switch (status.type) {
    case 'checking':
      console.log('Проверка обновлений...')
      break
    case 'available':
      console.log('Доступна версия:', status.version)
      break
    case 'downloading':
      console.log('Загрузка обновления...')
      break
    case 'downloaded':
      console.log('Обновление загружено, перезапустите приложение')
      break
    case 'error':
      console.error('Ошибка обновления:', status.error)
      break
  }
})
```

---

## Обработка ошибок

### Типичные ошибки

```typescript
// Валидация не пройдена
{
  success: false,
  error: "Обязательное поле 'employee_name' не заполнено"
}

// БД ошибка
{
  success: false,
  error: "Ошибка при сохранении данных"
}

// Файл не найден
{
  success: false,
  error: "Файл резервной копии не найден"
}
```

### Паттерн обработки

```typescript
async function handleApiCall() {
  try {
    const response = await window.electronAPI.someMethod(data)
    
    if (response.success) {
      // Успех
      toast.success('Операция выполнена')
      return response.data
    } else {
      // API вернул ошибку
      toast.error(response.error)
      throw new Error(response.error)
    }
  } catch (error) {
    // Непредвиденная ошибка
    console.error('Unexpected error:', error)
    toast.error('Произошла непредвиденная ошибка')
  }
}
```

---

## Валидация данных

Все входные данные валидируются через Zod схемы:

```typescript
// src/types/ipc.ts
import { z } from 'zod'

export const createRequestSchema = z.object({
  employee_name: z.string().min(1, 'ФИО обязательно'),
  login: z.string().min(1, 'Логин обязателен'),
  sd_number: z.string().min(1, 'Номер заявки обязателен'),
  equipment_items: z.array(
    z.object({
      equipment_name: z.string().min(1, 'Название оборудования обязательно'),
      serial_number: z.string().min(1, 'Серийный номер обязателен')
    })
  ).min(1, 'Добавьте хотя бы одну единицу оборудования')
})
```

---

## Best Practices

### 1. Используйте TanStack Query

```typescript
// ✅ Хорошо
import { useQuery } from '@tanstack/react-query'

export function useRequests() {
  return useQuery({
    queryKey: ['requests'],
    queryFn: async () => {
      const response = await window.electronAPI.getRequests()
      if (!response.success) throw new Error(response.error)
      return response.data
    }
  })
}

// ❌ Плохо
const [requests, setRequests] = useState([])
useEffect(() => {
  window.electronAPI.getRequests().then(r => setRequests(r.data))
}, [])
```

### 2. Инвалидируйте кэш после мутаций

```typescript
const mutation = useMutation({
  mutationFn: (data) => window.electronAPI.createRequest(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['requests'] })
  }
})
```

### 3. Обрабатывайте ошибки

```typescript
const mutation = useMutation({
  mutationFn: (data) => window.electronAPI.createRequest(data),
  onError: (error) => {
    toast.error(error.message)
  },
  onSuccess: () => {
    toast.success('Заявка создана')
  }
})
```

### 4. Типизируйте всё

```typescript
// ✅ Хорошо
const response: ApiResponse<Request[]> = await window.electronAPI.getRequests()

// ❌ Плохо
const response = await window.electronAPI.getRequests()
```

---

## Расширение API

Чтобы добавить новый метод:

1. Создайте handler в `electron/ipc/`
2. Зарегистрируйте в `electron/main.ts`
3. Экспортируйте через `electron/preload.ts`
4. Добавьте тип в `src/types/electron.d.ts`
5. Создайте Zod схему в `src/types/ipc.ts`

См. [DEVELOPMENT.md](./DEVELOPMENT.md) для подробной инструкции.

---

## Тестирование API

```typescript
// Простой тест через консоль DevTools
await window.electronAPI.getRequests()
await window.electronAPI.createRequest({
  employee_name: "Test User",
  login: "test",
  sd_number: "TEST123",
  equipment_items: [
    { equipment_name: "Test Item", serial_number: "SN123" }
  ]
})
```

---

## Дополнительные ресурсы

- [Electron IPC](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Context Bridge](https://www.electronjs.org/docs/latest/api/context-bridge)
- [Zod Documentation](https://zod.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
