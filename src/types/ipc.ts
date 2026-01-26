import { z } from 'zod'

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const optionalHttpUrlSchema = z
  .string()
  .trim()
  .optional()
  .transform((value: string | undefined) => (value && value.length > 0 ? value : undefined))
  .refine((value) => value === undefined || isHttpUrl(value), {
    message: 'Некорректная ссылка. Используйте http:// или https://',
  })

export const openExternalUrlSchema = z
  .string()
  .trim()
  .min(1, 'Ссылка обязательна')
  .refine((value) => isHttpUrl(value), {
    message: 'Некорректная ссылка. Используйте http:// или https://',
  })

export const requestIdSchema = z.number().int().positive()
export const issuedStatusSchema = z.boolean()

export const requestStatusFilterSchema = z.enum([
  'all',
  'issued',
  'not-issued',
  'return-pending',
  'return-completed',
])

export const employeeExitStatusFilterSchema = z.enum(['all', 'pending', 'completed'])

export const createTemplateSchema = z.object({
  title: z.string().trim().min(1, 'Название шаблона обязательно'),
  content: z.string().trim().min(1, 'Содержимое шаблона обязательно'),
})

export const updateTemplateSchema = createTemplateSchema

export const templateRecordSchema = createTemplateSchema.extend({
  id: z.number().int().positive(),
  created_at: z.string(),
  updated_at: z.string(),
  sort_order: z.number().int(),
})

export const reorderTemplatesSchema = z.object({
  order: z.array(z.number().int().positive()).min(1),
})

// Схема для файлов шаблонов
export const templateFileRecordSchema = z.object({
  id: z.number().int().positive(),
  template_id: z.number().int().positive(),
  filename: z.string(),
  original_name: z.string(),
  file_size: z.number().int().nonnegative(),
  mime_type: z.string(),
  created_at: z.string(),
})

export const equipmentItemInputSchema = z.object({
  equipment_name: z.string().trim().min(1, 'Название оборудования обязательно'),
  serial_number: z.string().trim().min(1, 'Серийный номер обязателен'),
  quantity: z.coerce.number().int().positive().default(1),
})

export const equipmentItemRecordSchema = equipmentItemInputSchema.extend({
  id: z.number().int().positive().optional(),
})

export const createRequestSchema = z.object({
  employee_name: z.string().trim().min(1, 'ФИО обязательно'),
  login: z.string().trim().min(1, 'Логин обязателен'),
  sd_number: z.string().trim().max(120, 'Номер SD слишком длинный').optional(),
  delivery_url: optionalHttpUrlSchema,
  notes: z
    .string()
    .trim()
    .optional()
    .transform((value: string | undefined) => (value && value.length > 0 ? value : undefined)),
  equipment_items: z.array(equipmentItemInputSchema).min(1, 'Добавьте хотя бы одну позицию'),
})

export const updateRequestSchema = createRequestSchema

export const requestRecordSchema = z.object({
  id: requestIdSchema,
  employee_name: z.string(),
  login: z.string(),
  sd_number: z.string().nullable(),
  delivery_url: z.string().nullable().default(null),
  created_at: z.string(),
  is_issued: z.number().int(),
  issued_at: z.string().nullable(),
  notes: z.string().nullable(),
  return_required: z.number().int().default(0),
  return_due_date: z.string().nullable().default(null),
  return_equipment: z.string().nullable().default(null),
  return_completed: z.number().int().default(0),
  return_completed_at: z.string().nullable().default(null),
  return_scheduled_at: z.string().nullable().default(null),
  equipment_items: z.array(
    equipmentItemRecordSchema.pick({
      id: true,
      equipment_name: true,
      serial_number: true,
      quantity: true,
    })
  ),
})

export const restoreRequestSchema = requestRecordSchema

export const scheduleRequestReturnSchema = z.object({
  due_date: z
    .string()
    .trim()
    .min(1, 'Дата сдачи обязательна')
    .regex(/\d{4}-\d{2}-\d{2}/, 'Дата должна быть в формате ГГГГ-ММ-ДД'),
  equipment: z.string().trim().min(1, 'Укажите оборудование, которое нужно сдать'),
})

export const createEmployeeExitSchema = z.object({
  employee_name: z.string().trim().min(1, 'ФИО обязательно'),
  login: z.string().trim().min(1, 'Логин обязателен'),
  sd_number: z.string().trim().max(120, 'Номер SD слишком длинный').optional(),
  delivery_url: optionalHttpUrlSchema,
  exit_date: z.string().trim().min(1, 'Дата выхода обязательна'),
  equipment_list: z.string().trim().min(1, 'Список оборудования обязателен'),
})

export const employeeExitRecordSchema = createEmployeeExitSchema.extend({
  id: z.number().int().positive(),
  created_at: z.string(),
  is_completed: z.number().int(),
  sd_number: z.string().nullable(),
  delivery_url: z.string().nullable().default(null),
})

export const restoreEmployeeExitSchema = employeeExitRecordSchema

export const updateExitCompletedSchema = z.object({
  id: requestIdSchema,
  is_completed: z.boolean(),
})

export const paginationParamsSchema = z.object({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(5).max(200).optional(),
})

export const paginatedRequestQuerySchema = paginationParamsSchema.extend({
  search: z.string().trim().min(1).optional(),
  status: requestStatusFilterSchema.optional(),
})

export const paginatedEmployeeExitQuerySchema = paginationParamsSchema.extend({
  search: z.string().trim().min(1).optional(),
  status: employeeExitStatusFilterSchema.optional(),
})

