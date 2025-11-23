import { describe, it, expect } from 'vitest'
import {
  createRequestSchema,
  createEmployeeExitSchema,
  equipmentItemInputSchema,
  scheduleRequestReturnSchema,
  createTemplateSchema,
  reorderTemplatesSchema,
  paginatedRequestQuerySchema,
  paginatedEmployeeExitQuerySchema,
} from './ipc'

describe('IPC Schemas', () => {
  describe('equipmentItemInputSchema', () => {
    it('должен валидировать корректные данные оборудования', () => {
      const validData = {
        equipment_name: 'Ноутбук',
        serial_number: 'SN12345',
        quantity: 1,
      }

      const result = equipmentItemInputSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('должен обрезать пробелы в строковых полях', () => {
      const data = {
        equipment_name: '  Ноутбук  ',
        serial_number: '  SN12345  ',
        quantity: 1,
      }

      const result = equipmentItemInputSchema.parse(data)
      expect(result.equipment_name).toBe('Ноутбук')
      expect(result.serial_number).toBe('SN12345')
    })

    it('должен отклонять пустое название оборудования', () => {
      const data = {
        equipment_name: '',
        serial_number: 'SN12345',
        quantity: 1,
      }

      const result = equipmentItemInputSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('должен отклонять пустой серийный номер', () => {
      const data = {
        equipment_name: 'Ноутбук',
        serial_number: '',
        quantity: 1,
      }

      const result = equipmentItemInputSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('должен устанавливать quantity по умолчанию в 1', () => {
      const data = {
        equipment_name: 'Ноутбук',
        serial_number: 'SN12345',
      }

      const result = equipmentItemInputSchema.parse(data)
      expect(result.quantity).toBe(1)
    })

    it('должен преобразовывать строку в число для quantity', () => {
      const data = {
        equipment_name: 'Ноутбук',
        serial_number: 'SN12345',
        quantity: '5',
      }

      const result = equipmentItemInputSchema.parse(data)
      expect(result.quantity).toBe(5)
      expect(typeof result.quantity).toBe('number')
    })

    it('должен отклонять отрицательное quantity', () => {
      const data = {
        equipment_name: 'Ноутбук',
        serial_number: 'SN12345',
        quantity: -1,
      }

      const result = equipmentItemInputSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('должен отклонять нулевое quantity', () => {
      const data = {
        equipment_name: 'Ноутбук',
        serial_number: 'SN12345',
        quantity: 0,
      }

      const result = equipmentItemInputSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('createRequestSchema', () => {
    it('должен валидировать корректную заявку', () => {
      const validData = {
        employee_name: 'Иванов Иван Иванович',
        login: 'ivanov',
        sd_number: 'SD-12345',
        notes: 'Тестовые заметки',
        equipment_items: [
          {
            equipment_name: 'Ноутбук',
            serial_number: 'SN12345',
            quantity: 1,
          },
        ],
      }

      const result = createRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('должен обрезать пробелы в employee_name', () => {
      const data = {
        employee_name: '  Иванов Иван  ',
        login: 'ivanov',
        equipment_items: [
          {
            equipment_name: 'Ноутбук',
            serial_number: 'SN12345',
            quantity: 1,
          },
        ],
      }

      const result = createRequestSchema.parse(data)
      expect(result.employee_name).toBe('Иванов Иван')
    })

    it('должен отклонять пустое employee_name', () => {
      const data = {
        employee_name: '',
        login: 'ivanov',
        equipment_items: [
          {
            equipment_name: 'Ноутбук',
            serial_number: 'SN12345',
            quantity: 1,
          },
        ],
      }

      const result = createRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('должен отклонять пустой login', () => {
      const data = {
        employee_name: 'Иванов',
        login: '',
        equipment_items: [
          {
            equipment_name: 'Ноутбук',
            serial_number: 'SN12345',
            quantity: 1,
          },
        ],
      }

      const result = createRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('должен отклонять заявку без оборудования', () => {
      const data = {
        employee_name: 'Иванов',
        login: 'ivanov',
        equipment_items: [],
      }

      const result = createRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('должен сделать sd_number опциональным', () => {
      const data = {
        employee_name: 'Иванов',
        login: 'ivanov',
        equipment_items: [
          {
            equipment_name: 'Ноутбук',
            serial_number: 'SN12345',
            quantity: 1,
          },
        ],
      }

      const result = createRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('должен отклонять слишком длинный sd_number', () => {
      const data = {
        employee_name: 'Иванов',
        login: 'ivanov',
        sd_number: 'A'.repeat(121),
        equipment_items: [
          {
            equipment_name: 'Ноутбук',
            serial_number: 'SN12345',
            quantity: 1,
          },
        ],
      }

      const result = createRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('должен конвертировать пустые notes в undefined', () => {
      const data = {
        employee_name: 'Иванов',
        login: 'ivanov',
        notes: '   ',
        equipment_items: [
          {
            equipment_name: 'Ноутбук',
            serial_number: 'SN12345',
            quantity: 1,
          },
        ],
      }

      const result = createRequestSchema.parse(data)
      expect(result.notes).toBeUndefined()
    })
  })

  describe('createEmployeeExitSchema', () => {
    it('должен валидировать корректные данные выхода', () => {
      const validData = {
        employee_name: 'Иванов Иван',
        login: 'ivanov',
        sd_number: 'SD-12345',
        exit_date: '2024-12-31',
        equipment_list: 'Ноутбук\nМышь\nКлавиатура',
      }

      const result = createEmployeeExitSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('должен отклонять пустое employee_name', () => {
      const data = {
        employee_name: '',
        login: 'ivanov',
        exit_date: '2024-12-31',
        equipment_list: 'Ноутбук',
      }

      const result = createEmployeeExitSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('должен отклонять пустой exit_date', () => {
      const data = {
        employee_name: 'Иванов',
        login: 'ivanov',
        exit_date: '',
        equipment_list: 'Ноутбук',
      }

      const result = createEmployeeExitSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('должен отклонять пустой equipment_list', () => {
      const data = {
        employee_name: 'Иванов',
        login: 'ivanov',
        exit_date: '2024-12-31',
        equipment_list: '',
      }

      const result = createEmployeeExitSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('scheduleRequestReturnSchema', () => {
    it('должен валидировать корректные данные сдачи', () => {
      const validData = {
        due_date: '2024-12-31',
        equipment: 'Ноутбук, Мышь',
      }

      const result = scheduleRequestReturnSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('должен отклонять пустую due_date', () => {
      const data = {
        due_date: '',
        equipment: 'Ноутбук',
      }

      const result = scheduleRequestReturnSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('должен отклонять неправильный формат даты', () => {
      const data = {
        due_date: '31-12-2024',
        equipment: 'Ноутбук',
      }

      const result = scheduleRequestReturnSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('должен отклонять пустое оборудование', () => {
      const data = {
        due_date: '2024-12-31',
        equipment: '',
      }

      const result = scheduleRequestReturnSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('createTemplateSchema', () => {
    it('должен валидировать корректный шаблон', () => {
      const validData = {
        title: 'Мой шаблон',
        content: 'Содержимое шаблона',
      }

      const result = createTemplateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('должен обрезать пробелы в title', () => {
      const data = {
        title: '  Мой шаблон  ',
        content: 'Содержимое',
      }

      const result = createTemplateSchema.parse(data)
      expect(result.title).toBe('Мой шаблон')
    })

    it('должен отклонять пустой title', () => {
      const data = {
        title: '',
        content: 'Содержимое',
      }

      const result = createTemplateSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('должен отклонять пустое content', () => {
      const data = {
        title: 'Мой шаблон',
        content: '',
      }

      const result = createTemplateSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('reorderTemplatesSchema', () => {
    it('должен валидировать корректный порядок', () => {
      const validData = {
        order: [1, 2, 3, 4, 5],
      }

      const result = reorderTemplatesSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('должен отклонять пустой массив', () => {
      const data = {
        order: [],
      }

      const result = reorderTemplatesSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('должен отклонять массив с отрицательными числами', () => {
      const data = {
        order: [1, -2, 3],
      }

      const result = reorderTemplatesSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('paginatedRequestQuerySchema', () => {
    it('должен валидировать корректные параметры пагинации', () => {
      const validData = {
        page: 1,
        pageSize: 25,
        search: 'Иванов',
        status: 'all',
      }

      const result = paginatedRequestQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('должен отклонять page меньше 1', () => {
      const data = {
        page: 0,
        pageSize: 25,
      }

      const result = paginatedRequestQuerySchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('должен отклонять pageSize меньше 5', () => {
      const data = {
        page: 1,
        pageSize: 4,
      }

      const result = paginatedRequestQuerySchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('должен отклонять pageSize больше 200', () => {
      const data = {
        page: 1,
        pageSize: 201,
      }

      const result = paginatedRequestQuerySchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('должен валидировать статусы', () => {
      const statuses = ['all', 'issued', 'not-issued', 'return-pending', 'return-completed']

      statuses.forEach((status) => {
        const result = paginatedRequestQuerySchema.safeParse({ status })
        expect(result.success).toBe(true)
      })
    })

    it('должен отклонять неправильный статус', () => {
      const data = {
        status: 'invalid-status',
      }

      const result = paginatedRequestQuerySchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('paginatedEmployeeExitQuerySchema', () => {
    it('должен валидировать корректные параметры', () => {
      const validData = {
        page: 1,
        pageSize: 25,
        search: 'Иванов',
        status: 'pending',
      }

      const result = paginatedEmployeeExitQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('должен валидировать статусы выходов', () => {
      const statuses = ['all', 'pending', 'completed']

      statuses.forEach((status) => {
        const result = paginatedEmployeeExitQuerySchema.safeParse({ status })
        expect(result.success).toBe(true)
      })
    })

    it('должен отклонять неправильный статус', () => {
      const data = {
        status: 'invalid-status',
      }

      const result = paginatedEmployeeExitQuerySchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })
})
