import { ipcMain, shell } from 'electron'
import { openExternalUrlSchema } from '../../src/types/ipc'

export function registerExternalHandlers() {
  ipcMain.handle('open-external', async (_event, rawUrl) => {
    try {
      const url = openExternalUrlSchema.parse(rawUrl)
      await shell.openExternal(url)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}
