import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import * as blueAlliance from './util/BlueAllianceAPI.js';
import * as statbotics from './util/StatboticsAPI.js'
import * as settings from "./Settings.js"
import * as fs from "fs";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

let win;
let currentSeason;

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    win.loadFile(path.join(__dirname, "index.html"));

}

app.whenReady().then(async () => {
    settings.init(app.getPath('userData'));
    console.log(settings.getSettings());

    currentSeason = await getCurrentSeason();
    console.log(currentSeason);

    ipcMain.handle("currentSeason", () => {
        return currentSeason;
    });

    ipcMain.handle("TBAstatus", async () => {
        return await blueAlliance.sendRequest("status", settings.getSettings().TBAKey);
    })

    ipcMain.handle("getSettings", () => settings.getSettings())
    ipcMain.handle("saveSettings", (_event, value) => settings.saveSettings(value))

    handleTeamStats();
    handlePicklist();

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
            epa: statboticsData.epa,
            record: statboticsData.record
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

function getPicklistPath(eventCode, name) {
    return path.join(app.getPath("userData"), "picklists", `${eventCode}-${name}.json`);
}

async function getCombinedTeamData(eventCode) {
    const tbaKey = settings.getSettings().TBAKey;
    try {
        const tbaTeams = await blueAlliance.getTeamsAtEvent(eventCode, tbaKey);
        if (!Array.isArray(tbaTeams)) throw new Error("Failed to fetch TBA team list.");

        const oprsData = await blueAlliance.getOPRs(eventCode, tbaKey);
        const oprs = oprsData?.oprs || {};
        const dprs = oprsData?.dprs || {};
        const ccwms = oprsData?.ccwms || {};

        const result = [];

        for(const team of tbaTeams) {
            const teamNumber = team.team_number;
            const teamKey = `frc${teamNumber}`;
            const epaBreakdown = await statbotics.getEPABreakdown(teamNumber, eventCode);

            result.push({
                teamNumber: teamNumber,
                nickname: team.nickname || team.name || `Team ${teamNumber}`,
                opr: oprs[teamKey] ?? 0,
                dpr: dprs[teamKey] ?? 0,
                ccwm: ccwms[teamKey] ?? 0,
                epaBreakdown: epaBreakdown
            });
        }
        return result;
    } catch(err) {
        console.error(`Error in getCombinedTeamData(${eventCode}):`, err);
        return [];
    }
}

function handlePicklist() {
    ipcMain.handle("picklist:save", (_event, picklistData) => {
        const filePath = getPicklistPath(picklistData.eventCode, picklistData.name);
        try {
            fs.writeFileSync(filePath, JSON.stringify(picklistData, null, 2));
            sendNotification("Saved", "Picklist saved successfully", "#28a745");
        } catch(e) {
            sendNotification("Failed", "Picklist failed to save", "#eb4034");
        }
        return true;
    });

    ipcMain.handle("picklist:loadAll", () => {
        const dir = path.join(app.getPath("userData"), "picklists");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
        console.log(files);
        return files.map(file => {
            const content = fs.readFileSync(path.join(dir, file), "utf-8");
            return JSON.parse(content);
        });
    });

    ipcMain.handle("picklist:getTeams", async (event, eventCode) => {
        const res = await fetch(`https://api.statbotics.io/v3/event/${eventCode}/teams`);
        return await res.json();
    });

    ipcMain.handle("picklist:getTeamData", async (event, eventCode) => {
        return await getCombinedTeamData(eventCode);
    });
}

function sendNotification(title, message, color) {
    win.webContents.send("show-notification", {
        title: title,
        message: message,
        color: color
    });
}

async function getCurrentSeason() {
    const result = await blueAlliance.sendRequest("status");
    if(result == null) return null;
    return result.current_season;
}