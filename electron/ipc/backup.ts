import { ipcMain, dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import { ensureBackupsDirectory, getDatabasePath, initDatabase, closeDatabase } from '../database'

type BackupResult = { success: boolean; error?: string; path?: string }

export function registerBackupHandlers() {
  ipcMain.handle('create-backup', () => {
    try {
      const backupDir = ensureBackupsDirectory()
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
      const backupPath = path.join(backupDir, `equipment_backup_${timestamp}.db`)

      fs.copyFileSync(getDatabasePath(), backupPath)
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

      closeDatabase()

      const emergencyBackup = `${dbPath}.emergency`
      fs.copyFileSync(dbPath, emergencyBackup)

      try {
        fs.copyFileSync(backupFilePath, dbPath)
        initDatabase()
        fs.unlinkSync(emergencyBackup)
        return { success: true }
      } catch (error) {
        fs.copyFileSync(emergencyBackup, dbPath)
        initDatabase()
        fs.unlinkSync(emergencyBackup)
        throw error
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}

export function createAutomaticBackup(keepLast = 5): BackupResult {
  try {
    const backupDir = ensureBackupsDirectory()
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
    const backupPath = path.join(backupDir, `auto_backup_${timestamp}.db`)

    fs.copyFileSync(getDatabasePath(), backupPath)

    const files = fs
      .readdirSync(backupDir)
      .filter((file) => file.startsWith('auto_backup_'))
      .sort()
      .reverse()

    if (files.length > keepLast) {
      for (const file of files.slice(keepLast)) {
        fs.unlinkSync(path.join(backupDir, file))
      }
    }

    return { success: true, path: backupPath }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
