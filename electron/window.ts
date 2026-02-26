import { BrowserWindow, app, session, Menu, shell } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadWindowState, saveWindowState } from './windowState'
import { attachWindowStateBroadcast } from './ipc/windowControls'

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
            ? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src * ws: wss: http: https:;"
            : "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src * ws: wss: http: https:;",
        ],
      },
    })
  })

  cspConfigured = true
}

export function createMainWindow(): BrowserWindow {
  const windowState = loadWindowState()

  const preloadPath = path.join(__dirname, 'preload.js')

  const isMac = process.platform === 'darwin'

  const window = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 800,
    minHeight: 600,
    ...(isMac
      ? {
          titleBarStyle: 'hiddenInset' as const,
          trafficLightPosition: { x: 12, y: 12 },
        }
      : {
          frame: false,
        }),
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

  attachWindowStateBroadcast(window)

  window.webContents.on('context-menu', (_event, params) => {
    const selection = params.selectionText.trim()
    if (!selection) {
      return
    }

    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'Копировать',
        role: 'copy',
      },
    ]

    const sdMatch =
      selection.match(/(?:^|\b)sd\s*(\d{3,})(?:\b|$)/i) ?? selection.match(/^(\d{3,})$/)
    if (sdMatch) {
      const sdNumber = sdMatch[1]
      template.push({
        label: 'Открыть в браузере',
        click: () => {
          void shell.openExternal(`https://forge.tcsbank.ru/case/${sdNumber}/info`)
        },
      })
    }

    const menu = Menu.buildFromTemplate(template)

    menu.popup({ window })
  })

  // Флаг для определения, действительно ли нужно закрыть приложение
  let isQuitting = false

  // Слушаем событие before-quit для установки флага
  app.on('before-quit', () => {
    isQuitting = true
  })

  // Перехватываем событие закрытия окна
  window.on('close', (event) => {
    if (!isQuitting) {
      // Предотвращаем закрытие окна
      event.preventDefault()
      // Сворачиваем в трей
      window.hide()
      // Сохраняем состояние окна
      saveWindowState(window)
    } else {
      // Разрешаем закрытие при выходе из приложения
      saveWindowState(window)
    }
  })

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
