import { formatExitEquipmentList, parseExitEquipmentList } from './employeeExitEquipment'
import type {
  ApiResponse,
  CreateEmployeeExitData,
  CreateInstructionData,
  CreateRequestData,
  CreateTemplateData,
  EmployeeExit,
  EmployeeExitListParams,
  EmployeeExitSummary,
  EquipmentStatus,
  Instruction,
  InstructionAttachment,
  InstructionAttachmentPreview,
  MoveInstructionData,
  PaginatedEmployeeExitsResponse,
  PaginatedRequestsResponse,
  ReorderInstructionsData,
  Request,
  RequestListParams,
  RequestSummary,
  ScheduleRequestReturnData,
  Template,
  TemplateFile,
  TemplateFilePreview,
  UpdateInstructionData,
  UpdateRequestData,
  UpdateStatusPayload,
  UpdateTemplateData,
  WindowState,
} from '../types/ipc'

const STORAGE_KEY = 'equipment-tracker:web-db:v1'

type StoredTemplateFile = TemplateFile & {
  data_url: string
}

type StoredInstructionAttachment = InstructionAttachment & {
  data_url: string
}

type WebDatabase = {
  requests: Request[]
  employeeExits: EmployeeExit[]
  templates: Template[]
  templateFiles: StoredTemplateFile[]
  instructions: Instruction[]
  instructionAttachments: StoredInstructionAttachment[]
  counters: {
    requestId: number
    equipmentItemId: number
    employeeExitId: number
    templateId: number
    templateFileId: number
    instructionId: number
    instructionAttachmentId: number
  }
}

type BrowserFilePayload = {
  originalName: string
  mimeType: string
  fileSize: number
  dataUrl: string
}

const selectedFileCache = new Map<string, BrowserFilePayload>()

const emptyDb = (): WebDatabase => ({
  requests: [],
  employeeExits: [],
  templates: [],
  templateFiles: [],
  instructions: [],
  instructionAttachments: [],
  counters: {
    requestId: 1,
    equipmentItemId: 1,
    employeeExitId: 1,
    templateId: 1,
    templateFileId: 1,
    instructionId: 1,
    instructionAttachmentId: 1,
  },
})

const success = <T>(data?: T): ApiResponse<T> => ({
  success: true,
  ...(data !== undefined ? { data } : {}),
})
const failure = <T = unknown>(error: string): ApiResponse<T> => ({ success: false, error })

function safeClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function loadDb(): WebDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return emptyDb()
    }
    const parsed = JSON.parse(raw) as Partial<WebDatabase>
    const base = emptyDb()
    const next: WebDatabase = {
      ...base,
      ...parsed,
      requests: Array.isArray(parsed.requests) ? parsed.requests : base.requests,
      employeeExits: Array.isArray(parsed.employeeExits)
        ? parsed.employeeExits
        : base.employeeExits,
      templates: Array.isArray(parsed.templates) ? parsed.templates : base.templates,
      templateFiles: Array.isArray(parsed.templateFiles)
        ? parsed.templateFiles
        : base.templateFiles,
      instructions: Array.isArray(parsed.instructions) ? parsed.instructions : base.instructions,
      instructionAttachments: Array.isArray(parsed.instructionAttachments)
        ? parsed.instructionAttachments
        : base.instructionAttachments,
      counters: {
        ...base.counters,
        ...(parsed.counters ?? {}),
      },
    }
    return next
  } catch {
    return emptyDb()
  }
}

function saveDb(db: WebDatabase): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

function updateDb(mutator: (db: WebDatabase) => void): WebDatabase {
  const db = loadDb()
  mutator(db)
  saveDb(db)
  return db
}

function sanitizeSearch(search?: string): string {
  return (search ?? '').trim().toLowerCase()
}

function paginate<T>(items: T[], params?: { page?: number; pageSize?: number }) {
  const pageSize = Math.min(Math.max(params?.pageSize ?? 25, 5), 200)
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(params?.page ?? 1, 1), pageCount)
  const start = (page - 1) * pageSize
  const pageItems = items.slice(start, start + pageSize)

  return {
    items: pageItems,
    meta: {
      page,
      pageSize,
      total,
      pageCount,
      hasMore: page < pageCount,
    },
  }
}

function applyRequestStatusFilter(request: Request, status?: RequestListParams['status']): boolean {
  if (!status || status === 'all') return true
  if (status === 'issued') return request.is_issued === 1 && request.return_required !== 1
  if (status === 'not-issued') return request.is_issued === 0
  if (status === 'return-pending')
    return request.return_required === 1 && request.return_completed === 0
  if (status === 'return-completed')
    return request.return_required === 1 && request.return_completed === 1
  return true
}

