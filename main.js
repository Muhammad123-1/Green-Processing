const { app, BrowserWindow } = require('electron')
const path = require('path')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true, // Tepadagi menyularni yashirish
    webPreferences: {
      nodeIntegration: true,
    },
    // icon: path.join(__dirname, 'public/favicon.ico')
  })

  // Next.js serverini orqa fonda ishga tushirish
  require('./server.js')

  // Server yonishini kutib, keyin sahifani ochish
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000').catch(err => {
      console.log("Qayta urinish...");
      setTimeout(() => mainWindow.loadURL('http://localhost:3000'), 3000);
    });
  }, 4000)
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
