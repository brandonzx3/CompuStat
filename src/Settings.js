import * as fs from "fs";
import { __dirname } from "./main.js";

const settingsFile = "settings.json";

export function init() {
    if(!fs.existsSync(settingsFile)) {
        let defaults = {
            TBAKey: ""
        }
        saveSettings(defaults);
    }
}

export function getSettings() {
    return JSON.parse(fs.readFileSync(settingsFile));
}

export function saveSettings(data) {
    try {
        fs.writeFileSync(settingsFile, JSON.stringify(data, null, 2));
    } catch(err) {
        console.err("Error Writing settings file:", err)
    }
}