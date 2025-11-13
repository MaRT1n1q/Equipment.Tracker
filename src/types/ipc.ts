import { z } from 'zod'

export const requestIdSchema = z.number().int().positive()
export const issuedStatusSchema = z.boolean()

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
  exit_date: z.string().trim().min(1, 'Дата выхода обязательна'),
  equipment_list: z.string().trim().min(1, 'Список оборудования обязателен'),
})

export const employeeExitRecordSchema = createEmployeeExitSchema.extend({
  id: z.number().int().positive(),
  created_at: z.string(),
  is_completed: z.number().int(),
  sd_number: z.string().nullable(),
})

export const updateExitCompletedSchema = z.object({
  id: requestIdSchema,
  is_completed: z.boolean(),
})

export type EquipmentItemInput = z.infer<typeof equipmentItemInputSchema>
export type EquipmentItem = z.infer<typeof equipmentItemRecordSchema>
export type CreateRequestData = z.infer<typeof createRequestSchema>
export type UpdateRequestData = z.infer<typeof updateRequestSchema>
export type Request = z.infer<typeof requestRecordSchema>
export type ScheduleRequestReturnData = z.infer<typeof scheduleRequestReturnSchema>
export type CreateEmployeeExitData = z.infer<typeof createEmployeeExitSchema>
export type EmployeeExit = z.infer<typeof employeeExitRecordSchema>

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
