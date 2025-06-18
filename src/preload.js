const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron
});

contextBridge.exposeInMainWorld("COMPUSTAT", {
    currentSeason: () => ipcRenderer.invoke("currentSeason"),
    TBAstatus: () => ipcRenderer.invoke("TBAstatus"),
    getSeasonStats: () => ipcRenderer.invoke('getSeasonStats')
});

contextBridge.exposeInMainWorld("SETTINGS", {
    getSettings: () => ipcRenderer.invoke("getSettings"),
    saveSettings: (value) => ipcRenderer.invoke("saveSettings", value)
})

contextBridge.exposeInMainWorld("TEAMDATA", {
    getEPABatch: (teamNumbers) => ipcRenderer.invoke('get-epa-batch', teamNumbers),
})