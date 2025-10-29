import { app, BrowserWindow } from 'electron'
import { createMainWindow } from './window'
import { closeDatabase, getDatabase, initDatabase } from './database'
import { registerRequestHandlers } from './ipc/requests'
import { registerEmployeeExitHandlers } from './ipc/employeeExits'
import { createAutomaticBackup, registerBackupHandlers } from './ipc/backup'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = createMainWindow()
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  await initDatabase()

  registerRequestHandlers(getDatabase)
  registerEmployeeExitHandlers(getDatabase)
  registerBackupHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    const backupResult = await createAutomaticBackup()
    if (!backupResult.success) {
      console.error('Auto backup failed:', backupResult.error)
    }

    await closeDatabase()
    app.quit()
  }
})
