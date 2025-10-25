import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import {
  createRequestSchema,
  issuedStatusSchema,
  requestIdSchema,
  requestRecordSchema,
  restoreRequestSchema,
  updateRequestSchema,
} from '../../src/types/ipc'

type GetDatabase = () => Database.Database

export function registerRequestHandlers(getDatabase: GetDatabase) {
  ipcMain.handle('get-requests', () => {
    try {
      const database = getDatabase()
      const requests = database
        .prepare('SELECT * FROM requests ORDER BY created_at DESC')
        .all() as Array<Record<string, any>>

      const equipmentStatement = database.prepare(
        'SELECT * FROM equipment_items WHERE request_id = ?'
      )

      const payload = requests.map((request) => {
        const equipment = equipmentStatement.all(request.id) as Array<Record<string, any>>

        return requestRecordSchema.parse({
          ...request,
          equipment_items: equipment.map((item) => ({
            id: item.id,
            equipment_name: item.equipment_name,
            serial_number: item.serial_number,
            quantity: item.quantity ?? 1,
          })),
        })
      })

      return { success: true, data: payload }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('create-request', (_event, rawData) => {
    try {
      const data = createRequestSchema.parse(rawData)
      const database = getDatabase()
      const createdAt = new Date().toISOString()

      const insertRequest = database.prepare(`
        INSERT INTO requests (employee_name, created_at, notes)
        VALUES (?, ?, ?)
      `)

      const insertEquipment = database.prepare(`
        INSERT INTO equipment_items (request_id, equipment_name, serial_number, quantity)
        VALUES (?, ?, ?, ?)
      `)

      const transaction = database.transaction(() => {
        const requestResult = insertRequest.run(data.employee_name, createdAt, data.notes ?? null)

        for (const item of data.equipment_items) {
          insertEquipment.run(
            requestResult.lastInsertRowid,
            item.equipment_name,
            item.serial_number,
            item.quantity ?? 1
          )
        }

        return { id: requestResult.lastInsertRowid }
      })

      const result = transaction()
      return { success: true, id: result.id }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('update-issued', (_event, rawId, rawStatus) => {
    try {
      const id = requestIdSchema.parse(rawId)
      const isIssued = issuedStatusSchema.parse(rawStatus)
      const issuedAt = isIssued ? new Date().toISOString() : null

      const database = getDatabase()
      database
        .prepare('UPDATE requests SET is_issued = ?, issued_at = ? WHERE id = ?')
        .run(isIssued ? 1 : 0, issuedAt, id)

      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('update-request', (_event, rawId, rawData) => {
    try {
      const id = requestIdSchema.parse(rawId)
      const data = updateRequestSchema.parse(rawData)

      const database = getDatabase()
      const updateRequest = database.prepare(`
        UPDATE requests
        SET employee_name = ?, notes = ?
        WHERE id = ?
      `)

      const deleteEquipment = database.prepare('DELETE FROM equipment_items WHERE request_id = ?')
      const insertEquipment = database.prepare(`
        INSERT INTO equipment_items (request_id, equipment_name, serial_number, quantity)
        VALUES (?, ?, ?, ?)
      `)

      database.transaction(() => {
        updateRequest.run(data.employee_name, data.notes ?? null, id)
        deleteEquipment.run(id)

        for (const item of data.equipment_items) {
          insertEquipment.run(id, item.equipment_name, item.serial_number, item.quantity ?? 1)
        }
      })()

      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('delete-request', (_event, rawId) => {
    try {
      const id = requestIdSchema.parse(rawId)
      const database = getDatabase()

      const request = database.prepare('SELECT * FROM requests WHERE id = ?').get(id) as
        | Record<string, any>
        | undefined

      if (!request) {
        return { success: false, error: 'Заявка не найдена' }
      }

      const equipment = database
        .prepare('SELECT * FROM equipment_items WHERE request_id = ?')
        .all(id) as Array<Record<string, any>>

      const deletedRequest = requestRecordSchema.parse({
        ...request,
        equipment_items: equipment.map((item) => ({
          id: item.id,
          equipment_name: item.equipment_name,
          serial_number: item.serial_number,
          quantity: item.quantity ?? 1,
        })),
      })

      database.prepare('DELETE FROM requests WHERE id = ?').run(id)

      return { success: true, data: deletedRequest }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('restore-request', (_event, rawRequest) => {
    try {
      const request = restoreRequestSchema.parse(rawRequest)
      const database = getDatabase()

      const insertRequest = database.prepare(`
        INSERT INTO requests (id, employee_name, created_at, is_issued, issued_at, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `)

      const insertEquipment = database.prepare(`
        INSERT INTO equipment_items (request_id, equipment_name, serial_number, quantity)
        VALUES (?, ?, ?, ?)
      `)

      database.transaction(() => {
        insertRequest.run(
          request.id,
          request.employee_name,
          request.created_at,
          request.is_issued,
          request.issued_at,
          request.notes
        )

        for (const item of request.equipment_items) {
          insertEquipment.run(
            request.id,
            item.equipment_name,
            item.serial_number,
            item.quantity ?? 1
          )
        }
      })()

      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}
