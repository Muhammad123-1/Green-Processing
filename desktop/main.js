const { app, BrowserWindow, shell, Menu, nativeImage, Tray, ipcMain, Notification } = require('electron')
const path = require('path')

const APP_URL = 'https://green-processing.vercel.app'

let mainWindow = null
let tray = null

const normalIconPath = path.join(__dirname, 'icon.png')
const badgedIconPath = path.join(__dirname, 'icon_badge.png')
const redDotPath = path.join(__dirname, 'red_dot.png')

let normalIcon = null
let badgedIcon = null
let redDotIcon = null

function loadIcons() {
  try {
    normalIcon = nativeImage.createFromPath(normalIconPath)
    badgedIcon = nativeImage.createFromPath(badgedIconPath)
    redDotIcon = nativeImage.createFromPath(redDotPath)
  } catch (err) {
    console.warn('Icon load error:', err)
  }
}

function updateAppBadge(count) {
  const num = typeof count === 'number' ? count : parseInt(count, 10) || 0

  if (num > 0) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      // 1. Swap taskbar icon to BADGED version (Guaranteed red dot on every Windows taskbar)
      if (badgedIcon && !badgedIcon.isEmpty()) {
        mainWindow.setIcon(badgedIcon)
      }
      // 2. Also try native Windows Taskbar overlay icon
      if (process.platform === 'win32' && redDotIcon && !redDotIcon.isEmpty()) {
        mainWindow.setOverlayIcon(redDotIcon, `${num} ta yangi xabar`)
      }
      // 3. Flash taskbar button if not focused
      if (!mainWindow.isFocused()) {
        mainWindow.flashFrame(true)
      }
    }

    // 4. Update System Tray icon if present
    if (tray && !tray.isDestroyed() && badgedIcon) {
      tray.setImage(badgedIcon)
      tray.setToolTip(`Green Processing ERP (${num} ta yangi xabarnoma)`)
    }
  } else {
    // Revert to clean normal icon
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (normalIcon && !normalIcon.isEmpty()) {
        mainWindow.setIcon(normalIcon)
      }
      if (process.platform === 'win32') {
        mainWindow.setOverlayIcon(null, '')
      }
      mainWindow.flashFrame(false)
    }

    if (tray && !tray.isDestroyed() && normalIcon) {
      tray.setImage(normalIcon)
      tray.setToolTip('Green Processing ERP')
    }
  }
}

function createTray() {
  if (tray) return
  try {
    tray = new Tray(normalIconPath)
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Green Processing ERP',
        click: () => {
          if (mainWindow) {
            mainWindow.show()
            mainWindow.focus()
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Chiqish',
        click: () => {
          app.isQuitting = true
          app.quit()
        }
      }
    ])
    tray.setToolTip('Green Processing ERP')
    tray.setContextMenu(contextMenu)
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.focus()
        } else {
          mainWindow.show()
        }
      }
    })
  } catch (err) {
    console.warn('Tray init error:', err)
  }
}

function createWindow() {
  loadIcons()

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'Green Processing ERP',
    icon: normalIconPath,
    backgroundColor: '#070C16',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      spellcheck: false
    }
  })

  mainWindow.setTitle('Green Processing ERP')

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Title update fallback
  mainWindow.on('page-title-updated', (event, title) => {
    event.preventDefault()
    const match = title.match(/\((\d+)\)/)
    const count = match ? parseInt(match[1], 10) : (title.includes('🔴') ? 1 : 0)
    updateAppBadge(count)
    mainWindow.setTitle(title)
  })

  mainWindow.on('focus', () => {
    mainWindow.flashFrame(false)
  })

  // Safe external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://green-processing.vercel.app')) {
      return { action: 'allow' }
    }
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Load cloud ERP
  mainWindow.loadURL(APP_URL).catch((err) => {
    console.warn('Tarmoqqa ulanish kutilmoqda, qayta urinilmoqda...', err)
    setTimeout(() => {
      if (mainWindow) mainWindow.loadURL(APP_URL)
    }, 3000)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  createTray()
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  // Handle IPC from web app
  ipcMain.on('update-badge', (event, count) => {
    updateAppBadge(count)
  })

  ipcMain.on('desktop-notify', (event, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({
        title: title || 'Green Processing ERP',
        body: body || 'Yangi xabar keldi',
        icon: badgedIconPath
      }).show()
    }
  })

  app.whenReady().then(() => {
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
