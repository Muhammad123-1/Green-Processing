const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  setBadge: (count) => {
    try {
      ipcRenderer.send('update-badge', count)
    } catch (e) {
      console.warn('Electron IPC error:', e)
    }
  },
  notify: (title, body) => {
    try {
      ipcRenderer.send('desktop-notify', { title, body })
    } catch (e) {
      console.warn('Electron notify error:', e)
    }
  }
})