function applyRequestSearchFilter(request: Request, search?: string): boolean {
  const term = sanitizeSearch(search)
  if (!term) return true

  const matchesRequest =
    request.employee_name.toLowerCase().includes(term) ||
    request.login.toLowerCase().includes(term) ||
    (request.sd_number ?? '').toLowerCase().includes(term)

  const matchesEquipment = request.equipment_items.some(
    (item) =>
      item.equipment_name.toLowerCase().includes(term) ||
      item.serial_number.toLowerCase().includes(term)
  )

  return matchesRequest || matchesEquipment
}

function applyExitStatusFilter(
  exit: EmployeeExit,
  status?: EmployeeExitListParams['status']
): boolean {
  if (!status || status === 'all') return true
  if (status === 'pending') return exit.is_completed === 0
  if (status === 'completed') return exit.is_completed === 1
  return true
}

function applyExitSearchFilter(exit: EmployeeExit, search?: string): boolean {
  const term = sanitizeSearch(search)
  if (!term) return true

  return (
    exit.employee_name.toLowerCase().includes(term) ||
    exit.login.toLowerCase().includes(term) ||
    (exit.sd_number ?? '').toLowerCase().includes(term) ||
    exit.exit_date.toLowerCase().includes(term) ||
    exit.equipment_list.toLowerCase().includes(term)
  )
}

function getSiblings(instructions: Instruction[], parentId: number | null) {
  return instructions
    .filter((item) => item.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order)
}

function getDescendantIds(instructions: Instruction[], rootId: number): number[] {
  const result: number[] = []
  const queue = [rootId]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue
    result.push(current)
    const children = instructions
      .filter((item) => item.parent_id === current)
      .map((item) => item.id)
    queue.push(...children)
  }

  return result
}

function normalizeInstructionTags(tags?: string[]): string[] {
  if (!tags) return []
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))]
}

function inferAppVersion(): string {
  const fromGlobal = (globalThis as { __APP_VERSION__?: string }).__APP_VERSION__
  if (typeof fromGlobal === 'string' && fromGlobal.trim().length > 0) {
    return fromGlobal
  }
  return 'web'
}

function createObjectDownload(content: BlobPart, contentType: string, filename: string): string {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return filename
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'))
    reader.readAsDataURL(file)
  })
}

