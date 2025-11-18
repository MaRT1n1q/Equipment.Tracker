import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let tray: Tray | null = null

export function createTray(getWindow: () => BrowserWindow | null): Tray {
  // Если трей уже существует, не создаём новый
  if (tray) {
    console.log('Tray already exists, skipping creation')
    return tray
  }
  // Определяем путь к иконке в зависимости от платформы и режима
  let iconPath: string

  if (app.isPackaged) {
    // В упакованном приложении
    if (process.platform === 'win32') {
      iconPath = path.join(process.resourcesPath, 'icon.ico')
    } else if (process.platform === 'darwin') {
      iconPath = path.join(process.resourcesPath, 'icon.icns')
    } else {
      iconPath = path.join(process.resourcesPath, 'icon.png')
    }
  } else {
    // В режиме разработки
    if (process.platform === 'win32') {
      iconPath = path.join(__dirname, '../build/icon.ico')
    } else if (process.platform === 'darwin') {
      iconPath = path.join(__dirname, '../build/icon.icns')
    } else {
      iconPath = path.join(__dirname, '../build/icon.png')
    }
  }

  console.log('Tray icon path:', iconPath)

  // Создаем иконку для трея
  const icon = nativeImage.createFromPath(iconPath)

  if (icon.isEmpty()) {
    console.error('Failed to load tray icon from:', iconPath)
  }

  // Для Windows не нужно изменять размер .ico файла
  tray = new Tray(icon)
  tray.setToolTip('Equipment Tracker')

  // Создаем контекстное меню для трея
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Открыть',
      click: () => {
        const window = getWindow()
        if (window) {
          if (window.isMinimized()) {
            window.restore()
          }
          window.show()
          window.focus()
        }
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Выход',
      click: () => {
        // Устанавливаем флаг для полного выхода
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)

  // Обработчик клика по иконке трея (для macOS чаще используется одиночный клик)
  tray.on('click', () => {
    const window = getWindow()
    if (window) {
      if (window.isVisible()) {
        // На macOS при клике скрываем, если окно видимо
        if (process.platform === 'darwin') {
          window.hide()
        }
      } else {
        if (window.isMinimized()) {
          window.restore()
        }
        window.show()
        window.focus()
      }
    }
  })

  // Обработчик двойного клика по иконке трея (для Windows)
  tray.on('double-click', () => {
    const window = getWindow()
    if (window) {
      if (window.isVisible()) {
        window.hide()
      } else {
        if (window.isMinimized()) {
          window.restore()
        }
        window.show()
        window.focus()
      }
    }
  })

  return tray
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}

export function getTray(): Tray | null {
  return tray
}
