const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  submitForm: (data) => ipcRenderer.invoke('submit-form', data),
  shutdown: () => ipcRenderer.send('system-shutdown'),
  unlock: () => ipcRenderer.send('unlock-pc'),
  checkFormSubmitted: () => ipcRenderer.invoke('check-form-submitted'),
  
  // Admin Features
  getLogs: () => ipcRenderer.invoke('get-logs'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  
  // Listeners
  onInitConfig: (callback) => ipcRenderer.on('init-config', (event, config) => callback(config)),
  onConfigUpdated: (callback) => ipcRenderer.on('config-updated', (event, config) => callback(config)),
  onFormSubmittedCheck: (callback) => ipcRenderer.on('form-submitted-check', (event, isSubmitted) => callback(isSubmitted)),
  
  // Security - prevent default keyboard behaviors
  blockKeyboardShortcuts: () => {
    document.addEventListener('keydown', (e) => {
      if (['Escape', 'F11', 'F12', 'F5'].includes(e.key)) {
        e.preventDefault();
      }
    }, true);
  }
});
