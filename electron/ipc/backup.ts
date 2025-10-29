import { dialog, ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import {
  closeDatabase,
  ensureBackupsDirectory,
  getDatabase,
  getDatabasePath,
  initDatabase,
} from '../database'

type BackupResult = { success: boolean; error?: string; path?: string }

export function registerBackupHandlers() {
  ipcMain.handle('create-backup', async () => {
    try {
      try {
        const database = getDatabase()
        await database.raw('PRAGMA wal_checkpoint(FULL)')
      } catch (error) {
        console.warn('Пропускаю checkpoint перед бэкапом:', error)
      }

      const backupDir = ensureBackupsDirectory()
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
      const backupPath = path.join(backupDir, `equipment_backup_${timestamp}.db`)

      await fs.promises.copyFile(getDatabasePath(), backupPath)
      return { success: true, path: backupPath }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('restore-backup', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Database Files', extensions: ['db'] }],
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: 'Отменено пользователем' }
      }

      const backupFilePath = result.filePaths[0]
      const dbPath = getDatabasePath()

      await closeDatabase()

      const emergencyBackup = `${dbPath}.emergency`
      await fs.promises.copyFile(dbPath, emergencyBackup)

      try {
        await fs.promises.copyFile(backupFilePath, dbPath)
        await initDatabase()
        await fs.promises.unlink(emergencyBackup)
        return { success: true }
      } catch (error) {
        await fs.promises.copyFile(emergencyBackup, dbPath)
        await initDatabase()
        await fs.promises.unlink(emergencyBackup)
        throw error
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}

export async function createAutomaticBackup(keepLast = 5): Promise<BackupResult> {
  try {
    try {
      const database = getDatabase()
      await database.raw('PRAGMA wal_checkpoint(FULL)')
    } catch (error) {
      console.warn('Пропускаю checkpoint перед авто-бэкапом:', error)
    }

    const backupDir = ensureBackupsDirectory()
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
    const backupPath = path.join(backupDir, `auto_backup_${timestamp}.db`)

    await fs.promises.copyFile(getDatabasePath(), backupPath)

    const files = (await fs.promises.readdir(backupDir))
      .filter((file) => file.startsWith('auto_backup_'))
      .sort()
      .reverse()

    if (files.length > keepLast) {
      await Promise.all(
        files.slice(keepLast).map((file) => fs.promises.unlink(path.join(backupDir, file)))
      )
    }

    return { success: true, path: backupPath }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
