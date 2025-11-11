import { ipcMain } from 'electron'
import type { Knex } from 'knex'
import {
  createRequestSchema,
  issuedStatusSchema,
  requestIdSchema,
  requestRecordSchema,
  restoreRequestSchema,
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
}
