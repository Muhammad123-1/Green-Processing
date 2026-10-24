const { app, BrowserWindow, shell, Menu } = require('electron')
const path = require('path')

const APP_URL = 'https://green-processing.vercel.app'

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'Green Processing ERP',
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

  // Prevent title flashing
  mainWindow.setTitle('Green Processing ERP')

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('page-title-updated', (e) => {
    e.preventDefault()
  })

  // Safe external links - open standard external sites in default browser
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

// Single instance lock - prevent opening multiple conflicting windows
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
    // Basic application menu with keyboard shortcuts (Reload, DevTools, Fullscreen)
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
