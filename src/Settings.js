import * as fs from "fs";
import { __dirname } from "./main.js";
import path from 'path';

var settingsFile;

export function init(dir) {
    settingsFile = path.join(dir, "settings.json")
    console.log(settingsFile);
    if(!fs.existsSync(settingsFile)) {
        let defaults = {
            TBAKey: ""
        }
        saveSettings(defaults);
    }
}

export function getSettings() {
    try {
        return JSON.parse(fs.readFileSync(settingsFile));
    } catch(err) {
        console.error(err)
        saveSettings({});
        return{}
    }
}

export function saveSettings(data) {
    console.log(data)
    try {
        fs.writeFileSync(settingsFile, JSON.stringify(data, null, 2));
    } catch(err) {
        console.err("Error Writing settings file:", err)
    }
}