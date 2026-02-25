# Stage 2 — API Contract v1 (backend-first)

Дата: 2026-02-25  
Статус: ✅ Черновик для реализации

## 1) Scope Stage 2

Фиксируем контракт `v1` для модулей:

- `auth`
- `requests` + `equipment_items`
- `employee_exits`
- `templates` + `template_files`
- `instructions` + `instruction_attachments`

Цель этапа: единый API для web и desktop renderer, без доменной зависимости от `window.electronAPI`.

---

## 2) API style и versioning

- Базовый префикс: `/api/v1`
- Формат: JSON over HTTP
- Аутентификация: `Authorization: Bearer <access_token>`
- Время: ISO-8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- Версии: только backward-compatible изменения внутри `v1`

Совместимость на переходе:

- `POST /api/auth/login` сохраняется как compatibility endpoint (уже используется клиентом).
- Канонический путь для auth в `v1`: `POST /api/v1/auth/login`.

---

## 3) Единый формат ошибок

Ошибка API:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Поле login обязательно",
    "details": {
      "field": "login"
    },
    "request_id": "req_01HT..."
  }
}
```

Коды ошибок (`error.code`):

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `VALIDATION_ERROR`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

HTTP mapping:

- `400` validation
- `401` unauthorized
- `403` forbidden
- `404` not found
- `409` conflict
- `429` rate limit
- `500` internal

---

## 4) Пагинация, фильтры, сортировка

Запрос:

- `page` (>=1)
- `page_size` (5..200, default 25)
- `search` (optional)
- `status` (ресурс-специфичный)
- `sort` (optional, whitelisted)

Ответ списков:

```json
{
  "items": [],
  "meta": {
    "page": 1,
    "page_size": 25,
    "total": 0,
    "page_count": 0,
    "has_more": false
  }
}
```

---

## 5) Контракты ресурсов (v1)

## 5.1 Auth

### `POST /api/v1/auth/login`

Request:

```json
{ "login": "i.ivanov", "password": "********" }
```

Response 200:

```json
{
  "user_id": "uuid",
  "login": "i.ivanov",
  "access_token": "jwt",
  "refresh_token": "jwt"
}
```

### `POST /api/v1/auth/refresh`

Request:

```json
{ "refresh_token": "jwt" }
```

Response 200:

```json
{ "access_token": "jwt", "refresh_token": "jwt" }
```

### `POST /api/v1/auth/logout`

Request:

```json
{ "refresh_token": "jwt" }
```

Response 200:

```json
{ "success": true }
```

---

## 5.2 Requests

Статусы фильтра `status`:

- `all`
- `issued`
- `not-issued`
- `return-pending`
- `return-completed`

### `GET /api/v1/requests`

Query: `page`, `page_size`, `search`, `status`

Response 200:

```json
{
  "items": [
    {
      "id": 1,
      "employee_name": "Иванов Иван Иванович",
      "login": "i.ivanov",
      "sd_number": "INC000123",
      "delivery_url": "https://...",
      "created_at": "2026-02-25T09:00:00.000Z",
      "is_issued": 0,
      "issued_at": null,
      "notes": null,
      "return_required": 0,
      "return_due_date": null,
      "return_equipment": null,
      "return_completed": 0,
      "return_completed_at": null,
      "return_scheduled_at": null,
      "equipment_items": [
        {
          "id": 10,
          "equipment_name": "Ноутбук",
          "serial_number": "ABC123",
          "quantity": 1,
          "status": "in_stock"
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "page_size": 25,
    "total": 1,
    "page_count": 1,
    "has_more": false
  }
}
```

### `GET /api/v1/requests/summary`

Response 200:

```json
{
  "totals": {
    "total": 0,
    "issued": 0,
    "not_issued": 0,
    "return_pending": 0,
    "return_completed": 0,
    "this_month": 0
  },
  "return_events": []
}
```

### `POST /api/v1/requests`

Request:

```json
{
  "employee_name": "Иванов Иван Иванович",
  "login": "i.ivanov",
  "sd_number": "INC000123",
  "delivery_url": "https://...",
  "notes": "...",
  "equipment_items": [
    {
      "equipment_name": "Ноутбук",
      "serial_number": "ABC123",
      "quantity": 1,
      "status": "in_stock"
    }
  ]
}
```

Response 201:

```json
{ "id": 123 }
```

### `PUT /api/v1/requests/{id}`

Request body = как `POST /requests`.

Response 200:

```json
{ "success": true }
```

### `DELETE /api/v1/requests/{id}`

Response 200:

```json
{
  "deleted": {
    "id": 123
  }
}
```

### `POST /api/v1/requests/{id}/restore`

Request: полный payload удалённой записи (для undo workflow).

Response 200:

```json
{ "success": true }
```

### `POST /api/v1/requests/{id}/issued`

Request:

```json
{ "is_issued": true }
```

Response 200: `{ "success": true }`

### `POST /api/v1/requests/{id}/return/schedule`

Request:

```json
{ "due_date": "2026-02-28", "equipment": "Ноутбук, мышь" }
```

Response 200: `{ "success": true }`

### `POST /api/v1/requests/{id}/return/complete`

Request:

```json
{ "completed": true }
```

Response 200: `{ "success": true }`

### `POST /api/v1/requests/{id}/return/cancel`

Response 200: `{ "success": true }`

### `POST /api/v1/equipment-items/{item_id}/status`

Request:

```json
{ "status": "issued" }
```

`status` enum: `ordered | in_transit | in_stock | issued`.

Response 200: `{ "success": true }`

---

## 5.3 Employee Exits

Статусы фильтра `status`:

- `all`
- `pending`
- `completed`

### `GET /api/v1/employee-exits`

Query: `page`, `page_size`, `search`, `status`

Response: paginated list (как в requests).

### `GET /api/v1/employee-exits/summary`

Response:

```json
{
  "totals": {
    "total": 0,
    "completed": 0,
    "pending": 0
  },
  "exits": []
}
```

### `POST /api/v1/employee-exits`

Request:

```json
{
  "employee_name": "Иванов Иван Иванович",
  "login": "i.ivanov",
  "sd_number": "INC000123",
  "delivery_url": "https://...",
  "exit_date": "2026-03-01",
  "equipment_list": "Ноутбук\nМышь"
}
```

Response 201: `{ "id": 321 }`

### `PUT /api/v1/employee-exits/{id}`

Response 200: `{ "success": true }`

### `DELETE /api/v1/employee-exits/{id}`

Response 200:

```json
{ "deleted": { "id": 321 } }
```

### `POST /api/v1/employee-exits/{id}/restore`

Response 200: `{ "success": true }`

### `POST /api/v1/employee-exits/{id}/completed`

Request:

```json
{ "is_completed": true }
```

Response 200: `{ "success": true }`

### `POST /api/v1/employee-exits/{id}/equipment-status`

Request:

```json
{ "equipment_index": 0, "status": "in_stock" }
```

Response 200: `{ "success": true }`

### `POST /api/v1/employee-exits/export`

Request: список/фильтр для выгрузки.

Response 200:

```json
{ "download_url": "https://.../export.csv" }
```

---

## 5.4 Templates

### `GET /api/v1/templates`

Response 200: `Template[]`.

### `POST /api/v1/templates`

Request:

```json
{ "title": "Название", "content": "Текст" }
```

Response 201:

```json
{ "id": 1 }
```

### `PUT /api/v1/templates/{id}`

Response 200: `{ "success": true }`

### `DELETE /api/v1/templates/{id}`

Response 200: `{ "success": true }`

### `POST /api/v1/templates/reorder`

Request:

```json
{ "order": [3, 1, 2] }
```

Response 200: `{ "success": true }`

### Template files

- `GET /api/v1/templates/{id}/files`
- `POST /api/v1/templates/{id}/files` (multipart upload)
- `GET /api/v1/template-files/{file_id}` (metadata)
- `GET /api/v1/template-files/{file_id}/download`
- `GET /api/v1/template-files/{file_id}/preview`
- `DELETE /api/v1/template-files/{file_id}`
- `GET /api/v1/template-files/counts`

---

## 5.5 Instructions

### `GET /api/v1/instructions`

Response: плоский список с полями:

- `id`, `parent_id`, `title`, `content`, `sort_order`, `is_folder`, `is_favorite`, `tags`, `created_at`, `updated_at`

### `GET /api/v1/instructions/{id}`

### `POST /api/v1/instructions`

Request:

```json
{
  "parent_id": null,
  "title": "Новая инструкция",
  "content": "...",
  "is_folder": false,
  "tags": ["онбординг"]
}
```

### `PUT /api/v1/instructions/{id}`

### `POST /api/v1/instructions/{id}/move`

Request:

```json
{ "parent_id": 10, "sort_order": 2 }
```

### `POST /api/v1/instructions/reorder`

Request:

```json
{ "parent_id": 10, "order": [22, 24, 23] }
```

### `DELETE /api/v1/instructions/{id}`

### `POST /api/v1/instructions/{id}/duplicate`

### `POST /api/v1/instructions/{id}/favorite-toggle`

### `PUT /api/v1/instructions/{id}/tags`

Request:

```json
{ "tags": ["dev", "hr"] }
```

### `GET /api/v1/instructions/tags`

### Instruction attachments

- `GET /api/v1/instructions/{id}/attachments`
- `POST /api/v1/instructions/{id}/attachments` (multipart)
- `DELETE /api/v1/instruction-attachments/{attachment_id}`
- `GET /api/v1/instruction-attachments/{attachment_id}/preview`
- `GET /api/v1/instruction-attachments/{attachment_id}/open`

---

## 6) Mapping: IPC -> API (миграционный слой)

- `get-requests` -> `GET /api/v1/requests`
- `get-requests-summary` -> `GET /api/v1/requests/summary`
- `create-request` -> `POST /api/v1/requests`
- `update-request` -> `PUT /api/v1/requests/{id}`
- `update-issued` -> `POST /api/v1/requests/{id}/issued`
- `schedule-request-return` -> `POST /api/v1/requests/{id}/return/schedule`
- `complete-request-return` -> `POST /api/v1/requests/{id}/return/complete`
- `cancel-request-return` -> `POST /api/v1/requests/{id}/return/cancel`
- `update-equipment-status` -> `POST /api/v1/equipment-items/{item_id}/status`
- `delete-request` -> `DELETE /api/v1/requests/{id}`
- `restore-request` -> `POST /api/v1/requests/{id}/restore`
- `get-employee-exits` -> `GET /api/v1/employee-exits`
- `get-employee-exits-summary` -> `GET /api/v1/employee-exits/summary`
- `create-employee-exit` -> `POST /api/v1/employee-exits`
- `update-employee-exit` -> `PUT /api/v1/employee-exits/{id}`
- `delete-employee-exit` -> `DELETE /api/v1/employee-exits/{id}`
- `restore-employee-exit` -> `POST /api/v1/employee-exits/{id}/restore`
- `update-exit-completed` -> `POST /api/v1/employee-exits/{id}/completed`
- `update-exit-equipment-status` -> `POST /api/v1/employee-exits/{id}/equipment-status`
- `get-templates` -> `GET /api/v1/templates`
- `create-template` -> `POST /api/v1/templates`
- `update-template` -> `PUT /api/v1/templates/{id}`
- `delete-template` -> `DELETE /api/v1/templates/{id}`
- `reorder-templates` -> `POST /api/v1/templates/reorder`
- `get-template-files` -> `GET /api/v1/templates/{id}/files`
- `upload-template-files-dialog/upload-template-files-by-paths` -> `POST /api/v1/templates/{id}/files`
- `download-template-file` -> `GET /api/v1/template-files/{id}/download`
- `open-template-file` -> `GET /api/v1/template-files/{id}/open`
- `delete-template-file` -> `DELETE /api/v1/template-files/{id}`
- `get-template-file-preview` -> `GET /api/v1/template-files/{id}/preview`
- `get-template-file-counts` -> `GET /api/v1/template-files/counts`
- `get-instructions` -> `GET /api/v1/instructions`
- `get-instruction` -> `GET /api/v1/instructions/{id}`
- `create-instruction` -> `POST /api/v1/instructions`
- `update-instruction` -> `PUT /api/v1/instructions/{id}`
- `move-instruction` -> `POST /api/v1/instructions/{id}/move`
- `reorder-instructions` -> `POST /api/v1/instructions/reorder`
- `delete-instruction` -> `DELETE /api/v1/instructions/{id}`
- `duplicate-instruction` -> `POST /api/v1/instructions/{id}/duplicate`
- `toggle-instruction-favorite` -> `POST /api/v1/instructions/{id}/favorite-toggle`
- `update-instruction-tags` -> `PUT /api/v1/instructions/{id}/tags`
- `get-all-instruction-tags` -> `GET /api/v1/instructions/tags`
- `get-instruction-attachments` -> `GET /api/v1/instructions/{id}/attachments`
- `add-instruction-attachment` -> `POST /api/v1/instructions/{id}/attachments`
- `delete-instruction-attachment` -> `DELETE /api/v1/instruction-attachments/{id}`
- `get-instruction-attachment-preview` -> `GET /api/v1/instruction-attachments/{id}/preview`
- `open-instruction-attachment` -> `GET /api/v1/instruction-attachments/{id}/open`

---

## 7) Декомпозиция задач реализации

## Backend tasks

1. Добавить HTTP router `/api/v1` и middleware (auth, request_id, logging, recover, CORS).
2. Реализовать `requests` endpoints + summary + equipment status.
3. Реализовать `employee-exits` endpoints + summary.
4. Реализовать `templates` и `template-files` endpoints (multipart + download + preview).
5. Реализовать `instructions` и attachments endpoints.
6. Привести ошибки к единому формату `error.code/message/details/request_id`.
7. Добавить интеграционные тесты контрактов `v1`.

## Frontend tasks (web + desktop renderer)

1. Создать единый `apiClient` (`fetch` wrapper, auth header, error normalization).
2. Перевести hooks `useRequests`, `useEmployeeExits`, `useTemplates`, `useInstructions`, `useTemplateFiles` на `apiClient`.
3. Оставить `window.electronAPI` только для OS-level функций.
4. Обновить типы ответов под контракт `v1`.
5. Удалить/заморозить развитие `webElectronApi` как data-layer.

## Migration tasks

1. Временный adapter слой: IPC -> API для desktop переходного периода.
2. Фича-флаг переключения источника данных (`IPC` / `API`) в dev.
3. Подготовка импортера SQLite -> backend на следующем этапе.

---

## 8) Definition of Done Stage 2

Stage 2 завершён, когда:

- контракт `v1` утверждён и неизменяем для старта реализации;
- есть однозначный mapping IPC -> API;
- backend и frontend имеют разбивку задач по реализации;
- новые фичи не добавляются в локальный `webElectronApi` storage path.
