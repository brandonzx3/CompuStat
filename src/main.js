import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import * as blueAlliance from './util/BlueAllianceAPI.js';
import * as statbotics from './util/StatboticsAPI.js'
import * as settings from "./Settings.js"

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    win.loadFile(path.join(__dirname, "index.html"));

}

app.whenReady().then(() => {

    settings.init(app.getPath('userData'));

    ipcMain.handle("currentSeason", async () => {
        const result = await blueAlliance.sendRequest("status");
        if(result == null) return null;
        return result.current_season;
    })

    ipcMain.handle("TBAstatus", async () => {
        return await blueAlliance.sendRequest("status", settings.getSettings().TBAKey);
    })

    ipcMain.handle("getSettings", () => settings.getSettings())
    ipcMain.handle("saveSettings", (_event, value) => settings.saveSettings(value))

    handleTeamStats();

    createWindow();
});

function handleTeamStats() {
    ipcMain.handle('getEpaBatch', async (_event, teamNumbers) => {
        let season = settings.getSettings().season
        const results = await Promise.all(teamNumbers.map(num => statbotics.getTeamEPA(num, season)));
        return results;
    });

    ipcMain.handle("getTeam", async (_event, teamNumber) => {
        const [statboticsData, tbaData] = await Promise.all([
            statbotics.getTeam(teamNumber, settings.getSettings().season),
            blueAlliance.getTeam(teamNumber, settings.getSettings().TBAKey)
        ]);
        
        return {
            name: tbaData.nickname,
            fullName: tbaData.name,
            state: tbaData.state_prov,
            city: tbaData.city,
            country: tbaData.country,
            number: tbaData.team_number,
            rookie_year: tbaData.rookie_year,
            school_name: tbaData.school_name,
            website: tbaData.website,
            epa: statboticsData.epa
        }
    });

    ipcMain.handle('getSeasonStats', async () => {
        const statusRequest = await blueAlliance.sendRequest("status", settings.getSettings().TBAKey);
        if (statusRequest == null) return null;

        const [teams, events, topTeam] = await Promise.all([
            statbotics.getTeams(statusRequest.current_season),
            blueAlliance.getEvents(statusRequest.current_season, settings.getSettings().TBAKey),
            statbotics.getTopTeam(statusRequest.current_season)
        ]);

        if (!Array.isArray(teams) || teams.length === 0) {
            console.error("getTeams returned invalid array", teams);
            return {
            totalTeams: 0,
            totalEvents: events.length || 0,
            topTeam: null,
            avgEPA: 0
            };
        }

        const totalEPA = teams.reduce((sum, t) => sum + (t.epa?.total_points?.mean || 0), 0);
        const avgEPA = totalEPA / teams.length;

        return {
            totalTeams: teams.length,
            totalEvents: events.length || 0,
            topTeam: topTeam
            ? {
                number: topTeam.team,
                epa: topTeam.epa?.total_points?.mean || 0
                }
            : null,
            avgEPA: avgEPA.toFixed(2)
        };
    });
}