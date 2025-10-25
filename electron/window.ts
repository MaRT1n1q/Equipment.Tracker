import { BrowserWindow, app, session } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadWindowState, saveWindowState } from './windowState'

let cspConfigured = false

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function setupContentSecurityPolicy() {
  if (cspConfigured) {
    return
  }

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          app.isPackaged
            ? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;"
            : "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: http://localhost:*;",
        ],
      },
    })
  })

  cspConfigured = true
}

export function createMainWindow(): BrowserWindow {
  const windowState = loadWindowState()

  const preloadPath = path.join(__dirname, 'preload.js')

  const window = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
  })

  if (windowState.isMaximized) {
    window.maximize()
  }

  window.on('resize', () => saveWindowState(window))
  window.on('move', () => saveWindowState(window))
  window.on('close', () => saveWindowState(window))

  setupContentSecurityPolicy()

  if (!app.isPackaged && process.env.VITE_DEV_SERVER_URL) {
    window.loadURL(process.env.VITE_DEV_SERVER_URL)
    window.webContents.openDevTools()
  } else if (!app.isPackaged) {
    window.loadURL('http://localhost:5173')
    window.webContents.openDevTools()
  } else {
    window.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  return window
}
