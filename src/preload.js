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
    getEPABatch: (teamNumbers) => ipcRenderer.invoke('getEpaBatch', teamNumbers),
    getTeam: (teamNumber) => ipcRenderer.invoke("getTeam", teamNumber)
})

contextBridge.exposeInMainWorld("PicklistAPI", {
    loadAll: () => ipcRenderer.invoke("picklist:loadAll"),
    save: (data) => ipcRenderer.invoke("picklist:save", data),
    getTeams: (eventCode) => ipcRenderer.invoke("picklist:getTeams", eventCode),
    getTeamData: (eventCode) => ipcRenderer.invoke("picklist:getTeamData", eventCode),
});

ipcRenderer.on("show-notification", (_, data) => {
  window.dispatchEvent(new CustomEvent("notify", { detail: data }));
});