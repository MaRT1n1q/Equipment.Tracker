const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getRequests: () => ipcRenderer.invoke('get-requests'),
  createRequest: (data) => ipcRenderer.invoke('create-request', data),
  updateRequest: (id, data) => ipcRenderer.invoke('update-request', id, data),
  updateIssued: (id, is_issued) => ipcRenderer.invoke('update-issued', id, is_issued),
  deleteRequest: (id) => ipcRenderer.invoke('delete-request', id),
  restoreRequest: (request) => ipcRenderer.invoke('restore-request', request),
  createBackup: () => ipcRenderer.invoke('create-backup'),
  restoreBackup: () => ipcRenderer.invoke('restore-backup'),
  // Employee Exit API
  getEmployeeExits: () => ipcRenderer.invoke('get-employee-exits'),
  createEmployeeExit: (data) => ipcRenderer.invoke('create-employee-exit', data),
  updateEmployeeExit: (id, data) => ipcRenderer.invoke('update-employee-exit', id, data),
  deleteEmployeeExit: (id) => ipcRenderer.invoke('delete-employee-exit', id),
  updateExitCompleted: (id, is_completed) =>
    ipcRenderer.invoke('update-exit-completed', id, is_completed),
})
