const { app, BrowserWindow, shell, Menu, nativeImage } = require('electron')
const path = require('path')

const APP_URL = 'https://green-processing.vercel.app'

let mainWindow = null
let redDotIcon = null

function getIcons() {
  const iconPath = path.join(__dirname, 'icon.png')
  const redDotPath = path.join(__dirname, 'red_dot.png')
  try {
    redDotIcon = nativeImage.createFromPath(redDotPath)
  } catch (err) {
    console.warn('Could not load red dot overlay icon:', err)
  }
  return iconPath
}

function createWindow() {
  const appIconPath = getIcons()

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'Green Processing ERP',
    icon: appIconPath,
    backgroundColor: '#070C16',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false
    }
  })

  mainWindow.setTitle('Green Processing ERP')

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Listen to document.title updates from the web app
  mainWindow.on('page-title-updated', (event, title) => {
    event.preventDefault()

    const hasUnread = /\(\d+\)/.test(title) || title.includes('🔴') || (title.startsWith('(') && title.includes(')'))

    if (hasUnread) {
      mainWindow.setTitle(title)

      // Set red dot badge on Windows Taskbar icon
      if (process.platform === 'win32' && redDotIcon && !redDotIcon.isEmpty()) {
        mainWindow.setOverlayIcon(redDotIcon, 'Yangi xabar keldi')
      }

      // Flash taskbar button if app is in background or minimized
      if (!mainWindow.isFocused()) {
        mainWindow.flashFrame(true)
      }
    } else {
      mainWindow.setTitle('Green Processing ERP')
      if (process.platform === 'win32') {
        mainWindow.setOverlayIcon(null, '')
      }
      mainWindow.flashFrame(false)
    }
  })

  mainWindow.on('focus', () => {
    mainWindow.flashFrame(false)
  })

  // Safe external links - open external sites in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://green-processing.vercel.app')) {
      return { action: 'allow' }
    }
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Load cloud app
  mainWindow.loadURL(APP_URL).catch((err) => {
    console.warn('Tarmoqqa ulanish kutilmoqda, qayta urinilmoqda...', err)
    setTimeout(() => {
      if (mainWindow) mainWindow.loadURL(APP_URL)
    }, 3000)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    // Set AppUserModelId for clean Windows taskbar notification grouping
    if (process.platform === 'win32') {
      app.setAppUserModelId('uz.greenprocessing.erp')
    }

    const template = [
      {
        label: 'View',
        submenu: [
          { role: 'reload', accelerator: 'Ctrl+R' },
          { role: 'forceReload', accelerator: 'Ctrl+Shift+R' },
          { type: 'separator' },
          { role: 'resetZoom', accelerator: 'Ctrl+0' },
          { role: 'zoomIn', accelerator: 'Ctrl+=' },
          { role: 'zoomOut', accelerator: 'Ctrl+-' },
          { type: 'separator' },
          { role: 'togglefullscreen', accelerator: 'F11' }
        ]
      }
    ]
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)

    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
