import { BrowserWindow, app } from 'electron'
import fs from 'fs'
import path from 'path'

export interface WindowState {
  width: number
  height: number
  x?: number
  y?: number
  isMaximized?: boolean
}

function getWindowStateFilePath() {
  return path.join(app.getPath('userData'), 'window-state.json')
}

export function loadWindowState(): WindowState {
  try {
    const filePath = getWindowStateFilePath()
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(data) as WindowState
    }
  } catch (error) {
    console.error('Ошибка при загрузке состояния окна:', error)
  }

  return { width: 1200, height: 800 }
}

export function saveWindowState(window: BrowserWindow) {
  if (window.isDestroyed()) {
    return
  }

  try {
    const bounds = window.getBounds()
    const state: WindowState = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: window.isMaximized()
    }

    fs.writeFileSync(getWindowStateFilePath(), JSON.stringify(state, null, 2))
  } catch (error) {
    console.error('Ошибка при сохранении состояния окна:', error)
  }
}
