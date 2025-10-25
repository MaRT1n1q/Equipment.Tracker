const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getRequests: () => ipcRenderer.invoke('get-requests'),
  createRequest: (data) => ipcRenderer.invoke('create-request', data),
  updateRequest: (id, data) => ipcRenderer.invoke('update-request', id, data),
  updateIssued: (id, is_issued) => ipcRenderer.invoke('update-issued', id, is_issued),
  deleteRequest: (id) => ipcRenderer.invoke('delete-request', id),
  restoreRequest: (request) => ipcRenderer.invoke('restore-request', request),
  createBackup: () => ipcRenderer.invoke('create-backup'),
  restoreBackup: () => ipcRenderer.invoke('restore-backup')
})
