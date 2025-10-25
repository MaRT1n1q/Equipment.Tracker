const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getRequests: () => ipcRenderer.invoke('get-requests'),
  createRequest: (data) => ipcRenderer.invoke('create-request', data),
  updateIssued: (id, is_issued) => ipcRenderer.invoke('update-issued', id, is_issued),
  deleteRequest: (id) => ipcRenderer.invoke('delete-request', id)
})
