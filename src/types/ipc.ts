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
  created_at: z.string(),
  is_issued: z.number().int(),
  issued_at: z.string().nullable(),
  notes: z.string().nullable(),
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

export const createEmployeeExitSchema = z.object({
  employee_name: z.string().trim().min(1, 'ФИО обязательно'),
  login: z.string().trim().min(1, 'Логин обязателен'),
  exit_date: z.string().trim().min(1, 'Дата выхода обязательна'),
  equipment_list: z.string().trim().min(1, 'Список оборудования обязателен'),
})

export const employeeExitRecordSchema = createEmployeeExitSchema.extend({
  id: z.number().int().positive(),
  created_at: z.string(),
  is_completed: z.number().int(),
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
export type CreateEmployeeExitData = z.infer<typeof createEmployeeExitSchema>
export type EmployeeExit = z.infer<typeof employeeExitRecordSchema>

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  id?: number
}