export const paginatedResponseMetaSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  pageCount: z.number().int().min(0),
  hasMore: z.boolean(),
})

export const paginatedRequestsResponseSchema = z.object({
  items: z.array(requestRecordSchema),
  meta: paginatedResponseMetaSchema,
})

export const paginatedEmployeeExitsResponseSchema = z.object({
  items: z.array(employeeExitRecordSchema),
  meta: paginatedResponseMetaSchema,
})

export const requestSummarySchema = z.object({
  totals: z.object({
    total: z.number().int().min(0),
    issued: z.number().int().min(0),
    notIssued: z.number().int().min(0),
    returnPending: z.number().int().min(0),
    returnCompleted: z.number().int().min(0),
    thisMonth: z.number().int().min(0),
  }),
  returnEvents: z.array(
    z.object({
      id: z.number().int().positive(),
      employee_name: z.string(),
      login: z.string(),
      sd_number: z.string().nullable(),
      return_due_date: z.string().nullable(),
      return_equipment: z.string().nullable(),
      return_completed: z.number().int(),
    })
  ),
})

export const employeeExitSummarySchema = z.object({
  totals: z.object({
    total: z.number().int().min(0),
    completed: z.number().int().min(0),
    pending: z.number().int().min(0),
  }),
  exits: z.array(
    employeeExitRecordSchema.pick({
      id: true,
      employee_name: true,
      login: true,
      sd_number: true,
      exit_date: true,
      equipment_list: true,
      created_at: true,
      is_completed: true,
    })
  ),
})

export type EquipmentItemInput = z.infer<typeof equipmentItemInputSchema>
export type EquipmentItem = z.infer<typeof equipmentItemRecordSchema>
export type CreateRequestData = z.infer<typeof createRequestSchema>
export type UpdateRequestData = z.infer<typeof updateRequestSchema>
export type Request = z.infer<typeof requestRecordSchema>
export type ScheduleRequestReturnData = z.infer<typeof scheduleRequestReturnSchema>
export type CreateEmployeeExitData = z.infer<typeof createEmployeeExitSchema>
export type EmployeeExit = z.infer<typeof employeeExitRecordSchema>
export type RequestStatusFilter = z.infer<typeof requestStatusFilterSchema>
export type EmployeeExitStatusFilter = z.infer<typeof employeeExitStatusFilterSchema>
export type RequestListParams = z.infer<typeof paginatedRequestQuerySchema>
export type EmployeeExitListParams = z.infer<typeof paginatedEmployeeExitQuerySchema>

export interface PaginatedData<T> {
  items: T[]
  meta: {
    page: number
    pageSize: number
    total: number
    pageCount: number
    hasMore: boolean
  }
}

export type PaginatedRequestsResponse = z.infer<typeof paginatedRequestsResponseSchema>
export type PaginatedEmployeeExitsResponse = z.infer<typeof paginatedEmployeeExitsResponseSchema>
export type RequestSummary = z.infer<typeof requestSummarySchema>
export type EmployeeExitSummary = z.infer<typeof employeeExitSummarySchema>
export type RequestReturnEvent = RequestSummary['returnEvents'][number]
export type CreateTemplateData = z.infer<typeof createTemplateSchema>
export type UpdateTemplateData = z.infer<typeof updateTemplateSchema>
export type Template = z.infer<typeof templateRecordSchema>
export type TemplateFile = z.infer<typeof templateFileRecordSchema>
export type ReorderTemplatesData = z.infer<typeof reorderTemplatesSchema>

// === Instructions (древовидная структура) ===
export const createInstructionSchema = z.object({
  parent_id: z.number().int().positive().nullable().optional(),
  title: z.string().trim().min(1, 'Название обязательно'),
  content: z.string().trim().optional().default(''),
  is_folder: z.boolean().optional().default(false),
})

export const updateInstructionSchema = z.object({
  title: z.string().trim().min(1, 'Название обязательно').optional(),
  content: z.string().trim().optional(),
  is_folder: z.boolean().optional(),
})

export const moveInstructionSchema = z.object({
  parent_id: z.number().int().positive().nullable(),
  sort_order: z.number().int().min(0),
})

export const instructionRecordSchema = z.object({
  id: z.number().int().positive(),
  parent_id: z.number().int().positive().nullable(),
  title: z.string(),
  content: z.string(),
  sort_order: z.number().int(),
  is_folder: z.number().int(), // 1 = папка, 0 = документ
  created_at: z.string(),
  updated_at: z.string(),
})

export const reorderInstructionsSchema = z.object({
  parent_id: z.number().int().positive().nullable(),
  order: z.array(z.number().int().positive()).min(1),
})

export type CreateInstructionData = z.infer<typeof createInstructionSchema>
export type UpdateInstructionData = z.infer<typeof updateInstructionSchema>
export type MoveInstructionData = z.infer<typeof moveInstructionSchema>
export type Instruction = z.infer<typeof instructionRecordSchema>
export type ReorderInstructionsData = z.infer<typeof reorderInstructionsSchema>

export interface InstructionTreeNode extends Instruction {
  children: InstructionTreeNode[]
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  id?: number
}

export interface UpdateStatusPayload {
  event: string
  message: string
  data?: Record<string, unknown>
}

export const windowStateSchema = z.object({
  isMaximized: z.boolean(),
})

export type WindowState = z.infer<typeof windowStateSchema>
