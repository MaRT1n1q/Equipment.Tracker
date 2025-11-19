import { describe, it, expect } from 'vitest'
import {
  createRequestSchema,
  equipmentItemInputSchema,
  scheduleRequestReturnSchema,
  createEmployeeExitSchema,
  paginatedRequestQuerySchema,
  createTemplateSchema,
} from './ipc'

describe('IPC Schemas', () => {
  describe('equipmentItemInputSchema', () => {
    it('должен валидировать корректный элемент оборудования', () => {
      const validItem = {
        equipment_name: 'Ноутбук',
        serial_number: 'SN123',
        quantity: 1,
      }

      const result = equipmentItemInputSchema.safeParse(validItem)
      expect(result.success).toBe(true)
    })

    it('должен отклонять элемент с пустым названием', () => {
      const invalidItem = {
        equipment_name: '',
        serial_number: 'SN123',
        quantity: 1,
      }

      const result = equipmentItemInputSchema.safeParse(invalidItem)
      expect(result.success).toBe(false)
    })

    it('должен отклонять элемент с пустым серийным номером', () => {
      const invalidItem = {
        equipment_name: 'Ноутбук',
        serial_number: '',
        quantity: 1,
      }

      const result = equipmentItemInputSchema.safeParse(invalidItem)
      expect(result.success).toBe(false)
    })

    it('должен приводить quantity к числу', () => {
      const item = {
        equipment_name: 'Ноутбук',
        serial_number: 'SN123',
        quantity: '5',
      }

      const result = equipmentItemInputSchema.safeParse(item)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.quantity).toBe(5)
      }
    })

    it('должен использовать дефолтное quantity=1', () => {
      const item = {
        equipment_name: 'Ноутбук',
        serial_number: 'SN123',
      }

      const result = equipmentItemInputSchema.safeParse(item)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.quantity).toBe(1)
      }
    })

    it('должен обрезать пробелы в названии и серийнике', () => {
      const item = {
        equipment_name: '  Ноутбук  ',
        serial_number: '  SN123  ',
        quantity: 1,
      }

      const result = equipmentItemInputSchema.safeParse(item)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.equipment_name).toBe('Ноутбук')
        expect(result.data.serial_number).toBe('SN123')
      }
    })
  })

  describe('createRequestSchema', () => {
    it('должен валидировать корректную заявку', () => {
      const validRequest = {
        employee_name: 'Иванов Иван',
        login: 'i.ivanov',
        sd_number: 'SD-123',
        notes: 'Тестовая заявка',
        equipment_items: [
          {
            equipment_name: 'Ноутбук',
            serial_number: 'SN123',
            quantity: 1,
          },
        ],
      }

      const result = createRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('должен требовать employee_name', () => {
      const invalidRequest = {
        employee_name: '',
        login: 'i.ivanov',
        equipment_items: [
          {
            equipment_name: 'Ноутбук',
            serial_number: 'SN123',
            quantity: 1,
          },
        ],
      }

      const result = createRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('должен требовать login', () => {
      const invalidRequest = {
        employee_name: 'Иванов Иван',
        login: '',
        equipment_items: [
          {
            equipment_name: 'Ноутбук',
            serial_number: 'SN123',
            quantity: 1,
          },
        ],
      }

      const result = createRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('должен требовать хотя бы один элемент оборудования', () => {
      const invalidRequest = {
        employee_name: 'Иванов Иван',
        login: 'i.ivanov',
        equipment_items: [],
      }

      const result = createRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('должен делать sd_number опциональным', () => {
      const request = {
        employee_name: 'Иванов Иван',
        login: 'i.ivanov',
        equipment_items: [
          {
            equipment_name: 'Ноутбук',
            serial_number: 'SN123',
            quantity: 1,
          },
        ],
      }

      const result = createRequestSchema.safeParse(request)
      expect(result.success).toBe(true)
    })

    it('должен делать notes опциональным', () => {
      const request = {
        employee_name: 'Иванов Иван',
        login: 'i.ivanov',
        equipment_items: [
          {
            equipment_name: 'Ноутбук',
            serial_number: 'SN123',
            quantity: 1,
          },
        ],
      }

      const result = createRequestSchema.safeParse(request)
      expect(result.success).toBe(true)
    })

    it('должен преобразовывать пустые notes в undefined', () => {
      const request = {
        employee_name: 'Иванов Иван',
        login: 'i.ivanov',
        notes: '   ',
        equipment_items: [
          {
            equipment_name: 'Ноутбук',
            serial_number: 'SN123',
            quantity: 1,
          },
        ],
      }

      const result = createRequestSchema.safeParse(request)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.notes).toBeUndefined()
      }
    })

    it('должен отклонять слишком длинный sd_number', () => {
      const request = {
        employee_name: 'Иванов Иван',
        login: 'i.ivanov',
        sd_number: 'A'.repeat(121),
        equipment_items: [
          {
            equipment_name: 'Ноутбук',
            serial_number: 'SN123',
            quantity: 1,
          },
        ],
      }

      const result = createRequestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })
  })

  describe('scheduleRequestReturnSchema', () => {
    it('должен валидировать корректную дату и оборудование', () => {
      const validData = {
        due_date: '2024-12-31',
        equipment: 'Ноутбук Dell',
      }

      const result = scheduleRequestReturnSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('должен требовать дату в формате YYYY-MM-DD', () => {
      const invalidData = {
        due_date: '31.12.2024',
        equipment: 'Ноутбук',
      }

      const result = scheduleRequestReturnSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('должен требовать equipment', () => {
      const invalidData = {
        due_date: '2024-12-31',
        equipment: '',
      }

      const result = scheduleRequestReturnSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('createEmployeeExitSchema', () => {
    it('должен валидировать корректный выход сотрудника', () => {
      const validExit = {
        employee_name: 'Петров Петр',
        login: 'p.petrov',
        sd_number: 'SD-456',
        exit_date: '2024-07-15',
        equipment_list: 'Ноутбук\nМышь',
      }

      const result = createEmployeeExitSchema.safeParse(validExit)
      expect(result.success).toBe(true)
    })

    it('должен требовать employee_name', () => {
      const invalidExit = {
        employee_name: '',
        login: 'p.petrov',
        exit_date: '2024-07-15',
        equipment_list: 'Ноутбук',
      }

      const result = createEmployeeExitSchema.safeParse(invalidExit)
      expect(result.success).toBe(false)
    })

    it('должен требовать login', () => {
      const invalidExit = {
        employee_name: 'Петров Петр',
        login: '',
        exit_date: '2024-07-15',
        equipment_list: 'Ноутбук',
      }

      const result = createEmployeeExitSchema.safeParse(invalidExit)
      expect(result.success).toBe(false)
    })

    it('должен требовать exit_date', () => {
      const invalidExit = {
        employee_name: 'Петров Петр',
        login: 'p.petrov',
        exit_date: '',
        equipment_list: 'Ноутбук',
      }

      const result = createEmployeeExitSchema.safeParse(invalidExit)
      expect(result.success).toBe(false)
    })

    it('должен требовать equipment_list', () => {
      const invalidExit = {
        employee_name: 'Петров Петр',
        login: 'p.petrov',
        exit_date: '2024-07-15',
        equipment_list: '',
      }

      const result = createEmployeeExitSchema.safeParse(invalidExit)
      expect(result.success).toBe(false)
    })
  })

  describe('paginatedRequestQuerySchema', () => {
    it('должен валидировать корректные параметры запроса', () => {
      const validParams = {
        page: 1,
        pageSize: 25,
        search: 'test',
        status: 'all',
      }

      const result = paginatedRequestQuerySchema.safeParse(validParams)
      expect(result.success).toBe(true)
    })

    it('должен принимать минимум 1 для page', () => {
      const params = { page: 1 }
      const result = paginatedRequestQuerySchema.safeParse(params)
      expect(result.success).toBe(true)
    })

    it('должен отклонять page < 1', () => {
      const params = { page: 0 }
      const result = paginatedRequestQuerySchema.safeParse(params)
      expect(result.success).toBe(false)
    })

    it('должен принимать pageSize от 5 до 200', () => {
      expect(paginatedRequestQuerySchema.safeParse({ pageSize: 5 }).success).toBe(true)
      expect(paginatedRequestQuerySchema.safeParse({ pageSize: 100 }).success).toBe(true)
      expect(paginatedRequestQuerySchema.safeParse({ pageSize: 200 }).success).toBe(true)
    })

    it('должен отклонять pageSize < 5', () => {
      const params = { pageSize: 4 }
      const result = paginatedRequestQuerySchema.safeParse(params)
      expect(result.success).toBe(false)
    })

    it('должен отклонять pageSize > 200', () => {
      const params = { pageSize: 201 }
      const result = paginatedRequestQuerySchema.safeParse(params)
      expect(result.success).toBe(false)
    })

    it('должен валидировать статусы запросов', () => {
      const statuses = ['all', 'issued', 'not-issued', 'return-pending', 'return-completed']
      statuses.forEach((status) => {
        const result = paginatedRequestQuerySchema.safeParse({ status })
        expect(result.success).toBe(true)
      })
    })

    it('должен отклонять некорректный статус', () => {
      const params = { status: 'invalid-status' }
      const result = paginatedRequestQuerySchema.safeParse(params)
      expect(result.success).toBe(false)
    })
  })

  describe('createTemplateSchema', () => {
    it('должен валидировать корректный шаблон', () => {
      const validTemplate = {
        title: 'Базовый набор',
        content: 'Ноутбук\nМышь\nКлавиатура',
      }

      const result = createTemplateSchema.safeParse(validTemplate)
      expect(result.success).toBe(true)
    })

    it('должен требовать title', () => {
      const invalidTemplate = {
        title: '',
        content: 'Ноутбук',
      }

      const result = createTemplateSchema.safeParse(invalidTemplate)
      expect(result.success).toBe(false)
    })

    it('должен требовать content', () => {
      const invalidTemplate = {
        title: 'Базовый набор',
        content: '',
      }

      const result = createTemplateSchema.safeParse(invalidTemplate)
      expect(result.success).toBe(false)
    })

    it('должен обрезать пробелы', () => {
      const template = {
        title: '  Базовый набор  ',
        content: '  Ноутбук  ',
      }

      const result = createTemplateSchema.safeParse(template)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Базовый набор')
        expect(result.data.content).toBe('Ноутбук')
      }
    })
  })
})
