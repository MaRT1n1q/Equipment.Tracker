import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import {
  createEmployeeExitSchema,
  employeeExitRecordSchema,
  issuedStatusSchema,
  requestIdSchema,
} from '../../src/types/ipc'

type GetDatabase = () => Database.Database

export function registerEmployeeExitHandlers(getDatabase: GetDatabase) {
  ipcMain.handle('get-employee-exits', () => {
    try {
      const database = getDatabase()
      const exits = database
        .prepare('SELECT * FROM employee_exits ORDER BY exit_date DESC')
        .all() as Array<Record<string, any>>

      const payload = exits.map((exit) => employeeExitRecordSchema.parse(exit))
      return { success: true, data: payload }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('create-employee-exit', (_event, rawData) => {
    try {
      const data = createEmployeeExitSchema.parse(rawData)
      const database = getDatabase()
      const createdAt = new Date().toISOString()

      const result = database
        .prepare(
          `
          INSERT INTO employee_exits (employee_name, login, exit_date, equipment_list, created_at, is_completed)
          VALUES (?, ?, ?, ?, ?, 0)
        `
        )
        .run(data.employee_name, data.login, data.exit_date, data.equipment_list, createdAt)

      return { success: true, id: result.lastInsertRowid }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('update-employee-exit', (_event, rawId, rawData) => {
    try {
      const id = requestIdSchema.parse(rawId)
      const data = createEmployeeExitSchema.parse(rawData)

      const database = getDatabase()
      database
        .prepare(
          `
          UPDATE employee_exits
          SET employee_name = ?, login = ?, exit_date = ?, equipment_list = ?
          WHERE id = ?
        `
        )
        .run(data.employee_name, data.login, data.exit_date, data.equipment_list, id)

      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('delete-employee-exit', (_event, rawId) => {
    try {
      const id = requestIdSchema.parse(rawId)
      const database = getDatabase()

      const exit = database.prepare('SELECT * FROM employee_exits WHERE id = ?').get(id)

      if (!exit) {
        return { success: false, error: 'Запись не найдена' }
      }

      const payload = employeeExitRecordSchema.parse(exit)
      database.prepare('DELETE FROM employee_exits WHERE id = ?').run(id)
      return { success: true, data: payload }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('update-exit-completed', (_event, rawId, rawCompleted) => {
    try {
      const id = requestIdSchema.parse(rawId)
      const isCompleted = issuedStatusSchema.parse(rawCompleted)
      const database = getDatabase()
      database
        .prepare(
          `
          UPDATE employee_exits
          SET is_completed = ?
          WHERE id = ?
        `
        )
        .run(isCompleted ? 1 : 0, id)

      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}
