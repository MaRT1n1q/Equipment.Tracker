import type {
  CreateRequestData,
  CreateEmployeeExitData,
  Request,
  EmployeeExit,
  EquipmentItem,
  Template,
} from '../types/ipc'

/**
 * Test data factories for generating mock data
 */

export function createMockEquipmentItem(overrides?: Partial<EquipmentItem>): EquipmentItem {
  return {
    id: 1,
    equipment_name: 'Ноутбук Dell',
    serial_number: 'SN12345',
    quantity: 1,
    ...overrides,
  }
}

export function createMockRequest(overrides?: Partial<Request>): Request {
  return {
    id: 1,
    employee_name: 'Иванов Иван Иванович',
    login: 'i.ivanov',
    sd_number: 'SD-12345',
    created_at: '2024-01-15T10:30:00.000Z',
    is_issued: 0,
    issued_at: null,
    notes: null,
    return_required: 0,
    return_due_date: null,
    return_equipment: null,
    return_completed: 0,
    return_completed_at: null,
    return_scheduled_at: null,
    equipment_items: [createMockEquipmentItem()],
    ...overrides,
  }
}

export function createMockCreateRequestData(
  overrides?: Partial<CreateRequestData>
): CreateRequestData {
  return {
    employee_name: 'Петров Петр Петрович',
    login: 'p.petrov',
    sd_number: 'SD-67890',
    notes: 'Тестовая заявка',
    equipment_items: [
      {
        equipment_name: 'Монитор Samsung',
        serial_number: 'MON-001',
        quantity: 1,
      },
    ],
    ...overrides,
  }
}

export function createMockEmployeeExit(overrides?: Partial<EmployeeExit>): EmployeeExit {
  return {
    id: 1,
    employee_name: 'Сидоров Сидор Сидорович',
    login: 's.sidorov',
    sd_number: 'SD-11111',
    exit_date: '2024-06-01',
    equipment_list: '[{"name":"Ноутбук","serial":"SN123"}]',
    created_at: '2024-05-15T10:00:00.000Z',
    is_completed: 0,
    ...overrides,
  }
}

export function createMockCreateEmployeeExitData(
  overrides?: Partial<CreateEmployeeExitData>
): CreateEmployeeExitData {
  return {
    employee_name: 'Козлов Василий',
    login: 'v.kozlov',
    sd_number: 'SD-22222',
    exit_date: '2024-07-15',
    equipment_list: '[{"name":"Клавиатура","serial":"KB-001"}]',
    ...overrides,
  }
}

export function createMockTemplate(overrides?: Partial<Template>): Template {
  return {
    id: 1,
    title: 'Базовый набор',
    content: 'Ноутбук\nМышь\nКлавиатура',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    sort_order: 0,
    ...overrides,
  }
}

export function createMockPaginatedResponse<T>(
  items: T[],
  overrides?: { page?: number; pageSize?: number; total?: number }
) {
  const page = overrides?.page ?? 1
  const pageSize = overrides?.pageSize ?? 25
  const total = overrides?.total ?? items.length
  const pageCount = Math.ceil(total / pageSize)

  return {
    items,
    meta: {
      page,
      pageSize,
      total,
      pageCount,
      hasMore: page < pageCount,
    },
  }
}
