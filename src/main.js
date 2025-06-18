import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import * as blueAlliance from './BlueAllianceAPI.js';
import * as settings from "./Settings.js"

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

app.whenReady().then(() => {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    settings.init();

    win.loadFile(path.join(__dirname, "index.html"));

    handleMatchBuilder();

    ipcMain.handle("openMatchBuilder", () => {
        console.log("loading match builder");
        win.loadFile(path.join(__dirname, "matchbuilder/matchBuilder.html"));
    });

    ipcMain.handle("currentSeason", async () => {
        const result = await blueAlliance.sendRequest("status");
        if(result == null) return null;
        return result.current_season;
    })

    ipcMain.handle("TBAstatus", async () => {
        return await blueAlliance.sendRequest("status");
    })

    ipcMain.handle("getSettings", () => settings.getSettings())
    ipcMain.handle("saveSettings", (_event, value) => settings.saveSettings(value))
})

function handleMatchBuilder() {
    ipcMain.handle("ping", async () => await blueAlliance.sendRequest("status"))
}