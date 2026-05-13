const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('courseMera', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    getFolder: () => ipcRenderer.invoke('get-folder'),
    setFolder: (folder) => ipcRenderer.invoke('set-folder', folder),
    scanCourses: () => ipcRenderer.invoke('scan-courses'),
    checkUpdates: () => ipcRenderer.invoke('check-updates'),
    getVersion: () => ipcRenderer.invoke('get-version'),
    
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
    installUpdate: () => ipcRenderer.invoke('install-update')
});