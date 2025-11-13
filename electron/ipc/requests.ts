import { ipcMain } from 'electron'
import type { Knex } from 'knex'
import {
  createRequestSchema,
  issuedStatusSchema,
  requestIdSchema,
  requestRecordSchema,
  restoreRequestSchema,
  scheduleRequestReturnSchema,
  updateRequestSchema,
} from '../../src/types/ipc'

type GetDatabase = () => Knex

export function registerRequestHandlers(getDatabase: GetDatabase) {
  ipcMain.handle('get-requests', async () => {
    try {
      const database = getDatabase()
      const requests = (await database('requests')
        .select('*')
        .orderBy('created_at', 'desc')) as Array<Record<string, any>>

      if (requests.length === 0) {
        return { success: true, data: [] }
      }

      const requestIds = requests.map((request) => request.id)
      const equipmentItems = (await database('equipment_items')
        .select('*')
        .whereIn('request_id', requestIds)) as Array<Record<string, any>>

      const itemsByRequest = new Map<number, Array<Record<string, any>>>()
      for (const item of equipmentItems) {
        const current = itemsByRequest.get(item.request_id) ?? []
        current.push(item)
        itemsByRequest.set(item.request_id, current)
      }

      const payload = requests.map((request) => {
        const equipment = itemsByRequest.get(request.id) ?? []

        return requestRecordSchema.parse({
          ...request,
          login: request.login ?? '',
          sd_number: request.sd_number ?? null,
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

  ipcMain.handle('create-request', async (_event, rawData) => {
    try {
      const data = createRequestSchema.parse(rawData)
      const database = getDatabase()
      const createdAt = new Date().toISOString()

      const result = await database.transaction(async (trx) => {
        const requestInsertResult = (await trx('requests').insert({
          employee_name: data.employee_name,
          login: data.login,
          sd_number: data.sd_number ?? null,
          created_at: createdAt,
          notes: data.notes ?? null,
          return_required: 0,
          return_due_date: null,
          return_equipment: null,
          return_completed: 0,
          return_completed_at: null,
          return_scheduled_at: null,
        })) as number | Array<number> | { [key: string]: number }

        const insertValue = Array.isArray(requestInsertResult)
          ? requestInsertResult[0]
          : requestInsertResult

        const insertedId = (() => {
          if (typeof insertValue === 'number') {
            return insertValue
          }

          if (typeof insertValue === 'bigint') {
            return Number(insertValue)
          }

          const valueFromObject = (insertValue as { id?: number }).id
          if (typeof valueFromObject === 'number') {
            return valueFromObject
          }

          return Number(insertValue)
        })()

        if (typeof insertedId !== 'number' || Number.isNaN(insertedId)) {
          throw new Error('Не удалось получить идентификатор созданной заявки')
        }

        const equipmentRows = data.equipment_items.map((item) => ({
          request_id: insertedId,
          equipment_name: item.equipment_name,
          serial_number: item.serial_number,
          quantity: item.quantity ?? 1,
        }))

        if (equipmentRows.length > 0) {
          await trx('equipment_items').insert(equipmentRows)
        }

        return insertedId
      })

      return { success: true, id: Number(result) }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('update-issued', async (_event, rawId, rawStatus) => {
    try {
      const id = requestIdSchema.parse(rawId)
      const isIssued = issuedStatusSchema.parse(rawStatus)
      const issuedAt = isIssued ? new Date().toISOString() : null

      const database = getDatabase()
      await database('requests')
        .where({ id })
        .update({ is_issued: isIssued ? 1 : 0, issued_at: issuedAt })

      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('update-request', async (_event, rawId, rawData) => {
    try {
      const id = requestIdSchema.parse(rawId)
      const data = updateRequestSchema.parse(rawData)

      const database = getDatabase()

      await database.transaction(async (trx) => {
        await trx('requests')
          .where({ id })
          .update({
            employee_name: data.employee_name,
            login: data.login,
            sd_number: data.sd_number ?? null,
            notes: data.notes ?? null,
          })

        await trx('equipment_items').where({ request_id: id }).delete()

        const equipmentRows = data.equipment_items.map((item) => ({
          request_id: id,
          equipment_name: item.equipment_name,
          serial_number: item.serial_number,
          quantity: item.quantity ?? 1,
        }))

        if (equipmentRows.length > 0) {
          await trx('equipment_items').insert(equipmentRows)
        }
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('delete-request', async (_event, rawId) => {
    try {
      const id = requestIdSchema.parse(rawId)
      const database = getDatabase()

      const request = (await database('requests').where({ id }).first()) as
        | Record<string, any>
        | undefined

      if (!request) {
        return { success: false, error: 'Заявка не найдена' }
      }

      const equipment = (await database('equipment_items').where({ request_id: id })) as Array<
        Record<string, any>
      >

      const deletedRequest = requestRecordSchema.parse({
        ...request,
        login: request.login ?? '',
        sd_number: request.sd_number ?? null,
        equipment_items: equipment.map((item) => ({
          id: item.id,
          equipment_name: item.equipment_name,
          serial_number: item.serial_number,
          quantity: item.quantity ?? 1,
        })),
      })

      await database('requests').where({ id }).delete()

      return { success: true, data: deletedRequest }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('restore-request', async (_event, rawRequest) => {
    try {
      const request = restoreRequestSchema.parse(rawRequest)
      const database = getDatabase()

      await database.transaction(async (trx) => {
        await trx('requests').insert({
          id: request.id,
          employee_name: request.employee_name,
          login: request.login,
          sd_number: request.sd_number,
          created_at: request.created_at,
          is_issued: request.is_issued,
          issued_at: request.issued_at,
          notes: request.notes,
          return_required: request.return_required,
          return_due_date: request.return_due_date,
          return_equipment: request.return_equipment,
          return_completed: request.return_completed,
          return_completed_at: request.return_completed_at,
          return_scheduled_at: request.return_scheduled_at,
        })

        const equipmentRows = request.equipment_items.map((item) => ({
          request_id: request.id,
          equipment_name: item.equipment_name,
          serial_number: item.serial_number,
          quantity: item.quantity ?? 1,
        }))

        if (equipmentRows.length > 0) {
          await trx('equipment_items').insert(equipmentRows)
        }
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('schedule-request-return', async (_event, rawId, rawPayload) => {
    try {
      const id = requestIdSchema.parse(rawId)
      const data = scheduleRequestReturnSchema.parse(rawPayload)

      const database = getDatabase()
      const existing = await database('requests').where({ id }).first()

      if (!existing) {
        return { success: false, error: 'Заявка не найдена' }
      }

      await database('requests').where({ id }).update({
        return_required: 1,
        return_due_date: data.due_date,
        return_equipment: data.equipment,
        return_completed: 0,
        return_completed_at: null,
        return_scheduled_at: new Date().toISOString(),
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('complete-request-return', async (_event, rawId, rawCompleted) => {
    try {
      const id = requestIdSchema.parse(rawId)
      const isCompleted = issuedStatusSchema.parse(rawCompleted)
      const database = getDatabase()
      const existing = (await database('requests').where({ id }).first()) as
        | Record<string, any>
        | undefined

      if (!existing) {
        return { success: false, error: 'Заявка не найдена' }
      }

      const updatePayload: Record<string, any> = {
        return_completed: isCompleted ? 1 : 0,
        return_completed_at: isCompleted ? new Date().toISOString() : null,
      }

      if (isCompleted && existing.is_issued !== 1) {
        updatePayload.is_issued = 1
        updatePayload.issued_at = existing.issued_at ?? new Date().toISOString()
      }

      const updated = await database('requests').where({ id }).update(updatePayload)

      if (updated === 0) {
        return { success: false, error: 'Заявка не найдена' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('cancel-request-return', async (_event, rawId) => {
    try {
      const id = requestIdSchema.parse(rawId)
      const database = getDatabase()
      const updated = await database('requests').where({ id }).update({
        return_required: 0,
        return_due_date: null,
        return_equipment: null,
        return_completed: 0,
        return_completed_at: null,
        return_scheduled_at: null,
      })

      if (updated === 0) {
        return { success: false, error: 'Заявка не найдена' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}
