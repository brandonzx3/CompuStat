const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron
});

contextBridge.exposeInMainWorld("COMPUTSTAT", {
    openMatchBuilder: () => ipcRenderer.invoke("openMatchBuilder"),
    currentSeason: () => ipcRenderer.invoke("currentSeason"),
    TBAstatus: () => ipcRenderer.invoke("TBAstatus")
});

contextBridge.exposeInMainWorld("SETTINGS", {
    getSettings: () => ipcRenderer.invoke("getSettings"),
    saveSettings: (value) => ipcRenderer.invoke("saveSettings", value)
})

contextBridge.exposeInMainWorld("MATCHBUILDER", {
    ping: () => ipcRenderer.invoke("ping")
})