async function pickFiles(options?: { multiple?: boolean }): Promise<File[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = options?.multiple ?? false
    input.onchange = () => {
      const files = input.files ? Array.from(input.files) : []
      resolve(files.length > 0 ? files : null)
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}

async function pickSingleFilePayload(): Promise<BrowserFilePayload | null> {
  const files = await pickFiles({ multiple: false })
  const file = files?.[0]
  if (!file) return null

  const dataUrl = await readFileAsDataUrl(file)
  return {
    originalName: file.name,
    mimeType: file.type || 'application/octet-stream',
    fileSize: file.size,
    dataUrl,
  }
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const match = /^data:(.*?);base64,(.*)$/.exec(dataUrl)
  if (!match) return null
  return { mimeType: match[1] || 'application/octet-stream', base64: match[2] }
}

function downloadDataUrl(dataUrl: string, fileName: string): void {
  const parsed = parseDataUrl(dataUrl)
  if (!parsed) {
    throw new Error('Неверный формат данных файла')
  }

  const bytes = Uint8Array.from(atob(parsed.base64), (char) => char.charCodeAt(0))
  createObjectDownload(bytes, parsed.mimeType, fileName)
}

function createWebElectronApi() {
  const updateListeners = new Set<(payload: UpdateStatusPayload) => void>()
  const windowStateListeners = new Set<(payload: WindowState) => void>()

  const emitUpdate = (payload: UpdateStatusPayload) => {
    for (const listener of updateListeners) {
      listener(payload)
    }
  }

  return {
    getAppVersion: () => inferAppVersion(),

    getWindowState: async (): Promise<ApiResponse<WindowState>> => success({ isMaximized: false }),
    minimizeWindow: async (): Promise<ApiResponse> => success(),
    toggleMaximizeWindow: async (): Promise<ApiResponse<{ isMaximized: boolean }>> =>
      success({ isMaximized: false }),
    closeWindow: async (): Promise<ApiResponse> => success(),
    onWindowStateChanged: (callback: (payload: WindowState) => void) => {
      windowStateListeners.add(callback)
      return () => windowStateListeners.delete(callback)
    },

    checkForUpdates: async (): Promise<ApiResponse> => {
      emitUpdate({
        event: 'checking-for-update',
        message: 'Проверка обновлений недоступна в веб-версии',
      })
      emitUpdate({
        event: 'update-not-available',
        message: 'Веб-версия обновляется через деплой сайта',
      })
      return success()
    },
    downloadUpdate: async (): Promise<ApiResponse> => failure('Недоступно в веб-версии'),
    installUpdate: async (): Promise<ApiResponse> => failure('Недоступно в веб-версии'),
    onUpdateStatus: (callback: (payload: UpdateStatusPayload) => void) => {
      updateListeners.add(callback)
      return () => updateListeners.delete(callback)
    },

    getRequests: async (
      params?: RequestListParams
    ): Promise<ApiResponse<PaginatedRequestsResponse>> => {
      const db = loadDb()
      const filtered = db.requests
        .filter((request) => applyRequestStatusFilter(request, params?.status))
        .filter((request) => applyRequestSearchFilter(request, params?.search))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))

      return success(paginate(filtered, params))
    },

    getRequestSummary: async (): Promise<ApiResponse<RequestSummary>> => {
      const db = loadDb()
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const summary: RequestSummary = {
        totals: {
          total: db.requests.length,
          issued: db.requests.filter((request) => request.is_issued === 1).length,
          notIssued: db.requests.filter((request) => request.is_issued === 0).length,
          returnPending: db.requests.filter(
            (request) => request.return_required === 1 && request.return_completed === 0
          ).length,
          returnCompleted: db.requests.filter(
            (request) => request.return_required === 1 && request.return_completed === 1
          ).length,
          thisMonth: db.requests.filter((request) => request.created_at >= monthStart).length,
        },
        returnEvents: db.requests
          .filter((request) => request.return_required === 1)
          .sort((a, b) => {
            const left = a.return_due_date ?? ''
            const right = b.return_due_date ?? ''
            if (left === right) return a.id - b.id
            return left.localeCompare(right)
          })
          .map((request) => ({
            id: request.id,
            employee_name: request.employee_name,
            login: request.login,
            sd_number: request.sd_number,
            return_due_date: request.return_due_date,
            return_equipment: request.return_equipment,
            return_completed: request.return_completed,
          })),
      }

      return success(summary)
    },

    createRequest: async (data: CreateRequestData): Promise<ApiResponse> => {
      let insertedId = 0
      updateDb((db) => {
        insertedId = db.counters.requestId++
        const now = new Date().toISOString()
        const request: Request = {
          id: insertedId,
          employee_name: data.employee_name.trim(),
          login: data.login.trim(),
          sd_number: data.sd_number?.trim() || null,
          delivery_url: data.delivery_url || null,
          created_at: now,
          is_issued: 0,
          issued_at: null,
          notes: data.notes?.trim() || null,
          return_required: 0,
          return_due_date: null,
          return_equipment: null,
          return_completed: 0,
          return_completed_at: null,
          return_scheduled_at: null,
          equipment_items: data.equipment_items.map((item) => ({
            id: db.counters.equipmentItemId++,
            equipment_name: item.equipment_name.trim(),
            serial_number: item.serial_number.trim(),
            quantity: item.quantity ?? 1,
            status: item.status ?? 'in_stock',
          })),
        }
        db.requests.push(request)
      })
      return { success: true, id: insertedId }
    },

    updateRequest: async (id: number, data: UpdateRequestData): Promise<ApiResponse> => {
      const db = updateDb((next) => {
        const index = next.requests.findIndex((item) => item.id === id)
        if (index < 0) return

        const previous = next.requests[index]
        next.requests[index] = {
          ...previous,
          employee_name: data.employee_name.trim(),
          login: data.login.trim(),
          sd_number: data.sd_number?.trim() || null,
          delivery_url: data.delivery_url || null,
          notes: data.notes?.trim() || null,
          equipment_items: data.equipment_items.map((item) => ({
            id: dbCounterId(next),
            equipment_name: item.equipment_name.trim(),
            serial_number: item.serial_number.trim(),
            quantity: item.quantity ?? 1,
            status: item.status ?? 'in_stock',
          })),
        }
      })

      const exists = db.requests.some((item) => item.id === id)
      return exists ? success() : failure('Заявка не найдена')
    },

    updateIssued: async (id: number, isIssued: boolean): Promise<ApiResponse> => {
      const now = new Date().toISOString()
      const db = updateDb((next) => {
        const request = next.requests.find((item) => item.id === id)
        if (!request) return
        request.is_issued = isIssued ? 1 : 0
        request.issued_at = isIssued ? now : null
      })

      return db.requests.some((item) => item.id === id) ? success() : failure('Заявка не найдена')
    },

    scheduleRequestReturn: async (
      id: number,
      data: ScheduleRequestReturnData
    ): Promise<ApiResponse> => {
      const now = new Date().toISOString()
      const db = updateDb((next) => {
        const request = next.requests.find((item) => item.id === id)
        if (!request) return
        request.return_required = 1
        request.return_due_date = data.due_date
        request.return_equipment = data.equipment.trim()
        request.return_completed = 0
        request.return_completed_at = null
        request.return_scheduled_at = now
      })

      return db.requests.some((item) => item.id === id) ? success() : failure('Заявка не найдена')
    },

    completeRequestReturn: async (id: number, completed: boolean): Promise<ApiResponse> => {
      const now = new Date().toISOString()
      const db = updateDb((next) => {
        const request = next.requests.find((item) => item.id === id)
        if (!request) return
        request.return_completed = completed ? 1 : 0
        request.return_completed_at = completed ? now : null
      })

      return db.requests.some((item) => item.id === id) ? success() : failure('Заявка не найдена')
    },

    cancelRequestReturn: async (id: number): Promise<ApiResponse> => {
      const db = updateDb((next) => {
        const request = next.requests.find((item) => item.id === id)
        if (!request) return
        request.return_required = 0
        request.return_due_date = null
        request.return_equipment = null
        request.return_completed = 0
        request.return_completed_at = null
        request.return_scheduled_at = null
      })

      return db.requests.some((item) => item.id === id) ? success() : failure('Заявка не найдена')
    },

    deleteRequest: async (id: number): Promise<ApiResponse<Request>> => {
      let deleted: Request | undefined
      updateDb((db) => {
        const index = db.requests.findIndex((item) => item.id === id)
        if (index < 0) return
        deleted = db.requests.splice(index, 1)[0]
      })

      return deleted ? success(deleted) : failure('Заявка не найдена')
    },

    restoreRequest: async (request: Request): Promise<ApiResponse> => {
      const db = updateDb((next) => {
        if (next.requests.some((item) => item.id === request.id)) {
          return
        }
        next.requests.push(safeClone(request))
        next.counters.requestId = Math.max(next.counters.requestId, request.id + 1)
        const maxEquipmentId = request.equipment_items.reduce(
          (max, item) => Math.max(max, item.id ?? 0),
          0
        )
        next.counters.equipmentItemId = Math.max(next.counters.equipmentItemId, maxEquipmentId + 1)
      })

      return db.requests.some((item) => item.id === request.id)
        ? success()
        : failure('Не удалось восстановить заявку')
    },

    updateEquipmentStatus: async (
      itemId: number,
      status: EquipmentStatus
    ): Promise<ApiResponse> => {
      let updated = false
      updateDb((db) => {
        for (const request of db.requests) {
          const item = request.equipment_items.find((equipment) => equipment.id === itemId)
          if (!item) continue
          item.status = status
          updated = true
          break
        }
      })

      return updated ? success() : failure('Оборудование не найдено')
    },

    createBackup: async (): Promise<ApiResponse<{ path: string }>> => {
      const db = loadDb()
      const filename = `equipment-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
      createObjectDownload(JSON.stringify(db, null, 2), 'application/json', filename)
      return success({ path: filename })
    },

    restoreBackup: async (): Promise<ApiResponse> => {
      const payload = await pickSingleFilePayload()
      if (!payload) {
        return failure('Отменено пользователем')
      }

      try {
        const [, rawBase64 = ''] = payload.dataUrl.split(',')
        const content = decodeURIComponent(escape(atob(rawBase64)))
        const parsed = JSON.parse(content) as WebDatabase
        saveDb({ ...emptyDb(), ...parsed })
        return success()
      } catch {
        return failure('Не удалось восстановить резервную копию')
      }
    },

    getEmployeeExits: async (
      params?: EmployeeExitListParams
    ): Promise<ApiResponse<PaginatedEmployeeExitsResponse>> => {
      const db = loadDb()
      const filtered = db.employeeExits
        .filter((item) => applyExitStatusFilter(item, params?.status))
        .filter((item) => applyExitSearchFilter(item, params?.search))
        .sort((a, b) => b.exit_date.localeCompare(a.exit_date))

      return success(paginate(filtered, params))
    },

    getEmployeeExitSummary: async (): Promise<ApiResponse<EmployeeExitSummary>> => {
      const db = loadDb()
      const completed = db.employeeExits.filter((item) => item.is_completed === 1).length

      return success({
        totals: {
          total: db.employeeExits.length,
          completed,
          pending: Math.max(0, db.employeeExits.length - completed),
        },
        exits: db.employeeExits
          .slice()
          .sort((a, b) => b.exit_date.localeCompare(a.exit_date))
          .map((item) => ({
            id: item.id,
            employee_name: item.employee_name,
            login: item.login,
            sd_number: item.sd_number,
            exit_date: item.exit_date,
            equipment_list: item.equipment_list,
            created_at: item.created_at,
            is_completed: item.is_completed,
          })),
      })
    },

    createEmployeeExit: async (data: CreateEmployeeExitData): Promise<ApiResponse> => {
      let insertedId = 0
      updateDb((db) => {
        insertedId = db.counters.employeeExitId++
        db.employeeExits.push({
          id: insertedId,
          employee_name: data.employee_name.trim(),
          login: data.login.trim(),
          sd_number: data.sd_number?.trim() || null,
          delivery_url: data.delivery_url || null,
          exit_date: data.exit_date.trim(),
          equipment_list: data.equipment_list,
          created_at: new Date().toISOString(),
          is_completed: 0,
        })
      })
      return { success: true, id: insertedId }
    },

    updateEmployeeExit: async (id: number, data: CreateEmployeeExitData): Promise<ApiResponse> => {
      const db = updateDb((next) => {
        const exit = next.employeeExits.find((item) => item.id === id)
        if (!exit) return
        exit.employee_name = data.employee_name.trim()
        exit.login = data.login.trim()
        exit.sd_number = data.sd_number?.trim() || null
        exit.delivery_url = data.delivery_url || null
        exit.exit_date = data.exit_date.trim()
        exit.equipment_list = data.equipment_list
      })

      return db.employeeExits.some((item) => item.id === id)
        ? success()
        : failure('Запись не найдена')
    },

    deleteEmployeeExit: async (id: number): Promise<ApiResponse<EmployeeExit>> => {
      let deleted: EmployeeExit | undefined
      updateDb((db) => {
        const index = db.employeeExits.findIndex((item) => item.id === id)
        if (index < 0) return
        deleted = db.employeeExits.splice(index, 1)[0]
      })

      return deleted ? success(deleted) : failure('Запись не найдена')
    },

    restoreEmployeeExit: async (exit: EmployeeExit): Promise<ApiResponse> => {
      const db = updateDb((next) => {
        if (next.employeeExits.some((item) => item.id === exit.id)) {
          return
        }
        next.employeeExits.push(safeClone(exit))
        next.counters.employeeExitId = Math.max(next.counters.employeeExitId, exit.id + 1)
      })

      return db.employeeExits.some((item) => item.id === exit.id)
        ? success()
        : failure('Не удалось восстановить запись')
    },

    updateExitCompleted: async (id: number, isCompleted: boolean): Promise<ApiResponse> => {
      const db = updateDb((next) => {
        const exit = next.employeeExits.find((item) => item.id === id)
        if (!exit) return
        exit.is_completed = isCompleted ? 1 : 0
      })

      return db.employeeExits.some((item) => item.id === id)
        ? success()
        : failure('Запись не найдена')
    },

    updateExitEquipmentStatus: async (
      exitId: number,
      equipmentIndex: number,
      status: EquipmentStatus
    ): Promise<ApiResponse> => {
      let found = false
      updateDb((db) => {
        const exit = db.employeeExits.find((item) => item.id === exitId)
        if (!exit) return
        const parsed = parseExitEquipmentList(exit.equipment_list)
        if (equipmentIndex < 0 || equipmentIndex >= parsed.length) return
        parsed[equipmentIndex].status = status
        exit.equipment_list = formatExitEquipmentList(parsed)
        found = true
      })

      return found ? success() : failure('Не удалось обновить статус оборудования')
    },

    exportEmployeeExits: async (exits: EmployeeExit[]): Promise<ApiResponse<{ path: string }>> => {
      const headers = [
        'ID',
        'Сотрудник',
        'Логин',
        'Номер SD',
        'Дата выхода',
        'Статус',
        'Создано',
        'Оборудование',
      ]

      const escapeCsv = (value: string | number | null | undefined): string => {
        if (value === null || value === undefined) return ''
        const normalized = String(value).replace(/\r?\n/g, ' ')
        return /[",\n]/.test(normalized) ? `"${normalized.replace(/"/g, '""')}"` : normalized
      }

      const rows = exits.map((exit) => [
        exit.id,
        exit.employee_name,
        exit.login,
        exit.sd_number ?? '',
        exit.exit_date,
        exit.is_completed === 1 ? 'Завершено' : 'Ожидает',
        exit.created_at,
        exit.equipment_list,
      ])

      const csv = [headers, ...rows]
        .map((row) => row.map((value) => escapeCsv(value)).join(','))
        .join('\n')
      const filename = `employee-exits-${new Date().toISOString().slice(0, 10)}.csv`
      createObjectDownload(csv, 'text/csv;charset=utf-8', filename)
      return success({ path: filename })
    },

    getTemplates: async (): Promise<ApiResponse<Template[]>> => {
      const db = loadDb()
      const data = db.templates.slice().sort((a, b) => a.sort_order - b.sort_order)
      return success(data)
    },

    createTemplate: async (data: CreateTemplateData): Promise<ApiResponse<Template>> => {
      let created: Template | null = null
      updateDb((db) => {
        const id = db.counters.templateId++
        const now = new Date().toISOString()
        created = {
          id,
          title: data.title.trim(),
          content: data.content.trim(),
          created_at: now,
          updated_at: now,
          sort_order: db.templates.length,
        }
        db.templates.push(created)
      })

      return created ? success(created) : failure('Не удалось создать шаблон')
    },

    updateTemplate: async (
      id: number,
      data: UpdateTemplateData
    ): Promise<ApiResponse<Template>> => {
      let updated: Template | undefined
      updateDb((db) => {
        const template = db.templates.find((item) => item.id === id)
        if (!template) return
        template.title = data.title.trim()
        template.content = data.content.trim()
        template.updated_at = new Date().toISOString()
        updated = safeClone(template)
      })

      return updated ? success(updated) : failure('Шаблон не найден')
    },

    deleteTemplate: async (id: number): Promise<ApiResponse<Template>> => {
      let removed: Template | undefined
      updateDb((db) => {
        const index = db.templates.findIndex((item) => item.id === id)
        if (index < 0) return
        removed = db.templates.splice(index, 1)[0]
        db.templateFiles = db.templateFiles.filter((file) => file.template_id !== id)
      })

      return removed ? success(removed) : failure('Шаблон не найден')
    },

    reorderTemplates: async (order: number[]): Promise<ApiResponse> => {
      updateDb((db) => {
        order.forEach((id, index) => {
          const template = db.templates.find((item) => item.id === id)
          if (template) {
            template.sort_order = index
            template.updated_at = new Date().toISOString()
          }
        })
      })

      return success()
    },

    getTemplateFiles: async (templateId: number): Promise<ApiResponse<TemplateFile[]>> => {
      const db = loadDb()
      const files = db.templateFiles
        .filter((file) => file.template_id === templateId)
        .map((file) => ({
          id: file.id,
          template_id: file.template_id,
          filename: file.filename,
          original_name: file.original_name,
          file_size: file.file_size,
          mime_type: file.mime_type,
          created_at: file.created_at,
        }))
      return success(files)
    },

    uploadTemplateFilesDialog: async (templateId: number): Promise<ApiResponse<TemplateFile[]>> => {
      const files = await pickFiles({ multiple: true })
      if (!files || files.length === 0) {
        return success([])
      }

      const now = new Date().toISOString()
      const createdFiles: TemplateFile[] = []
      const filePayloads = await Promise.all(
        files.map(async (file) => ({
          original_name: file.name,
          mime_type: file.type || 'application/octet-stream',
          file_size: file.size,
          data_url: await readFileAsDataUrl(file),
        }))
      )

      updateDb((db) => {
        for (const payload of filePayloads) {
          const id = db.counters.templateFileId++
          const stored: StoredTemplateFile = {
            id,
            template_id: templateId,
            filename: payload.original_name,
            original_name: payload.original_name,
            file_size: payload.file_size,
            mime_type: payload.mime_type,
            created_at: now,
            data_url: payload.data_url,
          }
          db.templateFiles.push(stored)
          createdFiles.push({
            id,
            template_id: templateId,
            filename: stored.filename,
            original_name: stored.original_name,
            file_size: stored.file_size,
            mime_type: stored.mime_type,
            created_at: now,
          })
        }
      })

      return success(createdFiles)
    },

    uploadTemplateFilesByPaths: async (): Promise<ApiResponse<TemplateFile[]>> =>
      failure('Загрузка по путям недоступна в веб-версии'),

    downloadTemplateFile: async (fileId: number): Promise<ApiResponse<{ path: string }>> => {
      const db = loadDb()
      const file = db.templateFiles.find((item) => item.id === fileId)
      if (!file) return failure('Файл не найден')

      downloadDataUrl(file.data_url, file.original_name)
      return success({ path: file.original_name })
    },

    openTemplateFile: async (fileId: number): Promise<ApiResponse> => {
      const db = loadDb()
      const file = db.templateFiles.find((item) => item.id === fileId)
      if (!file) return failure('Файл не найден')

      window.open(file.data_url, '_blank', 'noopener,noreferrer')
      return success()
    },

    deleteTemplateFile: async (fileId: number): Promise<ApiResponse<TemplateFile>> => {
      let removed: StoredTemplateFile | undefined
      updateDb((db) => {
        const index = db.templateFiles.findIndex((item) => item.id === fileId)
        if (index < 0) return
        removed = db.templateFiles.splice(index, 1)[0]
      })

      if (!removed) return failure('Файл не найден')
      return success({
        id: removed.id,
        template_id: removed.template_id,
        filename: removed.filename,
        original_name: removed.original_name,
        file_size: removed.file_size,
        mime_type: removed.mime_type,
        created_at: removed.created_at,
      })
    },

    getTemplateFilePreview: async (fileId: number): Promise<ApiResponse<TemplateFilePreview>> => {
      const db = loadDb()
      const file = db.templateFiles.find((item) => item.id === fileId)
      if (!file) return failure('Файл не найден')
      if (!file.mime_type.startsWith('image/')) {
        return failure('Предпросмотр доступен только для изображений')
      }

      return success({
        file_id: file.id,
        original_name: file.original_name,
        mime_type: file.mime_type,
        data_url: file.data_url,
      })
    },

    getTemplateFileCounts: async (): Promise<ApiResponse<Record<number, number>>> => {
      const db = loadDb()
      const counts = db.templateFiles.reduce<Record<number, number>>((acc, file) => {
        acc[file.template_id] = (acc[file.template_id] ?? 0) + 1
        return acc
      }, {})
      return success(counts)
    },

    openExternal: async (url: string): Promise<ApiResponse> => {
      const newTab = window.open(url, '_blank', 'noopener,noreferrer')
      return newTab ? success() : failure('Не удалось открыть ссылку')
    },

    getInstructions: async (): Promise<ApiResponse<Instruction[]>> => {
      const db = loadDb()
      return success(db.instructions.slice().sort((a, b) => a.sort_order - b.sort_order))
    },

    getInstruction: async (id: number): Promise<ApiResponse<Instruction>> => {
      const db = loadDb()
      const instruction = db.instructions.find((item) => item.id === id)
      return instruction ? success(safeClone(instruction)) : failure('Инструкция не найдена')
    },

    createInstruction: async (data: CreateInstructionData): Promise<ApiResponse<Instruction>> => {
      let created: Instruction | undefined
      updateDb((db) => {
        const id = db.counters.instructionId++
        const now = new Date().toISOString()
        const parentId = data.parent_id ?? null
        const siblings = getSiblings(db.instructions, parentId)

        created = {
          id,
          parent_id: parentId,
          title: data.title.trim(),
          content: data.content ?? '',
          sort_order: siblings.length,
          is_folder: data.is_folder ? 1 : 0,
          is_favorite: 0,
          tags: normalizeInstructionTags(data.tags),
          created_at: now,
          updated_at: now,
        }

        db.instructions.push(created)
      })

      return created ? success(created) : failure('Не удалось создать инструкцию')
    },

    updateInstruction: async (
      id: number,
      data: UpdateInstructionData
    ): Promise<ApiResponse<Instruction>> => {
      let updated: Instruction | undefined
      updateDb((db) => {
        const instruction = db.instructions.find((item) => item.id === id)
        if (!instruction) return
        if (data.title !== undefined) instruction.title = data.title.trim()
        if (data.content !== undefined) instruction.content = data.content
        if (data.is_folder !== undefined) instruction.is_folder = data.is_folder ? 1 : 0
        if (data.tags !== undefined) instruction.tags = normalizeInstructionTags(data.tags)
        instruction.updated_at = new Date().toISOString()
        updated = safeClone(instruction)
      })

      return updated ? success(updated) : failure('Инструкция не найдена')
    },

    moveInstruction: async (
      id: number,
      data: MoveInstructionData
    ): Promise<ApiResponse<Instruction>> => {
      let moved: Instruction | undefined
      updateDb((db) => {
        const instruction = db.instructions.find((item) => item.id === id)
        if (!instruction) return
        instruction.parent_id = data.parent_id
        instruction.sort_order = data.sort_order
        instruction.updated_at = new Date().toISOString()
        moved = safeClone(instruction)
      })

      return moved ? success(moved) : failure('Инструкция не найдена')
    },

    reorderInstructions: async (data: ReorderInstructionsData): Promise<ApiResponse> => {
      updateDb((db) => {
        data.order.forEach((id, index) => {
          const instruction = db.instructions.find((item) => item.id === id)
          if (!instruction) return
          instruction.parent_id = data.parent_id
          instruction.sort_order = index
          instruction.updated_at = new Date().toISOString()
        })
      })

      return success()
    },

    deleteInstruction: async (id: number): Promise<ApiResponse<Instruction>> => {
      const db = loadDb()
      const target = db.instructions.find((item) => item.id === id)
      if (!target) return failure('Инструкция не найдена')

      const descendants = new Set(getDescendantIds(db.instructions, id))

      updateDb((next) => {
        next.instructions = next.instructions.filter((item) => !descendants.has(item.id))
        next.instructionAttachments = next.instructionAttachments.filter(
          (item) => !descendants.has(item.instruction_id)
        )
      })

      return success(target)
    },

    duplicateInstruction: async (id: number): Promise<ApiResponse<Instruction>> => {
      const sourceDb = loadDb()
      const source = sourceDb.instructions.find((item) => item.id === id)
      if (!source) return failure('Инструкция не найдена')

      const descendants = getDescendantIds(sourceDb.instructions, id)
      const sourceNodes = sourceDb.instructions.filter((item) => descendants.includes(item.id))
      const map = new Map<number, number>()
      let rootCopy: Instruction | undefined

      updateDb((db) => {
        const now = new Date().toISOString()
        const createCopy = (node: Instruction) => {
          const newId = db.counters.instructionId++
          map.set(node.id, newId)

          const copy: Instruction = {
            ...safeClone(node),
            id: newId,
            parent_id: node.parent_id === null ? null : (map.get(node.parent_id) ?? node.parent_id),
            title: node.id === id ? `${node.title} (копия)` : node.title,
            created_at: now,
            updated_at: now,
          }

          db.instructions.push(copy)
          if (node.id === id) {
            rootCopy = safeClone(copy)
          }
        }

        createCopy(source)
        const queue = sourceNodes.filter((node) => node.id !== id)
        queue.sort((a, b) => a.sort_order - b.sort_order)
        for (const node of queue) {
          createCopy(node)
        }
      })

      return rootCopy ? success(rootCopy) : failure('Не удалось скопировать инструкцию')
    },

    toggleInstructionFavorite: async (id: number): Promise<ApiResponse<Instruction>> => {
      let updated: Instruction | undefined
      updateDb((db) => {
        const instruction = db.instructions.find((item) => item.id === id)
        if (!instruction) return
        instruction.is_favorite = instruction.is_favorite === 1 ? 0 : 1
        instruction.updated_at = new Date().toISOString()
        updated = safeClone(instruction)
      })

      return updated ? success(updated) : failure('Инструкция не найдена')
    },

    updateInstructionTags: async (
      id: number,
      tags: string[]
    ): Promise<ApiResponse<Instruction>> => {
      let updated: Instruction | undefined
      updateDb((db) => {
        const instruction = db.instructions.find((item) => item.id === id)
        if (!instruction) return
        instruction.tags = normalizeInstructionTags(tags)
        instruction.updated_at = new Date().toISOString()
        updated = safeClone(instruction)
      })

      return updated ? success(updated) : failure('Инструкция не найдена')
    },

    getAllInstructionTags: async (): Promise<ApiResponse<string[]>> => {
      const db = loadDb()
      const tags = [...new Set(db.instructions.flatMap((item) => item.tags ?? []))]
      return success(tags.sort((a, b) => a.localeCompare(b, 'ru')))
    },

    getInstructionAttachments: async (
      instructionId: number
    ): Promise<ApiResponse<InstructionAttachment[]>> => {
      const db = loadDb()
      const attachments = db.instructionAttachments
        .filter((item) => item.instruction_id === instructionId)
        .map((item) => ({
          id: item.id,
          instruction_id: item.instruction_id,
          filename: item.filename,
          original_name: item.original_name,
          file_size: item.file_size,
          mime_type: item.mime_type,
          created_at: item.created_at,
        }))
      return success(attachments)
    },

    addInstructionAttachment: async (
      instructionId: number,
      filePath: string
    ): Promise<ApiResponse<InstructionAttachment>> => {
      const cached = selectedFileCache.get(filePath)
      if (!cached) {
        return failure('Выберите файл заново')
      }

      let created: InstructionAttachment | undefined
      updateDb((db) => {
        const id = db.counters.instructionAttachmentId++
        const now = new Date().toISOString()
        db.instructionAttachments.push({
          id,
          instruction_id: instructionId,
          filename: cached.originalName,
          original_name: cached.originalName,
          file_size: cached.fileSize,
          mime_type: cached.mimeType,
          created_at: now,
          data_url: cached.dataUrl,
        })
        created = {
          id,
          instruction_id: instructionId,
          filename: cached.originalName,
          original_name: cached.originalName,
          file_size: cached.fileSize,
          mime_type: cached.mimeType,
          created_at: now,
        }
      })

      selectedFileCache.delete(filePath)
      return created ? success(created) : failure('Не удалось добавить файл')
    },

    deleteInstructionAttachment: async (attachmentId: number): Promise<ApiResponse> => {
      let removed = false
      updateDb((db) => {
        const sizeBefore = db.instructionAttachments.length
        db.instructionAttachments = db.instructionAttachments.filter(
          (item) => item.id !== attachmentId
        )
        removed = db.instructionAttachments.length !== sizeBefore
      })

      return removed ? success() : failure('Вложение не найдено')
    },

    getInstructionAttachmentPreview: async (
      attachmentId: number
    ): Promise<ApiResponse<InstructionAttachmentPreview>> => {
      const db = loadDb()
      const attachment = db.instructionAttachments.find((item) => item.id === attachmentId)
      if (!attachment) return failure('Вложение не найдено')
      if (!attachment.mime_type.startsWith('image/')) {
        return failure('Предпросмотр доступен только для изображений')
      }

      return success({
        attachment_id: attachment.id,
        original_name: attachment.original_name,
        mime_type: attachment.mime_type,
        data_url: attachment.data_url,
      })
    },

    openInstructionAttachment: async (attachmentId: number): Promise<ApiResponse> => {
      const db = loadDb()
      const attachment = db.instructionAttachments.find((item) => item.id === attachmentId)
      if (!attachment) return failure('Вложение не найдено')

      window.open(attachment.data_url, '_blank', 'noopener,noreferrer')
      return success()
    },

    selectInstructionAttachmentFile: async (): Promise<ApiResponse<string | null>> => {
      const payload = await pickSingleFilePayload()
      if (!payload) {
        return success(null)
      }

      const token = `web-file://${crypto.randomUUID()}`
      selectedFileCache.set(token, payload)
      return success(token)
    },
  }
}

function dbCounterId(db: WebDatabase): number {
  const id = db.counters.equipmentItemId
  db.counters.equipmentItemId += 1
  return id
}

export function ensureElectronApiBridge(): void {
  if (typeof window === 'undefined') {
    return
  }

  if (window.electronAPI) {
    return
  }

  window.electronAPI = createWebElectronApi()
}
