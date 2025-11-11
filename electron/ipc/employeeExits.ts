import { dialog, ipcMain } from 'electron'
import type { Knex } from 'knex'
import {
  createEmployeeExitSchema,
  employeeExitRecordSchema,
  issuedStatusSchema,
  requestIdSchema,
} from '../../src/types/ipc'
import fs from 'fs'

type GetDatabase = () => Knex

function createCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value).replace(/\r?\n/g, ' ')
  const needsEscape = /[",\n]/.test(stringValue)
  if (needsEscape) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

type EmployeeExitHandlersOptions = {
  onDataChanged?: () => void
}

export function registerEmployeeExitHandlers(
  getDatabase: GetDatabase,
  options: EmployeeExitHandlersOptions = {}
) {
  const notifyChange = () => {
    try {
      options.onDataChanged?.()
    } catch (error) {
      console.error('Ошибка при обработке обновлений выходов:', error)
    }
  }

  ipcMain.handle('get-employee-exits', async () => {
    try {
      const database = getDatabase()
      const exits = (await database('employee_exits')
        .select('*')
        .orderBy('exit_date', 'desc')) as Array<Record<string, any>>

      const payload = exits.map((exit) =>
        employeeExitRecordSchema.parse({
          ...exit,
          sd_number: exit.sd_number ?? null,
        })
      )
      return { success: true, data: payload }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('create-employee-exit', async (_event, rawData) => {
    try {
      const data = createEmployeeExitSchema.parse(rawData)
      const database = getDatabase()
      const createdAt = new Date().toISOString()

      const insertResult = (await database('employee_exits').insert({
        employee_name: data.employee_name,
        login: data.login,
        sd_number: data.sd_number ?? null,
        exit_date: data.exit_date,
        equipment_list: data.equipment_list,
        created_at: createdAt,
        is_completed: 0,
      })) as number | Array<number>

      const insertedId = Array.isArray(insertResult) ? insertResult[0] : insertResult
      const numericId = Number(insertedId)

      if (Number.isNaN(numericId)) {
        throw new Error('Не удалось получить идентификатор записи об увольнении')
      }

      notifyChange()
      return { success: true, id: numericId }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('update-employee-exit', async (_event, rawId, rawData) => {
    try {
      const id = requestIdSchema.parse(rawId)
      const data = createEmployeeExitSchema.parse(rawData)

      const database = getDatabase()
      await database('employee_exits')
        .where({ id })
        .update({
          employee_name: data.employee_name,
          login: data.login,
          sd_number: data.sd_number ?? null,
          exit_date: data.exit_date,
          equipment_list: data.equipment_list,
        })

      notifyChange()
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('delete-employee-exit', async (_event, rawId) => {
    try {
      const id = requestIdSchema.parse(rawId)
      const database = getDatabase()

      const exit = (await database('employee_exits').where({ id }).first()) as
        | Record<string, any>
        | undefined

      if (!exit) {
        return { success: false, error: 'Запись не найдена' }
      }

      const payload = employeeExitRecordSchema.parse({
        ...exit,
        sd_number: exit.sd_number ?? null,
      })
      await database('employee_exits').where({ id }).delete()
      notifyChange()
      return { success: true, data: payload }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('update-exit-completed', async (_event, rawId, rawCompleted) => {
    try {
      const id = requestIdSchema.parse(rawId)
      const isCompleted = issuedStatusSchema.parse(rawCompleted)
      const database = getDatabase()
      await database('employee_exits')
        .where({ id })
        .update({ is_completed: isCompleted ? 1 : 0 })

      notifyChange()
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('export-employee-exits', async (_event, rawExits) => {
    try {
      const exits = employeeExitRecordSchema.array().parse(rawExits)
      const timestamp = new Date().toISOString().split('T')[0]
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Экспорт записей о выходах',
        defaultPath: `employee-exits-${timestamp}.csv`,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      })

      if (canceled || !filePath) {
        return { success: false, error: 'Отменено пользователем' }
      }

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

      const csvContent = [
        headers.map(createCsvValue).join(','),
        ...rows.map((row) => row.map(createCsvValue).join(',')),
      ].join('\n')

      fs.writeFileSync(filePath, csvContent, 'utf8')

      return { success: true, data: { path: filePath } }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}
